import { css, FASTElement, html, observable, ref } from "@microsoft/fast-element"

/* 🖼️ Resolved the same way the note resolves its images — from the logical path
   stored in the note, against the media server — so no port-specific URL ever has
   to travel from the note, through Unity, to here. */
function resolveMediaUrl(src: string | null): string | null {
    if (!src) return null

    if (
        src.startsWith("/") ||
        src.startsWith("http") ||
        src.startsWith("data:") ||
        src.startsWith("blob:")
    ) {
        return src
    }

    return `${window.MediaConfig.baseUrl}/media/image/${src}`
}

/* A picture never opens larger than life: fit shrinks a big image to the screen and
   leaves a small one alone, which is what the old max-width/max-height did. */
const MAX_SCALE = 8

/* 🎡 ZFBrowser caps scroll at 15 events a second and adds up the deltas in between
   (BrowserInput.FeedScrolling), so a wheel event here can carry several notches at
   once. Zooming by a power of the step keeps that invisible: one lumped delta of
   three notches lands exactly where three separate notches would have. */
const ZOOM_STEP = 1.15
const WHEEL_NOTCH = 120
const MAX_NOTCHES_PER_EVENT = 4

/* Below this a press-and-release is a click that closes the viewer; above it, it was
   a pan that happened to end over the backdrop. */
const DRAG_THRESHOLD_PX = 4

const KEYBOARD_PAN_PX = 80

/* The host is fixed to the whole viewport, so this is the backdrop's size too — asked
   of the window rather than the element, which reads 0 while the backdrop is hidden. */
function viewport() {
    return { vw: window.innerWidth, vh: window.innerHeight }
}

const styles = css`
    :host {
        position: fixed;
        inset: 0;
    }

    .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.94);
        overflow: hidden;
    }

    .backdrop[hidden] {
        display: none;
    }

    /* 🎞️ Zoom from the wheel or the keyboard glides; dragging must stay pinned to the
       hand, and the first fit must not slide in from wherever the last picture sat —
       so the easing is a class, switched on only for the former. */
    .picture.smooth {
        transition: transform 130ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .picture {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: 0 0;
        display: block;
        /* The transform does all the sizing; the old fit caps would fight it. */
        max-width: none;
        max-height: none;
        user-select: none;
        -webkit-user-drag: none;
    }

    .close {
        position: absolute;
        top: 1.4rem;
        right: 1.4rem;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: white;
        font-size: 1.4rem;
        line-height: 1;
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 0.2rem;
        cursor: pointer;
    }

    .close:hover {
        background: rgba(255, 255, 255, 0.3);
    }
`

const template = html<FullscreenViewer>`
    <div
        class="backdrop"
        ?hidden="${x => !x.resolvedSrc}"
        @mousedown="${(x, c) => x.onPointerDown(c.event as MouseEvent)}"
        @wheel="${(x, c) => x.onWheel(c.event as WheelEvent)}"
        @click="${x => x.onBackdropClicked()}">
        <img
            ${ref("picture")}
            class="picture"
            draggable="false"
            src="${x => x.resolvedSrc ?? ''}"
            @click="${(_, c) => c.event.stopPropagation()}" />
        <button
            class="close"
            @click="${x => x.close()}">&#x2715;</button>
    </div>
`

export class FullscreenViewer extends FASTElement {
    @observable resolvedSrc: string | null = null

    /* Kept so the picture can be resolved again if the media server announces itself
       after we were already asked to show something. */
    logicalSrc: string | null = null

    picture: HTMLImageElement

    /* 🔍 The whole view state: where the top-left of the picture sits in the backdrop,
       and how large it is drawn. fitScale is also the floor — you cannot zoom out past
       the whole picture being visible. */
    private scale: number = 1
    private fitScale: number = 1
    private offsetX: number = 0
    private offsetY: number = 0

    private isPanning: boolean = false
    private panStartX: number = 0
    private panStartY: number = 0
    private panDistance: number = 0
    private didPan: boolean = false

    connectedCallback(): void {
        super.connectedCallback()

        this.picture.addEventListener("load", () => this.fitToScreen())

        window.addEventListener("mousemove", this._onPointerMove)
        window.addEventListener("mouseup", this._onPointerUp)
        window.addEventListener("keydown", this._onKeyDown)
        window.addEventListener("resize", this._onResize)
    }

    disconnectedCallback(): void {
        window.removeEventListener("mousemove", this._onPointerMove)
        window.removeEventListener("mouseup", this._onPointerUp)
        window.removeEventListener("keydown", this._onKeyDown)
        window.removeEventListener("resize", this._onResize)

        super.disconnectedCallback()
    }

    show(src: string) {
        this.logicalSrc = src
        this.resolvedSrc = resolveMediaUrl(src)

        // A fresh look starts fitted, never inheriting the last picture's zoom. If the
        // image is already decoded no load event follows, so fit here as well.
        this.fitToScreen()
    }

    /* Unity taking the viewer back down — it already knows, so stay quiet. */
    hide() {
        this.logicalSrc = null
        this.resolvedSrc = null
        this.isPanning = false
    }

    /* The player taking it down, by the ✕ or by clicking away from the picture.
       Escape is handled on the Unity side: while the viewer is up it holds the UI
       input handler, so Escape closes this rather than ending the note's editing. */
    close() {
        this.hide()
        try {
            window.OnFullscreenViewerClosed()
        } catch {
            /* not registered outside Unity */
        }
    }

    refreshMediaUrl() {
        if (!this.logicalSrc) return
        this.resolvedSrc = resolveMediaUrl(this.logicalSrc)
    }

    /* ---------- view state ---------- */

