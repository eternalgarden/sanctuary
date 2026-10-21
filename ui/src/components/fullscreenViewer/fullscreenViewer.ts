
/* styles 🎨 */
import "./../common/styles/reset.css"

/* ⛰️ components */
import "../common/elements/DebugBackground"
import "./components/FullscreenViewer.ts"

import { FullscreenViewer } from "./components/FullscreenViewer"

const VIEWER: FullscreenViewer = document.getElementById(
    "fullscreenViewer"
) as FullscreenViewer
if (VIEWER == null) throw new Error("Important 🔥 Missing Fullscreen Viewer component.")

declare global {
    interface Window {
        /* IN */
        ShowFullscreenImage: (data: { src: string }) => void
        HideFullscreenImage: () => void
        SetMediaServerUrl: (data: { url: string }) => void

        /* OUT */
        OnFullscreenViewerClosed: () => void

        MediaConfig: {
            baseUrl: string
        }
    }
}

window.MediaConfig ??= {
    baseUrl: "",
}

window.ShowFullscreenImage = (data: { src: string }) => {
    VIEWER.show(data.src)
}

window.HideFullscreenImage = () => {
    VIEWER.hide()
}

window.SetMediaServerUrl = (data: { url: string }) => {
    window.MediaConfig.baseUrl = data.url.replace(/\/$/, "")
    VIEWER.refreshMediaUrl()
}
