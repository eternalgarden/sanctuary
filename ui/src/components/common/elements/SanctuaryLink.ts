import {
    attr,
    css,
    customElement,
    FASTElement,
    html,
    ref,
} from "@microsoft/fast-element"

declare global {
    interface Window {
        OnLinkPressed: (url: string) => void
    }
}

const template = html<SanctuaryLink>`
    <span
        ${ref("span")}
        class="link"
        @click=${x => x.emitPressed()}
        ><slot>DEFAULT LINK TEXT 🦜🏴‍☠️</slot></span
    >
`

const styles = css`
    span.link {
        color: #14f041;
        text-decoration-style: solid;
        text-decoration-line: underline;
        background-color: #444;
        padding: 0 0.1rem;
    }

    span.link:hover {
        
    }
`

@customElement({
    name: "s-link",
    template,
    styles,
})
export class SanctuaryLink extends FASTElement {
    span: HTMLSpanElement
    @attr url: string = ""

    emitPressed() {
        console.log(this.url)
        try {
            window.OnLinkPressed(this.url)
        } catch (e) {

            const typeError = e as TypeError

            if (typeError !== undefined)
            {
                // * Known type of error if there is no registration yet
                // 
                console.log("OnLinkPressed listener not registered yet 🔥")
                return
            }
            else
            {
                console.error(e)
            }
        }
    }
}
