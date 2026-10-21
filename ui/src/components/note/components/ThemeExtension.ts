import { Extension } from "@tiptap/core"

export interface ThemeOptions {
    theme: string
}

// ! Obsolete
/*
    This is no longer used because themes are set through $fastController.add/removeStyles()
*/

// as described here
// https://tiptap.dev/guide/custom-extensions#global-attributes
export const ThemeExtension = Extension.create<ThemeOptions>({
    name: "theme",

    addOptions() {
        return {
            theme: "deffytheme",
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: [
                    "heading",
                    "paragraph",
                    "link",
                    "highlight",
                    "bold",
                    "italic",
                    "strike",
                    "list",
                    "bulletList",
                    "orderedList",
                    "listItem",
                    "blockquote",
                ],
                attributes: {
                    theme: {
                        default: this.options.theme,
                        renderHTML: attributes => ({
                            // class: attributes.theme,
                            class: "",
                        }),
                        // TODO should I care about the parseHTML
                    },
                },
            },
        ]
    },
})
