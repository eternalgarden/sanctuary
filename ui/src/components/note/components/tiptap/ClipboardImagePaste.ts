import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"

export const ClipboardImagePaste = Extension.create({
    name: "clipboardImagePaste",

    addProseMirrorPlugins() {
        const editor = this.editor
        return [
            new Plugin({
                key: new PluginKey("clipboardImagePaste"),
                props: {
                    handleDOMEvents: {
                        paste(_view, event) {
                            const items = event.clipboardData?.items
                            if (!items) return false

                            const imageItems = Array.from(items).filter(item =>
                                item.type.startsWith("image/")
                            )
                            if (imageItems.length === 0) return false

                            event.preventDefault()

                            for (const item of imageItems) {
                                const blob = item.getAsFile()
                                if (!blob) continue

                                const mediaId = crypto.randomUUID()
                                const extension = ".jpg"

                                editor.commands.insertContent({
                                    type: "mediaImage",
                                    attrs: {
                                        mediaId,
                                        mediaState: "placeholder",
                                    },
                                })

                                const reader = new FileReader()
                                reader.onload = () => {
                                    const dataUrl = reader.result as string
                                    const base64 = dataUrl.split(",")[1]
                                    try {
                                        window.OnClipboardImagePasted({ mediaId, base64, extension })
                                    } catch {
                                        console.log("OnClipboardImagePasted is not registered.")
                                    }
                                }
                                reader.readAsDataURL(blob)
                            }

                            return true
                        },
                    },
                },
            }),
        ]
    },
})
