import { Extension, Node, NodeViewProps } from "@tiptap/core"
import Link from "@tiptap/extension-link"
import { Plugin, PluginKey } from "@tiptap/pm/state"

const MARK_NAME = "meow_link"
const LINK_PRESSED_MESSAGE: string = "link-pressed-with-url"

const TipTapSanctuaryLink = Link.extend({
    name: MARK_NAME,
    priority: 1000,

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey("eventHandler"),
                props: {
                    handleClick(view, pos, event) {
                        const { state } = view
                        const { schema } = state
                        const { doc, tr } = state

                        // Get the node at the clicked position
                        const node = doc.nodeAt(pos)

                        const link = node?.marks.find(
                            mark => mark.type.name === MARK_NAME
                        )

                        if (link !== undefined) {
                            event.preventDefault()

                            const href = link.attrs.href

                            const element = event.target as HTMLElement

                            element.blur()

                            if (window.vuplex) {
                                // Send the link URL to the C# script.
                                window.vuplex.postMessage(
                                    LINK_PRESSED_MESSAGE + href
                                )
                            } else {
                                console.warn(
                                    `🦜 Link pressed :: ${href} :: vuplex is not available on the window object.`
                                )
                            }

                            return true // Stop further event propagation
                        }

                        return false // Allow other click handlers to run
                    },
                },
            }),
        ]
    },
    //     return [
    //       new Plugin({
    //         props: {
    //           handleClick: (view, pos, event) => {
    //             const { state } = view;
    //             const { schema } = state;
    //             const { doc, tr } = state;

    //             // Get the node at the clicked position
    //             const node = doc.nodeAt(pos);

    //             // Check if the clicked element is a link
    //             if (node?.marks.some((mark) => mark.type.name === 'link')) {
    //               event.preventDefault(); // Prevent the default link behavior

    //               // Get the link's href attribute
    //               const href = node.marks.find((mark) => mark.type.name === 'link')?.attrs.href;
    //               console.log('Custom click action for:', href);
    //               alert(`Custom action for URL: ${href}`);

    //               return true; // Stop further event propagation
    //             }

    //             return false; // Allow other click handlers to run
    //           },
    //         },
    //       }),
    //     ];
    //   },
})

export default TipTapSanctuaryLink
