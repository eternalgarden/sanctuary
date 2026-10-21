import { UserSettings } from "./types/UserSettings"
import {
    ON_SET_AVAILABLE_RESOLUTIONS,
    ON_SET_USER_SETTINGS,
    ON_TEXT_SCALING_CHANGED,
} from "./gbobEvents"

/* 🎨 styles */
// load order is important! From the most basic up.
import "../common/styles/reset.css"
import "../common/styles/font.css"
import "../common/styles/fontsMediengestaltung.css"
import "./styles/gbobBody.css"

/* ⛰️ components */
import "../common/elements/DebugBackground.ts"
import "../common/elements/foldout/Foldout.ts"
import "./components/GBobBureau.ts"
import "./components/littleElements/GothicSlider"
import "./components/littleElements/GothicFloatSlider"
import {
    hasDebugAttribute,
    isAttributeOn,
} from "../common/functions/isDebugModeOn"
import testData from "../../assets/test-data/gbob.json"
import { disableTabbingInGameUI } from "../common/functions/disableTabbingInDocument"
import { disableLinks } from "../common/functions/disableLinksInDocument"

declare global {
    interface Window {
        /* 🌊 IN */
        SetUserSettings: (settings: any) => void
        SetTextScaling: (data: any) => void
        SetAvailableResolutions: (data: any) => void

        /* 🌋 OUT */
        OnDisplayGBobTextToggled: (value: boolean) => void
        OnTakeMeToSafety: () => void
        OnUserSettingsUpdated: (data: string) => void
    }
}

window.SetTextScaling = (data: any) => {
    const { textScaling } = data

    document.documentElement.style.fontSize = `${16 * textScaling}px`

    const rawEvent = new CustomEvent(ON_TEXT_SCALING_CHANGED, {
        detail: textScaling,
    })
    document.dispatchEvent(rawEvent)
}

window.SetAvailableResolutions = (data: any) => {
    const { resolutions } = data

    console.log(data)
    console.log(resolutions)

    const rawEvent = new CustomEvent(ON_SET_AVAILABLE_RESOLUTIONS, {
        detail: resolutions,
    })
    document.dispatchEvent(rawEvent)
}

window.SetUserSettings = (data: any) => {
    const userSettings = data.WebUserSettings as UserSettings
    console.log("📜 Received below User Settings from the forces that be:")
    console.log(userSettings)
    publishUserSettings(userSettings)
}

function publishUserSettings(settings: UserSettings) {
    const rawEvent = new CustomEvent(ON_SET_USER_SETTINGS, { detail: settings })
    document.dispatchEvent(rawEvent)
}

if (hasDebugAttribute()) {
    if (isAttributeOn("local")) {
        let data: any[] = JSON.parse(testData).data
        const obj = data.find(e => e["MethodName"] === "SetUserSettings")
        const userSettings = obj.WebUserSettings as UserSettings
        console.log(userSettings)
        publishUserSettings(userSettings)
    }
}

disableLinks()
disableTabbingInGameUI()

console.log("🗿 GBob Activated!")
