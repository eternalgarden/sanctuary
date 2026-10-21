import {
    FASTElement,
    css,
    customElement,
    html,
    observable,
    ref,
    when,
} from "@microsoft/fast-element"
import { filter, fromEvent, map, Subscription } from "rxjs"
import { LinkPressObserver } from "../../common/elements/LinkPressObserver"
import { ScrollThemePicker } from "./ScrollThemerPicker"
import { plainEditorTheme } from "./../styles/plain-editor-theme"
import { SET_BASIC_NOTE_INFO, SET_MAGIC_BOX_PATHS } from "../editor-fairy-events"
import * as moment from "moment"
import { FAIRY_BOX_MOVED } from "./Fairy-Box"
import { disableLinks } from "../../common/functions/disableLinksInDocument"
import { windcss } from "../../common/styles/wind"

const styles = css`
    ${plainEditorTheme} // TODO when custom editor themes
    ${windcss}
    
    div.window {
        position: relative;
        height: 100vh;
        width: 100vw;
        background-color: transparent;
    }

    div.container {
        user-select: none; // * 🦜 Disabling selection cos its useless here
        background-color: #ffffff0a;
    }

    div.left {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        padding-top: 0.5rem;
        padding-right: 1rem;
        gap: 1rem;
        visibility: hidden;
    }

    div.right {
        position: absolute;
        visibility: hidden;
    }

    /* contents */

    #noteInformation {
        width: 20vw;
    }

    #scrollTheme {
        width: 40vw;
        max-width: 30vw;
    }

    #noteDeletion {
        position: absolute;
        left: 1rem;
        bottom: 1rem;
        right: 1rem;
    }

    #magicBox {
        position: absolute;
        left: 1rem;
        top: 1rem;
        right: 1rem;
        max-height: 60%;
    }

    .magic-box-button {
        width: 100%;
        margin-top: 0.3rem;
    }

    /* \u{1F4CB} div.container kills selection globally, but these paths are the whole
       point of the box \u2014 a player needs to be able to read and copy them,
       especially on macOS where Finder will not show them ~/Library at all. */
    .magic-box-paths code {
        user-select: text;
        cursor: text;
        display: block;
        word-break: break-all;
        margin-bottom: 0.4rem;
    }

    .magic-box-paths dt {
        font-weight: bold;
        margin-top: 0.4rem;
    }

    .magic-box-paths dd {
        margin-left: 0;
    }

    .rename-section {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-top: 0.5rem;
    }

    .rename-section input {
        width: 100%;
        box-sizing: border-box;
    }

    .rename-success { color: #8f8; margin: 0; }
    .rename-error   { color: #f88; margin: 0; }
`

