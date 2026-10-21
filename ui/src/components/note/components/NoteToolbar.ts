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
import { Picker } from 'emoji-mart'
import data from '@emoji-mart/data'

const styles = css`
    * {
        font-family: "Fell Great Primer";
    }

    .toolbar {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        height: 1.8rem;
        margin: 0.3rem;
        padding: 0.1rem;
        gap: 0.1rem;
        background-color: rgb(238, 238, 238);
        box-shadow: #555341 0px 0px 15px 3px;
        border-color: black;
        border-style: double;
    }

    button {
        border-radius: 4px;
        color: #222;
        border: none;
        background-color: transparent;
        min-width: 35px;
    }

    button:hover {
        color: black;
        background-color: rgb(255, 242, 133);
    }

    button:active {
        background-color: yellow;
    }

    button.isActive {
        text-decoration: underline;
          border-style: double;
          background-color: rgb(255, 242, 133);
    }

    p {
        padding: 0;
        margin: 0;
        font-size: 0.8rem;
        
    }

    p.arch::first-letter {
        color: black;
        font-weight: bold;
        text-transform: uppercase;
        font-style: normal;
        /* the only setting i found to flow around nicely*/
        font-size: bigger;
    }

    p.count {
        position: absolute;
        top: 0;
        right: 0;
        margin: 12px;
        font-size: 0.4rem;
    }
`

const template = html<NoteToolbar>`
    <div class="toolbar">
        <button
            class=${x => isActive(x.editor, "heading", x.count, { level: 1 })}
            @click="${x =>
                x.editor.chain().focus().toggleHeading({ level: 1 }).run()}">
            <p>H1</p>
        </button>
        <button
            class=${x => isActive(x.editor, "heading", x.count, { level: 2 })}
            @click="${x =>
                x.editor.chain().focus().toggleHeading({ level: 2 }).run()}">
            <p>H2</p>
        </button>
        <button
            class=${x => isActive(x.editor, "heading", x.count, { level: 3 })}
            @click="${x =>
                x.editor.chain().focus().toggleHeading({ level: 3 }).run()}">
            <p>H3</p>
        </button>
        <button
            class=${x => isActive(x.editor, "heading", x.count, { level: 4 })}
            @click="${x =>
                x.editor.chain().focus().toggleHeading({ level: 4 }).run()}">
            <p>H4</p>
        </button>

        <p>✣</p>

        <button
            class=${x => isActive(x.editor, "bulletList", x.count)}
            @click="${x => x.editor.chain().focus().toggleBulletList().run()}">
            <p>Bullet</p>
        </button>
        <button
            class=${x => isActive(x.editor, "orderedList", x.count)}
            @click="${x => x.editor.chain().focus().toggleOrderedList().run()}">
            <p>List</p>
        </button>

        <p>✣</p>

        <button
            class=${x => isActive(x.editor, "blockquote", x.count)}
            @click="${x => x.editor.chain().focus().toggleBlockquote().run()}">
            <p>Quote</p>
        </button>
        <button
            class=${x => isActive(x.editor, "arch", x.count)}
            @click="${x => x.editor.chain().focus().toggleArch().run()}">
            <p>Arch</p>
        </button>

        <p>✣</p>

        <button
            @click="${x => x.openImageFileBrowser()}">
            <p>Add Image</p>
        </button>

        <p>✣</p>

        <button
            class=${x => x.emojiPickerOpen ? "item isActive" : "item"}
            @click="${(x, c) => x.toggleEmojiPicker(c.event)}">
            <p>🪴</p>
        </button>
    </div>
    
    <p class="count">${x => x.count}</p>
`

export class NoteToolbar extends FASTElement {
    @observable editor: Editor
    @observable count: number = 0
    @observable emojiPickerOpen: boolean = false

    private _emojiPickerEl: HTMLElement | null = null
    private _emojiOutsideHandler: ((e: MouseEvent) => void) | null = null
    private _emojiKeyHandler: ((e: KeyboardEvent) => void) | null = null

