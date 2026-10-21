import { Node } from '@tiptap/core'
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        arch: {
            toggleArch: () => ReturnType
        }
    }
}

export const ArchParagraph = Node.create({
    name: 'arch',

    group: 'block',

    content: 'inline*',

    defining: true,

    parseHTML() {
        return [
            { tag: 'p.arch', priority: 51 },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['p', { class: 'arch', ...HTMLAttributes }, 0]
    },

    addKeyboardShortcuts() {
        return {
            Backspace: () => {
                const { selection } = this.editor.state

                if (!this.editor.isActive(this.name)) return false

                if (selection instanceof NodeSelection) {
                    return this.editor.commands.setNode('paragraph')
                }

                if (!selection.empty) {
                    const { $from, $to } = selection
                    if ($from.pos <= $from.start() && $to.pos >= $from.end()) {
                        return this.editor.commands.setNode('paragraph')
                    }
                    return this.editor.commands.deleteSelection()
                }

                if (selection.$anchor.parentOffset === 0) {
                    return this.editor.commands.setNode('paragraph')
                }

                return this.editor.commands.command(({ tr, state }) => {
                    const { $anchor } = state.selection
                    tr.delete($anchor.pos - 1, $anchor.pos)
                    return true
                })
            },

            Delete: () => {
                const { selection } = this.editor.state

                if (!this.editor.isActive(this.name)) return false

                if (selection instanceof NodeSelection) {
                    return this.editor.commands.setNode('paragraph')
                }

                if (!selection.empty) {
                    const { $from, $to } = selection
                    if ($from.pos <= $from.start() && $to.pos >= $from.end()) {
                        return this.editor.commands.setNode('paragraph')
                    }
                    return this.editor.commands.deleteSelection()
                }

                const contentSize = selection.$anchor.parent.content.size
                return this.editor.commands.command(({ tr, state }) => {
                    const { $anchor } = state.selection
                    if ($anchor.parentOffset >= contentSize) return false
                    tr.delete($anchor.pos, $anchor.pos + 1)
                    return true
                })
            },
        }
    },

    addProseMirrorPlugins() {
        const archName = this.name
        return [
            new Plugin({
                key: new PluginKey('arch-selection-guard'),
                appendTransaction(_transactions, _oldState, newState) {
                    const { selection } = newState
                    if (!(selection instanceof NodeSelection)) return null
                    if (selection.node.type.name !== archName) return null
                    const pos = selection.from + selection.node.nodeSize - 1
                    return newState.tr.setSelection(
                        TextSelection.create(newState.doc, pos)
                    )
                },
            }),
        ]
    },

    addCommands() {
        return {
            toggleArch: () => ({ commands, editor }) => {
                if (editor.isActive(this.name)) {
                    return commands.setNode('paragraph')
                }
                return commands.setNode(this.name)
            },
        }
    },
})