const template = html<EditorFairyRealm>`
    <div class="window">
        <div
            id="left-container"
            ${ref("leftContainer")}
            class="container left">
            <fairy-box
                id="noteInformation"
                emoji="💎">
                <span slot="title">Basic Note Information</span>
                <div>
                    <ul>
                        <li>
                            Filename: <code>${x => x.noteFilename}.html</code>
                        </li>
                        <li>
                            Created at: <code>${x => x.noteCreationDate}</code>
                        </li>
                    </ul>
                    <div class="flex flex-row">
                        <button
                            class="flex-grow-one"
                            @click=${ctx => ctx.onOpenFileButtonPressed()}>
                            Open File
                        </button>
                        <button
                            style="border-color: #000000;"
                            @click=${ctx =>
                                ctx.onToggleDeleteWindowButtonPressed()}>
                            Delete Note
                        </button>
                    </div>
                    <button
                        class="magic-box-button"
                        @click=${ctx =>
                            ctx.onToggleMagicBoxWindowButtonPressed()}>
                        Where is my data?
                    </button>
                    <div class="rename-section">
                        <input
                            ${ref("renameInput")}
                            data-allow-focus
                            type="text"
                            placeholder="New note name..." />
                        <button @click=${ctx => ctx.onRenameButtonPressed()}>
                            Rename
                        </button>
                        ${when(x => !!x.renameFeedback, html<EditorFairyRealm>`
                            <p class="${x => x.renameFeedbackIsError ? 'rename-error' : 'rename-success'}">
                                ${x => x.renameFeedback}
                            </p>
                        `)}
                    </div>
                </div>
            </fairy-box>
            <fairy-box
                id="scrollTheme"
                emoji="🎨">
                <span slot="title">Scroll Theme Picker</span>
                <scroll-theme-picker ${ref("scrollThemePicker")} />
            </fairy-box>
        </div>
        <div
            id="right-container"
            ${ref("rightContainer")}
            class="container right">
            <fairy-box
                id="magicBox"
                ?hidden=${cx => !cx.isMagicBoxWindowVisible}
                emoji="📦">
                <span slot="title">Your Magic Box</span>
                <div>
                    <p>
                        Everything you create in Sanctuary lives in one folder called your
                        <b>magic box</b> – all your notes, the images you drop in, your
                        custom scroll themes and any custom fonts you use here. Make sure to keep it backed up.
                    </p>

                    <dl class="magic-box-paths">
                        <dt>Your magic box</dt>
                        <dd><code>${x => x.magicBoxPath}</code></dd>
                        <dt>Drop fonts here</dt>
                        <dd><code>${x => x.fontsPath}</code></dd>
                        <dt>Scroll themes live here</dt>
                        <dd><code>${x => x.scrollThemesPath}</code></dd>
                    </dl>

                    <button @click=${ctx => ctx.onOpenMagicBoxButtonPressed()}>
                        Open my magic box
                    </button>

                    <p>
                        <b>On macOS</b> the magic box sits inside
                        <code>~/Library</code>, which Finder hides by default. Open it with the
                        button above. If you want to make it more accessible, you can drag that folder into your Finder sidebar.
                    </p>
                </div>
            </fairy-box>
            <fairy-box
                id="noteDeletion"
                ?hidden=${cx => !cx.isDeleteWindowVisible}
                emoji="🔥">
                <span slot="title">Note Deletion</span>
                <div>
                    <p>
                        Please note this is a <b>kind of</b> revertible action,
                        since all notes are version controlled by git, this note
                        will remain in its history.
                    </p>

                    <p>
                        However to either retrieve this note or to permanently
                        delete it you would currently need to possess
                        <code>git-wizardry skills</code>, restoring the note
                        would be rather easy, perma deleting it less so, but it
                        is regardles unrecommended because even git wizards make
                        mistakes and
                        <b>messing with git history is dangerous</b>.
                    </p>

                    <p>Acquiring git wizardry skills:</p>
                    <ul>
                        <li>
                            Apprentice:
                            <a
                                href="https://www.youtube.com/watch?v=BCQHnlnPusY"
                                >Git and GitHub for Poets by
                                <i>The Coding Train</i></a
                            >
                        </li>
                        <li>
                            Wizard:
                            <a
                                href="https://youtu.be/fWMKue-WBok?si=9aD_B5jI5DO-es-5"
                                >Git Internals by <i>Brief</i></a
                            >
                        </li>
                    </ul>

                    <p>
                        Should this be a more requested feature, a perma delete
                        option might appear here.
                    </p>

                    <button @click=${ctx => ctx.onDeleteButtonPressed()}>
                        delete note by pressing here
                    </button>
                </div>
            </fairy-box>
        </div>
    </div>
`

@customElement({
    name: "fairy-realm",
    template,
    styles,
})
export class EditorFairyRealm extends FASTElement {
    leftContainer: HTMLDivElement
    rightContainer: HTMLDivElement
    scrollThemePicker: ScrollThemePicker

    @observable noteFilename: string
    @observable noteCreationDate: string
    @observable isDeleteWindowVisible: boolean = false
    @observable isMagicBoxWindowVisible: boolean = false

    @observable magicBoxPath: string = ''
    @observable fontsPath: string = ''
    @observable scrollThemesPath: string = ''

    renameInput: HTMLInputElement
    @observable renameFeedback: string = ''
    @observable renameFeedbackIsError: boolean = false

    noteInfoSubscription: Subscription
    magicBoxPathsSubscription: Subscription
    fairyBoxMovedSubscription: Subscription
    linkPressObserver: LinkPressObserver

    connectedCallback(): void {
        super.connectedCallback()

        this.linkPressObserver = new LinkPressObserver()

        this.renameInput.addEventListener('focus', () => {
            try { window.OnUITextInputFocused() } catch {}
        })
        this.renameInput.addEventListener('blur', () => {
            try { window.OnUITextInputBlurred() } catch {}
        })

        this.noteInfoSubscription = fromEvent(document, SET_BASIC_NOTE_INFO)
            .pipe(
                map(next => next as CustomEvent),
                map(next => {
                    const { fileName, creationDate } = next.detail
                    // console.log(next.detail)
                    return { fileName, creationDate }
                })
            )
            .subscribe(next => {
                // console.log("🔮")
                this.noteFilename = next.fileName
                this.noteCreationDate = moment
                    .unix(next.creationDate)
                    .format("MMMM Do YYYY, h:mm:ss a")
            })

        this.magicBoxPathsSubscription = fromEvent(document, SET_MAGIC_BOX_PATHS)
            .pipe(map(next => (next as CustomEvent).detail))
            .subscribe(next => {
                this.magicBoxPath = next.magicBoxPath
                this.fontsPath = next.fontsPath
                this.scrollThemesPath = next.scrollThemesPath
            })

        this.fairyBoxMovedSubscription = fromEvent(
            document,
            FAIRY_BOX_MOVED
        ).subscribe(_ => window.RefreshTransparencyRectangles())

        document.documentElement.style.fontSize = `${window.devicePixelRatio*16}px`;
        // document.documentElement.style.fontSize = `32px`;
    }