    fitToScreen(smooth: boolean = false) {
        const fit = this.computeFitScale()
        if (fit === null) return

        this.setSmooth(smooth)

        this.fitScale = fit
        this.scale = fit

        this.clampOffsets()
        this.applyTransform()
    }

    /* Shrink to fit with a small margin, but never enlarge past life size — the same
       thing the old max-width/max-height did. Null when there is nothing to measure. */
    private computeFitScale(): number | null {
        const { naturalWidth: nw, naturalHeight: nh } = this.picture
        const { vw, vh } = viewport()

        if (!nw || !nh || !vw || !vh) return null

        return Math.min((vw * 0.96) / nw, (vh * 0.96) / nh, 1)
    }

    zoomAbout(anchorX: number, anchorY: number, factor: number) {
        const { naturalWidth: nw } = this.picture
        if (!nw) return

        const next = Math.min(Math.max(this.scale * factor, this.fitScale), MAX_SCALE)
        if (next === this.scale) return

        // Keep whatever sits under the anchor exactly where it is.
        const ratio = next / this.scale
        this.offsetX = anchorX - (anchorX - this.offsetX) * ratio
        this.offsetY = anchorY - (anchorY - this.offsetY) * ratio
        this.scale = next

        this.clampOffsets()
        this.applyTransform()
    }

    zoomAboutCentre(factor: number) {
        this.setSmooth(true)
        const { vw, vh } = viewport()
        this.zoomAbout(vw / 2, vh / 2, factor)
    }

    panBy(dx: number, dy: number) {
        this.offsetX += dx
        this.offsetY += dy
        this.clampOffsets()
        this.applyTransform()
    }

    /* An axis smaller than the screen is centred on it; a larger one may be dragged,
       but not so far that an edge wanders inside the screen. */
    private clampOffsets() {
        const width = this.picture.naturalWidth * this.scale
        const height = this.picture.naturalHeight * this.scale
        const { vw, vh } = viewport()

        this.offsetX =
            width <= vw
                ? (vw - width) / 2
                : Math.min(0, Math.max(vw - width, this.offsetX))

        this.offsetY =
            height <= vh
                ? (vh - height) / 2
                : Math.min(0, Math.max(vh - height, this.offsetY))
    }

    private setSmooth(on: boolean) {
        this.picture.classList.toggle("smooth", on)
    }

    private applyTransform() {
        this.picture.style.transform =
            `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`
    }

    /* ---------- input ---------- */

    onWheel(event: WheelEvent) {
        event.preventDefault()
        if (!this.resolvedSrc) return

        const notches = Math.max(
            -MAX_NOTCHES_PER_EVENT,
            Math.min(MAX_NOTCHES_PER_EVENT, event.deltaY / WHEEL_NOTCH)
        )
        if (notches === 0) return

        // Scrolling away from you (negative deltaY) zooms in, as everywhere else.
        this.setSmooth(true)
        this.zoomAbout(event.clientX, event.clientY, Math.pow(ZOOM_STEP, -notches))
    }

    onPointerDown(event: MouseEvent) {
        if (!this.resolvedSrc) return

        this.isPanning = true
        this.didPan = false
        this.panDistance = 0
        this.panStartX = event.clientX
        this.panStartY = event.clientY
    }

    private _onPointerMove = (event: MouseEvent) => {
        if (!this.isPanning) return

        const dx = event.clientX - this.panStartX
        const dy = event.clientY - this.panStartY
        this.panStartX = event.clientX
        this.panStartY = event.clientY

        this.panDistance += Math.abs(dx) + Math.abs(dy)
        if (this.panDistance > DRAG_THRESHOLD_PX) this.didPan = true

        this.setSmooth(false)
        this.panBy(dx, dy)
    }

    private _onPointerUp = () => {
        this.isPanning = false
    }

    /* Only a press that stayed put, and landed off the picture, closes the viewer —
       otherwise letting go of a pan would take the picture down with it, and once
       zoomed in there would be nowhere safe to click at all. */
    onBackdropClicked() {
        if (this.didPan) {
            this.didPan = false
            return
        }

        this.close()
    }

    /* The game window changed size. A picture that was filling the screen should still
       fill the new one; a zoomed-in picture keeps its zoom and is only nudged back
       inside the new bounds. */
    private _onResize = () => {
        if (!this.resolvedSrc) return

        const fit = this.computeFitScale()
        if (fit === null) return

        const wasFitted = this.scale === this.fitScale

        this.setSmooth(false)
        this.fitScale = fit
        this.scale = wasFitted ? fit : Math.max(this.scale, fit)

        this.clampOffsets()
        this.applyTransform()
    }

    private _onKeyDown = (event: KeyboardEvent) => {
        if (!this.resolvedSrc) return

        switch (event.key) {
            case "0":
                this.fitToScreen(true)
                break
            case "1":
                this.zoomAboutCentre(1 / this.scale)
                break
            case "+":
            case "=":
                this.zoomAboutCentre(ZOOM_STEP)
                break
            case "-":
                this.zoomAboutCentre(1 / ZOOM_STEP)
                break
            case "ArrowLeft":
                this.setSmooth(true)
                this.panBy(KEYBOARD_PAN_PX, 0)
                break
            case "ArrowRight":
                this.setSmooth(true)
                this.panBy(-KEYBOARD_PAN_PX, 0)
                break
            case "ArrowUp":
                this.setSmooth(true)
                this.panBy(0, KEYBOARD_PAN_PX)
                break
            case "ArrowDown":
                this.setSmooth(true)
                this.panBy(0, -KEYBOARD_PAN_PX)
                break
            default:
                return
        }

        event.preventDefault()
    }
}

FullscreenViewer.define({
    name: "fullscreen-viewer",
    template,
    styles,
    shadowOptions: { mode: "open", delegatesFocus: true },
})
