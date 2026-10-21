import {
    FASTElement,
    css,
    customElement,
    html,
    observable,
    ref,
    when,
} from "@microsoft/fast-element"
import { Editor } from "@tiptap/core"
import iro from "@jaames/iro"

/*
DEPRECATED due to problems on the fast-element and tiptap communication stuff
was unable to pass non undefined, already instantiated editor reference here
tried using when with this.editor !== undefined condition
but this caused some low level 'volatile' reference problems

it was something like this earlier
${when(
    x => x.editor !== undefined,
    x => html<MarkdownNote>`
      <note-bubble-menu :editor=${x.editor}></note-bubble-menu>
    `
  )}
*/

function isActive(
    x: NoteBubbleMenu,
    extension: string,
    attribute?: {}
): string {
    return x.editor.isActive(extension, attribute) ? "item is-active" : "item"
}

/* 

SVG stuff
so the original was here: https://codepen.io/Mamboleoo/pen/zYOJOGb
so i learned you can encode SVG's to put them directly into url
you can decode them here: https://yoksel.github.io/url-encoder/
and then edit resulting svg here: https://www.svgviewer.dev/
in this case you could also test different gradients here: https://cssgradient.io/

<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><style>path{animation:stroke 5s infinite linear;}@keyframes stroke{to{stroke-dashoffset:776;}}</style><linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
  <stop offset="0%" stop-color="#020024" />
  <stop offset="25%" stop-color="#1c0979" />
  <stop offset="50%" stop-color="#06a4a6" />
  <stop offset="100%" stop-color="#ffe900" />
</linearGradient>
<path d="M1.5 1.5 l97 0l0 97l-97 0 l0 -97" stroke-linecap="square" stroke="url(#g)" stroke-width="5" stroke-dasharray="388"/>
</svg>

*/

// 
const borderAnimation = "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cstyle%3Epath%7Banimation:stroke 5s infinite linear;%7D@keyframes stroke%7Bto%7Bstroke-dashoffset:776;%7D%7D%3C/style%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23020024' /%3E%3Cstop offset='25%25' stop-color='%231c0979' /%3E%3Cstop offset='50%25' stop-color='%2306a4a6' /%3E%3Cstop offset='100%25' stop-color='%23ffe900' /%3E%3C/linearGradient%3E%3Cpath d='M1.5 1.5 l97 0l0 97l-97 0 l0 -97' stroke-linecap='square' stroke='url(%23g)' stroke-width='5' stroke-dasharray='388'/%3E%3C/svg%3E";

const styles = css`
    * {
        font-family: "Fell Great Primer";
        font-size: 1rem;
    }

    .bubble-menu {
        width: auto;
        display: flex;
        flex-flow: column nowrap;
        gap: 0.1rem;
    }

    .bubble-row {
        width: auto;
        display: flex;
        flex-flow: row nowrap;
        flex-wrap: wrap; /* important to prevent overflows */
        justify-content: center;
        gap: 0.1rem;
    }

    .item {
        padding: 2px 9px;
        border: 2px outset black;
        border-radius: 4px;
        flex-grow: 1;
    }

    .item:hover {
        border: 2px inset black;
        background-color: rgb(183, 188, 200);
        
    }

    p.arch::first-letter {
        color: #dc2300;
        font-weight: bold;
        text-transform: uppercase;
        font-style: normal;
        /* the only setting i found to flow around nicely*/
        font-size: bigger;
    }

    p.arch {
        padding: 0;
        margin: 0;
    }

    button {
        background-color: white;
    }

    // button:hover {
    //     background-color: #00ff32;
    // }

    button:active {
        background-color: yellow;
    }

    button.is-active {
        border-image: url("${borderAnimation}") 1;
    }
`
const template = html<NoteBubbleMenu>`
    <div class="bubble-menu">
    
        <div class="bubble-row">
            
            <button
                class=${x => isActive(x, "bold")}
                @click="${x => x.editor.chain().focus().toggleBold().run()}">
                <b>b</b>
            </button>
            <button
                class=${x => isActive(x, "italic")}
                @click="${x => x.editor.chain().focus().toggleItalic().run()}">
                <i>i</i>
            </button>
            <button
                class=${x => isActive(x, "strike")}
                @click="${x => x.editor.chain().focus().toggleStrike().run()}">
                <s>s</s>
            </button>
            <button
                class=${x => isActive(x, "highlight")}
                @click="${x =>
                    x.editor.chain().focus().toggleHighlight().run()}">
                <mark>highlight</mark>
            </button>
            <!-- <button 
                class="item" 
                @click="${x =>
                    x.editor.chain().focus().setColor(" #08ff00").run()}"
                @dblclick="${x => console.log(" dbl")}">
                <span style="color: #08ff00">color</span>
                <div ${ref("picker")}></div>
            </button> -->
        </div>
    </div>
`

export class NoteBubbleMenu extends FASTElement {
    @observable editor: Editor

    picker: HTMLDivElement

    connectedCallback(): void {
        super.connectedCallback()

        console.log("derp")

        console.log(this.editor)
    }
}

NoteBubbleMenu.define({
    name: "note-bubble-menu",
    template,
    styles
})
