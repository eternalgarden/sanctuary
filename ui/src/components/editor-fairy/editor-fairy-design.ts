import { provideFASTDesignSystem } from "@microsoft/fast-components"
import { DebugBackground } from "../common/elements/DebugBackground"
import { EditorFairyRealm } from "./components/EditorFairyRealm"
import { FairyBox } from "./components/Fairy-Box"
import { SanctuaryLink } from "../common/elements/SanctuaryLink"
import { ScrollThemePicker } from "./components/ScrollThemerPicker"

export const initiateEditorFairyDesignSystem = () =>
    provideFASTDesignSystem()
        .withPrefix("editor")
        .register(
            DebugBackground,
            EditorFairyRealm,
            FairyBox,
            SanctuaryLink,
            ScrollThemePicker
        )