    disconnectedCallback(): void {
        super.disconnectedCallback()

        this.noteInfoSubscription.unsubscribe()
        this.magicBoxPathsSubscription.unsubscribe()
        this.fairyBoxMovedSubscription.unsubscribe()
        this.linkPressObserver.dispose()
    }

    onRenameButtonPressed() {
        const suffix = this.sanitizeSuffix(this.renameInput.value)
        if (!suffix) {
            this.renameFeedback = 'Invalid name.'
            this.renameFeedbackIsError = true
            return
        }
        try {
            window.OnRenameNoteRequested(suffix)
        } catch (e: any) {
            window.OnUIError(e.message)
        }
    }

    setRenameResult(success: boolean, newFileName: string, error: string) {
        if (success) {
            this.noteFilename = newFileName
            this.renameFeedback = 'Renamed.'
            this.renameFeedbackIsError = false
            this.renameInput.value = ''
        } else {
            this.renameFeedback = error ?? 'Rename failed.'
            this.renameFeedbackIsError = true
        }
    }

    private sanitizeSuffix(input: string): string {
        return input
            .replace(/\s+/gu, '_')             // replace any whitespace (spaces, newlines, tabs) with underscore
            .replace(/[^\p{L}\p{N}_-]/gu, '')  // remove anything not a unicode letter, number, underscore, or hyphen — strips all OS-invalid chars (\ / : * ? " < > | etc.)
            .replace(/^_+|_+$/g, '')           // trim leading and trailing underscores left by the replacements above
    }

    onToggleDeleteWindowButtonPressed() {
        this.blur()
        this.toggleDeleteWindow()
    }

    onDeleteButtonPressed() {
        // 🔥 Very important blur! Otherwise selection stays on delete button
        // And it can get triggered when just wanting a new line in another note.
        this.blur()

        // Hide it after deletion, no need to keep it open.
        this.toggleDeleteWindow()

        try {
            window.OnDeleteButtonPressed()
        } catch (e: any) {
            window.OnUIError(e.message)
        }
    }

    onOpenFileButtonPressed() {
        this.blur()

        try {
            window.OnOpenFileButtonPressed()
        } catch (e: any) {
            window.OnUIError(e.message)
        }
    }

    onToggleMagicBoxWindowButtonPressed() {
        this.blur()
        this.toggleMagicBoxWindow()
    }

    onOpenMagicBoxButtonPressed() {
        this.blur()

        try {
            window.OnOpenMagicBoxButtonPressed()
        } catch (e: any) {
            window.OnUIError(e.message)
        }
    }

    toggleMagicBoxWindow(): void {
        this.isMagicBoxWindowVisible = !this.isMagicBoxWindowVisible

        window.RefreshTransparencyRectangles()
        setTimeout(() => {
            window.RefreshTransparencyRectangles()
        }, 500)
    }

    toggleDeleteWindow(): void {
        this.isDeleteWindowVisible = !this.isDeleteWindowVisible

        window.RefreshTransparencyRectangles()
        setTimeout(() => {
            window.RefreshTransparencyRectangles()
        }, 500)
    }

    setEditorPositioning(
        left: number,
        top: number,
        right: number,
        bottom: number
    ) {
        /* 🌲 Provided values assume counting from upper-left corner. */

        this.leftContainer.style.right = `${100 - left}%`
        this.leftContainer.style.width = `${left}%`

        this.rightContainer.style.left = `${right}%`
        this.rightContainer.style.width = `${100 - right}%`

        const topStyle = `${top}%`
        this.leftContainer.style.top = topStyle
        this.rightContainer.style.top = topStyle

        const height = `${100 - top - (100 - bottom)}%`
        this.leftContainer.style.height = height
        this.rightContainer.style.height = height

        this.leftContainer.style.visibility = 'visible'
        this.rightContainer.style.visibility = 'visible'
    }
}
