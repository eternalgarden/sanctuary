import { provideFASTDesignSystem } from "@microsoft/fast-components"
import { DebugBackground } from "../common/elements/DebugBackground"
import { MarkdownNote } from "./components/MarkdownNote"
import { NoteBubbleMenu } from "./components/NoteBubbleMenu_Deprecated"
import { NoteToolbar } from "./components/NoteToolbar"
// import { MarkdownLine_Deprecated } from "./components/MarkdownLine_Deprecated"
// import { EditableLine_Deprecated } from "./components/EditableLine_Deprecated"

export const initiateNoteDesignSystem = () =>
    provideFASTDesignSystem()
        .withPrefix("note")
        .register(
            DebugBackground,
            NoteBubbleMenu,
            NoteToolbar,
            MarkdownNote,
        )
