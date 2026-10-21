import {
    FASTElement,
    css,
    customElement,
    html,
    observable,
    ref,
    when,
} from "@microsoft/fast-element"
const MarkdownIt = require("markdown-it"),
    md = new MarkdownIt()

const styles = css`
    textarea {
        resize: none;
        width: 100%;
        overflow-y: hidden;
    }
`

const editableTemplate = html<MarkdownLine_Deprecated>`
    <!-- <textarea ${ref("textarea")}
  :value="${x => x.line}"
  @blur="${(x, c) => (x.isActive = false)}"
  @input="${x => {
        x.textarea.style.height = x.textarea.scrollHeight + "px"
    }}">
</textarea> -->
    <editable-line
        :line="${x => x.line}"
        @focusout="${(x, c) => (x.isActive = false)}">
    </editable-line>
`

const displayableTemplate = html<MarkdownLine_Deprecated>`
    <div
        class="text"
        :innerHTML=${x => md.render(x.line)}
        @click="${(x, c) => (x.isActive = true)}"></div>
`

const template = html<MarkdownLine_Deprecated>`
    ${x => {
        if (x.isActive) {
            return editableTemplate
        } else return displayableTemplate
    }}
`

@customElement({
    name: "markdown-line",
    template,
    styles,
})
export class MarkdownLine_Deprecated extends FASTElement {
    @observable isActive: boolean
    @observable line: string

    textarea: HTMLTextAreaElement

    connectedCallback() {
        super.connectedCallback()
    }

    textareaChanged(
        oldValue: HTMLTextAreaElement,
        newValue: HTMLTextAreaElement
    ) {
        console.log("changeds")
        this.textarea.style.height = this.scrollHeight + "px"
    }

    noteChanged(oldValue: string, newValue: string) {}
}
