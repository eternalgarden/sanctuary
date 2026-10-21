/* COPIED FROM ERIS */
// Somehow maybe it will make sense for those to be separate
// For eris its just called Container

import type { CSSDirective, ViewTemplate } from "@microsoft/fast-element"

import {
    FASTElement,
    customElement,
    html,
    css,
    attr,
    ref,
    when,
    ElementStyles,
    observable,
} from "@microsoft/fast-element"
import { dispatchDocumentEvent } from "../../common/functions/dispatchDocumentEvent"

export const FAIRY_BOX_MOVED: string = "🪰"

// using templates
// https://www.fast.design/docs/fast-element/declaring-templates
// "First, we create a template by using a tagged template literal.
// The tag, html, provides special processing for the HTML
// string that follows, returning an instance of ViewTemplate."
const template: ViewTemplate<FairyBox> = html`
    <div
        class="container"
        part="container"
        ${ref("container")}>
        <div
            class="handlebar"
            part="handlebar"
            ${ref("handlebar")}>
                <span class="title"><slot name="title"></slot></span>
                <span>${x => x.emoji}</span>
        </div>
        <div
            class="content"
            part="content">
            <slot>Content goes here 🪞</slot>
        </div>
    </div>
`

const scrollbarStuff = css`
    div::-webkit-scrollbar {
        width: 0;
    }

    div::-webkit-scrollbar-button {
        width: 0;
    }

    div::-webkit-scrollbar-track {
        width: 0;
    }

    div:::-webkit-scrollbar-track-piece {
        width: 0;
    }

    div::-webkit-scrollbar-thumb {
        width: 0;
    }

    div::-webkit-scrollbar-corner {
        width: 0;
    }

    div::-webkit-resizer {
        width: 0;
    }
`

const styles = css`
    ${scrollbarStuff}

    div.container {

        display: flex;
        flex-direction: column;
        overflow: hidden;

        color: black;
        background-color: white;

        border: dotted black;
        border-width: 1px;
        margin: 3px;

    }

    div.content {
        padding: 0.4em;
        scroll-behavior: smooth;
    }

    div.handlebar {
        padding: 0.2em;
        display: flex;
        color: #0202020;

        padding: 0.4em;
        padding-right: 0.2em;
    }

    span.title {
        flex-grow: 1;
        color: black;
    }
`

@customElement({
    name: "fairy-box",
    template,
})
export class FairyBox extends FASTElement {
    @attr padding: number = 0
    @attr top: string = ""
    @attr left: string = ""
    @attr emoji: string = "💎"
    @attr({ mode: "boolean" }) draggable: boolean = false

    container!: HTMLElement
    handlebar!: HTMLElement

    

    // * IMPORTANT
    // https://www.fast.design/docs/fast-element/leveraging-css#styles-and-the-element-lifecycle
    resolveStyles() {
        let style = styles

        style = this.extendStyle(
            style,
            css.partial`div.container { position: relative; }`
        )

        if (this.top.length > 0) {
            style = this.extendStyle(
                style,
                css.partial`div.container { top: ${this.top} }`
            )
        }

        if (this.left.length > 0) {
            style = this.extendStyle(
                style,
                css.partial`div.container { left: ${this.left} }`
            )
        }

        return style
    }

    connectedCallback() {
        super.connectedCallback()

        if (this.draggable) {
            this.dragElement(this.handlebar, this.container)
        }
    }

    extendStyle(style: ElementStyles, inline: CSSDirective) {
        const extension = css.partial`${inline}`
        return css`
            ${style} ${extension}
        `
    }

    dragElement(dragHandle: HTMLElement, element: HTMLElement) {
        // inspired by https://www.w3schools.com/howto/howto_js_draggable.asp

        let newX = 0,
            newY = 0,
            offsetX = 0,
            offsetY = 0

        dragHandle.onmousedown = dragMouseDown

        function dragMouseDown(e: MouseEvent) {
            e = e || window.event
            e.preventDefault()

            offsetX = e.clientX - element.offsetLeft
            offsetY = e.clientY - element.offsetTop

            document.onmouseup = closeDragElement
            document.onmousemove = elementDrag
        }

        function elementDrag(e: MouseEvent) {
            e = e || window.event
            e.preventDefault()

            newX = e.clientX - offsetX
            newY = e.clientY - offsetY

            element.style.top = newY + "px"
            element.style.left = newX + "px"
        }

        function closeDragElement() {
            document.onmouseup = null
            document.onmousemove = null
            dispatchDocumentEvent(FAIRY_BOX_MOVED, null)
        }
    }
}
