import {
    FASTElement,
    css,
    customElement,
    html,
    observable,
    ref,
    when,
} from "@microsoft/fast-element"
import { defaultTextStyles } from "../styles/defaultTextStyles"
const MarkdownIt = require("markdown-it"),
    md = new MarkdownIt()

const styles = css`
    ${defaultTextStyles}

    textarea {
        resize: none;
        width: 100%;
        overflow-y: hidden;
    }
`

const template = html<EditableLine_Deprecated>`
    <textarea
        class="text"
        id="yo"
        ${ref("textarea")}
        :value="${x => x.line}"
        @input="${x => {
            x.textarea.style.height = x.textarea.scrollHeight + "px"
        }}"
        @focusout="${(x, c) => console.log("ouit")}"></textarea>
`

@customElement({
    name: "editable-line",
    template,
    styles,
})
export class EditableLine_Deprecated extends FASTElement {
    @observable line: string

    textarea: HTMLTextAreaElement

    connectedCallback() {
        super.connectedCallback()

        const textarea = this.textarea

        // TODO I couldn't get the other method to work.
        // * https://stackoverflow.com/questions/15875128/is-there-element-rendered-event
        setTimeout(function () {
            textarea.style.height = textarea.scrollHeight + "px"
            textarea.focus()
        }, 0)
    }
}
