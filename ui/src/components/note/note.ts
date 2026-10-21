import { initiateNoteDesignSystem } from "./note-design-system"
import { MarkdownNote } from "./components/MarkdownNote"
import { loremipsum } from "./loremIpsum"
import {
    isAttributeOn,
    hasDebugAttribute,
} from "../common/functions/isDebugModeOn"

/* styles 🎨 */
import "../common/styles/reset.css"
import "./styles/note.css"
import { CustomNoteTheme } from "../common/themes/note/note-theme-types"
import { SET_CUSTOM_NOTE_THEME } from "./note-events"

/* ⛰️ components */
import "../common/elements/DebugBackground"
import "./components/NoteToolbar"
import "./components/MarkdownNote"

const NOTE: MarkdownNote = document.getElementById("note") as MarkdownNote
if (NOTE == null) throw new Error("Important 🔥 Missing Note component.")

import testData from "./../../assets/test-data/noteTestData.json"

declare global {
    interface Window {
        // 🪶 Note-related global methods, important
        SetNoteContent: (data: any) => void
        OnNoteContentUpdated: (text: string) => void
        SetNoteEditable: (data: any) => void
        SetTextScaling: (data: any) => void

        // media
        SetMediaServerUrl: (data: { url: string }) => void
        OnOpenImageFileBrowserClicked: (mediaId: string) => void
        OnClipboardImagePasted: (data: { mediaId: string; base64: string; extension: string }) => void
        SetMediaNodeSrc: (data: { mediaId: string; src: string }) => void
        RemoveMediaNode: (data: { mediaId: string }) => void
        SetMediaNodeState: (data: { mediaId: string; state: string }) => void

        // ☔ Editor stuff
        ToggleEditorButton: (data: any) => void
        OnEditorToggleRequested: () => void

        // 🖼️ Lightbox — the picture this note is displaying, saved with the note
        OpenLightbox: (data: { mediaId: string }) => void
        OnLightboxStateChanged: (mediaId: string) => void

        // 🔍 Fullscreen — a look, handed to the viewer's own browser, saved nowhere
        OnFullscreenViewRequested: (data: { mediaId: string; src: string }) => void

        // 🔥 Kindof unused, but not problematic
        GetIsNoteEditable: () => boolean

        SetNoteTheme: (data: any) => void
        SetCustomNoteTheme: (data: any) => void

        MediaConfig: {
            baseUrl: string
        }
    }
}

window.MediaConfig ??= {
    baseUrl: "",
}

window.SetTextScaling = (data: any) => {
    const { textScaling } = data
    document.documentElement.style.fontSize = `${16 * textScaling}px`
}

window.SetNoteContent = (data: any) => {
    NOTE.setNoteContent(data.content)
    // console.log(NOTE.getNoteContent())
}

window.SetNoteEditable = (data: any) => {
    NOTE.setNoteEditable(data.noteEditable)
}

window.ToggleEditorButton = (data: any) => {
    NOTE.toggleEditorButton(data.editorToggle)
}

window.SetMediaNodeSrc = (data: { mediaId: string; src: string }) => {
    NOTE.setMediaSrc(data.mediaId, data.src)
}

window.RemoveMediaNode = (data: { mediaId: string }) => {
    NOTE.removeMediaNode(data.mediaId)
}

window.SetMediaNodeState = (data: { mediaId: string; state: string }) => {
    NOTE.setMediaNodeState(data.mediaId, data.state)
}

window.SetMediaServerUrl = (data: { url: string }) => {
    window.MediaConfig.baseUrl = data.url.replace(/\/$/, "")
    NOTE.refreshMediaImageSrcs()
    NOTE.refreshLightboxSrc()
}

window.GetIsNoteEditable = () => {
    return NOTE.isEditable
}

window.SetNoteTheme = (data: any) => {
    const themeName = data.name
    NOTE.setNoteTheme(themeName)
}

window.SetCustomNoteTheme = (data: any) => {
    const { name, styles, backgroundImageData, backgroundImageUrl } = data
    const customNoteTheme = new CustomNoteTheme(
        name,
        styles,
        backgroundImageData,
        backgroundImageUrl
    )
    const e = new CustomEvent(SET_CUSTOM_NOTE_THEME, {
        detail: customNoteTheme,
    })
    document.dispatchEvent(e)
}

window.OpenLightbox = (data: { mediaId: string }) => {
    NOTE.openLightboxByMediaId(data.mediaId)
}

if (hasDebugAttribute()) {
    NOTE.setNoteContent(loremipsum.html.toString())

    if (isAttributeOn("editable")) {
        NOTE.setNoteEditable(true)
        NOTE.toggleEditorButton(true)
    }

    const href = window.location.href
    if (href.includes("#local")) {
        // ? if the size becomes problematic one day
        // ? consider this: https://github.com/dominictarr/JSONStream
        // let data: [] = JSON.parse(testData).data
        // console.log(data)
        // data.forEach(o => window.OnNewOccurence(o))
    }
}
