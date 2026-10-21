import Image from "@tiptap/extension-image"
import { NodeSelection } from "@tiptap/pm/state"

export function resolveMediaUrl(src: string | null): string | null {
    if (!src) return null

    // Absolute paths (e.g. webpack asset URLs like /public/images/foo.jpeg)
    // and full URLs are used directly without the media server prefix.
    if (src.startsWith("/") || src.startsWith("http") || src.startsWith("data:") || src.startsWith("blob:")) {
        return src
    }

    return `${window.MediaConfig.baseUrl}/media/image/${src}`
}

export const MediaImage = Image.extend({
    name: "mediaImage",

    addAttributes() {
        return {
            ...this.parent?.(),

            mediaId: {
                default: null,
                parseHTML: el => el.getAttribute("data-media-id"),
                renderHTML: attrs => ({
                    "data-media-id": attrs.mediaId,
                }),
            },

            mediaState: {
                default: "placeholder", // or "ready" | "failed",
                parseHTML: el => el.getAttribute("data-media-state"),
                renderHTML: attrs => ({
                    "data-media-state": attrs.mediaState,
                }),
            },

            layout: {
                default: "block", // "block" | "float-left" | "float-right"
                parseHTML: el => el.getAttribute("data-image-layout") ?? "block",
                renderHTML: attrs => ({
                    "data-image-layout": attrs.layout,
                }),
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'img[data-type="media"]',
                getAttrs: element => ({
                    src: element.getAttribute("data-media-src"),
                }),
            },
        ]
    },

    addKeyboardShortcuts() {
        const deleteIfSelected = () => {
            const { selection } = this.editor.state
            if (!(selection instanceof NodeSelection)) return false
            if (selection.node.type.name !== this.name) return false
            return this.editor.commands.deleteSelection()
        }
        return {
            Backspace: deleteIfSelected,
            Delete: deleteIfSelected,
        }
    },

    addNodeView() {
        // Call parent factory (ResizableNodeView), then patch it to keep
        // data-image-layout and img.src in sync with the node attributes.
        //
        // ResizableNodeView sets el.src once at creation from HTMLAttributes.src
        // (the logical path, e.g. "2025/abc.jpg") and its onUpdate never
        // updates el.src again. We must resolve and sync it ourselves.
        const parentFactory = this.parent?.() as any
        if (!parentFactory) return null

        return (props: any) => {
            const nodeView = parentFactory(props) as any
            if (!nodeView?.dom) return nodeView

            const dom = nodeView.dom as HTMLElement

            const applyLayout = (layout: string) => {
                dom.dataset.imageLayout = layout ?? "block"
            }

            const applySrc = (src: string | null) => {
                // The logical path as stored in the note (e.g. "2026/pelican.png"), mirrored onto
                // the wrapper so a listener above the editor can read it without reaching into
                // this node view. Deliberately not img.src — nothing downstream should receive a
                // port-specific URL.
                dom.dataset.mediaSrc = src ?? ''
                const resolved = resolveMediaUrl(src)
                if (!resolved) return
                const img = dom.querySelector('img') as HTMLImageElement | null
                if (img && img.src !== resolved) {
                    img.src = resolved
                }
            }

            const applyMediaId = (mediaId: string | null) => {
                dom.dataset.mediaId = mediaId ?? ''
            }

            applyLayout(props.node.attrs.layout)
            applySrc(props.node.attrs.src)
            applyMediaId(props.node.attrs.mediaId)

            const originalUpdate = nodeView.update?.bind(nodeView)
            nodeView.update = (node: any, decorations: any, innerDecorations: any) => {
                const result = originalUpdate?.(node, decorations, innerDecorations) ?? true
                if (result !== false) {
                    applyLayout(node.attrs.layout)
                    applySrc(node.attrs.src)
                    applyMediaId(node.attrs.mediaId)
                }
                return result
            }

            // When this image node is torn down (e.g. a pooled browser re-loads a different note),
            // proactively release the decoded image. Clearing img.src tells Chromium to drop the
            // decode immediately — important for animated GIFs, whose frames otherwise linger in the
            // renderer until GC and pile up across reloads.
            const originalDestroy = nodeView.destroy?.bind(nodeView)
            nodeView.destroy = () => {
                const img = dom.querySelector('img') as HTMLImageElement | null
                if (img) img.src = ''
                originalDestroy?.()
            }

            return nodeView
        }
    },

    renderHTML({ HTMLAttributes }) {
        const { mediaState, src, ...rest } = HTMLAttributes

        if (mediaState === "placeholder") {
            return [
                "span",
                {
                    "data-type": "media",
                    "data-media-state": "placeholder",
                },
                "Media not finished",
            ]
        }

        if (mediaState === "copying") {
            return [
                "span",
                {
                    "data-type": "media",
                    "data-media-state": "copying",
                },
                "Copying image...",
            ]
        }

        if (mediaState === "failed") {
            return [
                "span",
                {
                    "data-type": "media",
                    "data-media-state": "failed",
                },
                "Media failed to load",
            ]
        }

        // Only the logical path is serialized. The live DOM's img.src is
        // set by the node view's applySrc, so no runtime/port-specific URL
        // leaks into saved notes.
        return [
            "img",
            {
                ...rest,
                "data-type": "media",
                // Legacy notes serialized base64 data URIs directly into data-media-src.
                // Strip them on save so they don't re-bloat the note; the node stays but loses its src.
                "data-media-src": src?.startsWith("data:") ? null : src,
            },
        ]
    },
})

/* 
TODO HTML preview outside your app breaks, will it be possible to have
src point to the physical location on disk?

*/
