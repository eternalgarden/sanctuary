import { initiateEditorFairyDesignSystem } from "./editor-fairy-design"

/* styles 🎨 */
import "./editor-fairy-styles.css"
import "./../common/styles/reset.css"
import { EditorFairyRealm } from "./components/EditorFairyRealm"
import { hasDebugAttribute } from "../common/functions/isDebugModeOn"
import { loadTestDataIfInDebugMode_editorFairy } from "./editor-fairy-test-data-loader"
import {
    SET_SELECTED_THEME,
    SET_KNOWN_CUSTOM_THEME,
    SET_BASIC_NOTE_INFO,
    SET_MAGIC_BOX_PATHS,
} from "./editor-fairy-events"
import { NoteThemeDescriptor } from "../common/themes/note/note-theme-types"
import { dispatchDocumentEvent } from "../common/functions/dispatchDocumentEvent"
import {
    BrowserTransparencyRectangle,
    collectRects,
} from "../common/functions/browserTransparencyVerifier"
import { disableLinks } from "../common/functions/disableLinksInDocument"
import { disableTabbingInGameUI } from "../common/functions/disableTabbingInDocument"

/* ⛰️ components */
import "../common/elements/DebugBackground"
import "./components/EditorFairyRealm"
import "./components/Fairy-Box"
import "./../common/elements/SanctuaryLink"
import "./components/ScrollThemerPicker"


/* global method declarations */
declare global {
    interface Window {
        /* IN */
        SetEditorPositioning: (data: any) => void
        SetSelectedNoteTheme: (data: any) => void
        SetKnownCustomTheme: (data: any) => void
        SetDuplicateThemeResult: (data: { success: boolean; error: string }) => void
        SetBasicNoteInfo: (data: {
            fileName: string
            creationDate: number
        }) => void
        SetNoteRenameResult: (data: {
            success: boolean
            newFileName: string
            error: string
        }) => void
        SetMagicBoxPaths: (data: {
            magicBoxPath: string
            fontsPath: string
            scrollThemesPath: string
        }) => void
        RefreshTransparencyRectangles: () => void
        SetTextScaling: (data: any) => void

        /* OUT */
        OnDeleteButtonPressed: () => void
        OnOpenFileButtonPressed: () => void
        OnThemeSelectButtonPressed: (
            themeName: string,
            isCustom: boolean
        ) => void
        OnReloadCustomThemeButtonPressed: (themeName: string) => void
        OnDuplicateThemeButtonPressed: (sourceName: string, newName: string) => void
        OnOpenThemeFolderButtonPressed: (themeName: string) => void
        OnOpenMagicBoxButtonPressed: () => void
        OnUIError: (message: string) => void
        OnTransparencyRectanglesChanged: (
            rectangles: BrowserTransparencyRectangle[]
        ) => any
    }
}

window.SetTextScaling = (data: any) => {
    const { textScaling } = data;
    document.documentElement.style.fontSize = `${16*textScaling}px`;
}

// 🕊️ Message registrations

window.SetSelectedNoteTheme = (data: any) => {
    const { name, isCustom } = data

    dispatchDocumentEvent(SET_SELECTED_THEME, { name, isCustom })
}

window.SetBasicNoteInfo = (data: {
    fileName: string
    creationDate: number
}) => {
    const { fileName, creationDate } = data
    dispatchDocumentEvent(SET_BASIC_NOTE_INFO, { fileName, creationDate })
}

window.SetMagicBoxPaths = (data: {
    magicBoxPath: string
    fontsPath: string
    scrollThemesPath: string
}) => {
    const { magicBoxPath, fontsPath, scrollThemesPath } = data

    dispatchDocumentEvent(SET_MAGIC_BOX_PATHS, {
        magicBoxPath,
        fontsPath,
        scrollThemesPath,
    })
}

window.SetKnownCustomTheme = (data: any) => {
    const { themeName, themeDescription } = data

    const customScrollThemeDescriptor = new NoteThemeDescriptor(
        themeName,
        themeDescription,
        true
    )

    if (customScrollThemeDescriptor === undefined) {
        console.error("Undefined custom known theme. 🔥")
        return
    }

    dispatchDocumentEvent(SET_KNOWN_CUSTOM_THEME, customScrollThemeDescriptor)
}

// ☔ Temporary listener registrations

window.OnUIError = (message: string) => {
    console.log(message)
}

window.OnReloadCustomThemeButtonPressed = (themeName: string) => {
    console.log("Pressed Reload Theme Button")
}

window.RefreshTransparencyRectangles = () => {
    const rects = collectRects(document)
    // console.log(`🪶 Refreshed non transparent rectangles, found: ${rects.length}.`)
    if (window.OnTransparencyRectanglesChanged !== undefined) {
        // Emit information on non-transparent rects
        window.OnTransparencyRectanglesChanged(collectRects(document))
    } else {
        console.log("🪰 OnTransparencyRectanglesChanged is not defined.")
    }
}

try {
    // initiateEditorFairyDesignSystem()

    const editorFairy: EditorFairyRealm = document.getElementById(
        "editorFairy"
    ) as EditorFairyRealm

    if (editorFairy == null)
        throw new Error("Important 🔥 Missing Editor Fairy Component.")

    window.SetEditorPositioning = (data: any) => {
        const { left, right, top, bottom } = data
        editorFairy.setEditorPositioning(left, top, right, bottom)
        window.RefreshTransparencyRectangles()
    }

    window.SetNoteRenameResult = (data: { success: boolean, newFileName: string, error: string }) => {
        editorFairy.setRenameResult(data.success, data.newFileName, data.error)
    }

    window.SetDuplicateThemeResult = (data: { success: boolean, error: string }) => {
        editorFairy.scrollThemePicker.setDuplicateResult(data.success, data.error)
    }

    loadTestDataIfInDebugMode_editorFairy()
} catch (e: any) {
    // TODO the problem is that this might not be yet registered
    window.OnUIError(e.message)
}

const count = disableLinks(document)
console.log(`🦑 Editor Fairy disabled ${count} links.`)

disableTabbingInGameUI()
