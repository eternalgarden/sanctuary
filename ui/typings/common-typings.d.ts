// well giving up, got no ffin idea how to import css files as string while
// having them digested by postcss at the same time
// all that to deal with scrollbar styling but it seems ive found another way

// declare module "*.css" {
//     const content: any;
//     export default content;
// }

// declare module "*.module.css"

declare module "*.json" {
    const content: any
    export default content
}

declare module "@emoji-mart/data" {
    const data: any
    export default data
}

declare module "*.css";

// ✨ This is what you use for loading raw css files into fast-element css templates
declare module "*.css?raw" {
    const content: string
    export default content
}

declare module "*.html?raw" {
    const content: string
    export default content
}

interface Window {
    vuplex: {
        postMessage: (message: string) => void
    }
    OnDebugLog: (message: string) => void
    OnRenameNoteRequested: (suffix: string) => void
    OnUITextInputFocused: () => void
    OnUITextInputBlurred: () => void
}