    connectedCallback(): void {
        super.connectedCallback()

        const onUpdate = () => {
            // The content has changed.
        }

        // * So this is basically a thing to force above template reload because
        // * the observable editor doesn't emit update requests.
        // TODO maybe can be replaced with character count
        this.editor.on("selectionUpdate", ({ editor }) => {
            // The selection has changed.
            // console.log("selection chagned")
            // console.log( editor.getAttributes('heading'))
            // console.log( isActive(editor, 'heading', { level: 1 }))
            // this.editor = editor;
            this.count++
        })

        this.editor.on('transaction', ({ editor, transaction }) => {
            // The editor state has changed.
            this.count++
        })

        this.editor.on('update', ({ editor }) => {
            if (!editor.isEditable && this.emojiPickerOpen) {
                this._closeEmojiPicker()
            }
        })

        this._emojiKeyHandler = (e: KeyboardEvent) => {
            if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'e' && this.editor.isEditable) {
                e.preventDefault()
                if (this.emojiPickerOpen) {
                    this._closeEmojiPicker()
                } else {
                    this._openEmojiPicker(this.getBoundingClientRect())
                }
            }
        }
        document.addEventListener('keydown', this._emojiKeyHandler)
    }

    openImageFileBrowser()
    {
        const mediaId = crypto.randomUUID()
        try {
            window.OnOpenImageFileBrowserClicked(mediaId)
            this.editor.commands.insertContent({
              type: "mediaImage",
              attrs: {
                mediaId,
                mediaState: "placeholder",
              },
            })
        } catch {
            console.log("OnOpenImageFileBrowserClicked button is not registered.")
        }
    }

    toggleEmojiPicker(event: Event): void {
        if (this.emojiPickerOpen) {
            this._closeEmojiPicker()
            return
        }
        const button = event.currentTarget as HTMLElement
        this._openEmojiPicker(button.getBoundingClientRect())
    }

    private _openEmojiPicker(anchorRect: DOMRect): void {
        const picker = new Picker({
            data: JSON.parse(typeof data === 'string' ? data : JSON.stringify(data)),
            theme: 'dark',
            autoFocus: true,
            onEmojiSelect: (emoji: { native: string }) => {
                this.editor.chain().focus().insertContent(emoji.native).run()
                this._closeEmojiPicker()
            },
        }) as unknown as HTMLElement

        const hint = document.createElement('div')
        hint.textContent = 'Ctrl+E'
        Object.assign(hint.style, {
            fontFamily: '"Fell Great Primer", serif',
            fontSize: '0.65rem',
            color: '#aaa',
            textAlign: 'center',
            padding: '3px 0 4px',
            background: '#222',
            borderRadius: '0 0 6px 6px',
        })

        const container = document.createElement('div')
        Object.assign(container.style, {
            position: 'fixed',
            top: `${anchorRect.bottom + 4}px`,
            right: `${window.innerWidth - anchorRect.right}px`,
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
        })
        container.appendChild(picker)
        container.appendChild(hint)

        document.body.appendChild(container)
        this._emojiPickerEl = container
        this.emojiPickerOpen = true

        this._emojiOutsideHandler = (e: MouseEvent) => {
            const path = e.composedPath()
            if (!path.includes(container) && !path.includes(this)) {
                this._closeEmojiPicker()
            }
        }
        // Deferred to next tick so the click that opened the picker
        // doesn't immediately fire this handler and close it again.
        setTimeout(() => {
            document.addEventListener('click', this._emojiOutsideHandler!, { capture: true })
        }, 0)
    }

    private _closeEmojiPicker(): void {
        this._emojiPickerEl?.remove()
        this._emojiPickerEl = null
        this.emojiPickerOpen = false
        if (this._emojiOutsideHandler) {
            document.removeEventListener('click', this._emojiOutsideHandler, { capture: true })
            this._emojiOutsideHandler = null
        }
    }

    disconnectedCallback(): void {
        super.disconnectedCallback()
        this._closeEmojiPicker()
        if (this._emojiKeyHandler) {
            document.removeEventListener('keydown', this._emojiKeyHandler)
            this._emojiKeyHandler = null
        }
    }
}

function isActive(
    editor: Editor,
    extension: string,
    count: number,
    attribute?: {}
): string {
    return editor.isActive(extension, attribute) ? "item isActive" : "item"
}

NoteToolbar.define({
    name: "note-toolbar",
    template,
    styles,
})