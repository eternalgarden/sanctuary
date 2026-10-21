/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
 Created: 2025 June 02, Monday @ 08:56:00
*/

import {
    FASTElement,
    html,
    css,
    attr,
    observable,
    ref,
} from "@microsoft/fast-element"
import { fromEvent, map, Subscription } from "rxjs"

/* 🎨 STYLES */
import reset from "../../common/styles/reset.css?raw"
import wind from "../../common/styles/wind.css?raw"
import gbobMainStyles from "../styles/gbobMain.css?raw"
import { UserSettings } from "../types/UserSettings"

/* 📜 Components */
import "./littleElements/GothicSlider"
import "./littleElements/GothicCheckbox"
import {
    GothicSlider,
    SLIDER_VALUE_UPDATE,
} from "./littleElements/GothicSlider"
import "./littleElements/CheckboxSetting"
import { CheckBoxSetting } from "./littleElements/CheckboxSetting"
import { CHECKBOX_TOGGLED } from "./littleElements/GothicCheckbox"
import { ON_SET_USER_SETTINGS } from "../gbobEvents"

const styles = css`
    ${reset}
    ${wind}
    ${gbobMainStyles}
`

const template = html<SettingsBureau>`
    <p>
        Here you can tweak some Sanctuary settings. For values in range hold the
        dagger emoji ('🗡️') and slide it around to a preferred value.
    </p>
    <checkbox-setting
        ${ref("useSupersampling")}
        setting="useSupersampling"
        label="Use supersampling?">
        <span slot="description">
            Draws the world at double resolution and shrinks it back down, which
            softens jagged edges. It is beautiful and it is expensive - four
            times as many pixels every frame - so leave it off unless you have a
            strong graphics card. It makes notes look better at distance, but up
            close makes no visible difference - so it is absolutely unessential.
            Disabled by default.</span
        >
    </checkbox-setting>
    <gothic-slider
        ${ref("cameraSpeedSlider")}
        setting="cameraSpeed"
        label="Camera Mouse Sensitivity"
        value="70"
        min="5"
        max="70">
        <span slot="description"
            ><i>Higher values men greater sensitivity.</i> Defines how fast will
            your worldview rotate when you move your mouse around or drift your
            fingers over the touchpad.</span
        >
    </gothic-slider>
    <gothic-slider
        ${ref("cameraSmoothingSlider")}
        setting="cameraSmoothing"
        value="30"
        min="7"
        max="50"
        label="Camera Smoothing">
        <span slot="description"
            ><i>Lower values mean more smoothing.</i> Defines how much smoothing
            is applied to your worldview rotation, at low values it might feel
            unresponsive or sleepy, at too high values looking around will be
            fully responsive.</span
        >
    </gothic-slider>
    <gothic-float-slider
        ${ref("textScaling")}
        setting="textScaling"
        min="1.0"
        max="3.0"
        label="Text Scaling">
        <span slot="description">
            <i>Text Scaling</i> this is important, it will scale the text size
            of your notes and editor elements, you might want to increase it if
            you have a large screen or a high-density Retina display.
        </span>
    </gothic-float-slider>
    <checkbox-setting
        ${ref("useVSync")}
        setting="useVSync"
        label="Use vSync?">
        <span slot="description">
            Turning this on may reduce screen tearing, but on some laptops it
            can make camera movement feel less smooth. Disabled by
            default.</span
        >
    </checkbox-setting>
    <checkbox-setting
        ${ref("useFullRefreshRate")}
        setting="useFullRefreshRate"
        label="Unleash the frame rate?">
        <span slot="description">
            Normally the sanctuary draws sixty times a second, which is plenty
            for wandering and writing. Turning this on lets it draw as fast as
            your screen allows instead – lovely on a high refresh-rate monitor,
            though on a laptop it mostly makes heat and fan noise. Disabled by
            default.</span
        >
    </checkbox-setting>
    <checkbox-setting
        ${ref("useSlowWalkToggle")}
        setting="useSlowWalkToggle"
        label="Make the slow walk a switch?">
        <span slot="description">
            Holding ctrl – or the command key, on a Mac – drops you to a third of
            your usual pace, for creeping along a ledge or reading a shelf as you
            pass it. Turn this on and the same key becomes a switch instead: press
            once to slow down, press again to walk on. Disabled by default.</span
        >
    </checkbox-setting>
    <checkbox-setting
        ${ref("isSoundMuted")}
        setting="isSoundMuted"
        label="Is Sound Muted?">
        <span slot="description">
            Toggling this value will (un)mute all sounds in Sanctuary.</span
        >
    </checkbox-setting>
    <gothic-slider
        ${ref("generalVolume")}
        setting="generalVolume"
        min="0"
        max="100"
        label="General Volume">
        <span slot="description">
            <i>General Volume</i> of all sounds emitted by Sanctuary. Setting
            this to 0 is equivalent to muting all sounds with the setting above.
        </span>
    </gothic-slider>
    <gothic-slider
        ${ref("musicVolume")}
        setting="musicVolume"
        min="0"
        max="100"
        label="Music Volume">
        <span slot="description">
            Volume of music and environment ambients sounds.
        </span>
    </gothic-slider>
    <gothic-slider
        ${ref("soundEffectVolume")}
        setting="soundEffectVolume"
        min="0"
        max="100"
        label="Sound Effect Volume">
        <span slot="description"> Volume of various sound effects. </span>
    </gothic-slider>
`

export class SettingsBureau extends FASTElement {
    @observable userSettings: UserSettings = new UserSettings()

    subscriptions: Subscription[] = []

    cameraSpeedSlider: GothicSlider
    cameraSmoothingSlider: GothicSlider
    textScaling: GothicSlider
    useVSync: CheckBoxSetting
    useFullRefreshRate: CheckBoxSetting
    useSupersampling: CheckBoxSetting
    useSlowWalkToggle: CheckBoxSetting
    isSoundMuted: CheckBoxSetting
    generalVolume: GothicSlider
    musicVolume: GothicSlider
    soundEffectVolume: GothicSlider

    connectedCallback() {
        super.connectedCallback()
        this.subscriptions.push(
            fromEvent(document, ON_SET_USER_SETTINGS)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const settings = next.detail as UserSettings
                    this.userSettings = settings
                })
        )
        this.registerSettingsListeners()
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        this.subscriptions?.forEach(sub => sub.unsubscribe())
    }

    onUserSettingsUpdated() {
        const json = JSON.stringify(this.userSettings)
        try {
            window.OnUserSettingsUpdated(json)
        } catch (e) {
            // console.log(this.userSettings)
            // console.log(
            //     "🐱 'OnUserSettingsUpdated' Listener not registered yet."
            // )
        }
    }

    registerSettingsListeners() {
        this.subscriptions.push(
            fromEvent(this.cameraSpeedSlider, SLIDER_VALUE_UPDATE)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const value = next.detail as number
                    this.userSettings.cameraSpeed = value
                    this.onUserSettingsUpdated()
                })
        )

        this.subscriptions.push(
            fromEvent(this.cameraSmoothingSlider, SLIDER_VALUE_UPDATE)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const value = next.detail as number
                    this.userSettings.cameraSmoothing = value
                    this.onUserSettingsUpdated()
                })
        )

        this.subscriptions.push(
            fromEvent(this.textScaling, SLIDER_VALUE_UPDATE)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const value = next.detail as number
                    this.userSettings.textScaling = value
                    this.onUserSettingsUpdated()
                })
        )

        this.subscriptions.push(
            fromEvent(this.useVSync.checkbox, CHECKBOX_TOGGLED)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const value = next.detail as boolean
                    this.userSettings.useVSync = value
                    this.onUserSettingsUpdated()
                })
        )

        this.subscriptions.push(
            fromEvent(this.useFullRefreshRate.checkbox, CHECKBOX_TOGGLED)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const value = next.detail as boolean
                    this.userSettings.useFullRefreshRate = value
                    this.onUserSettingsUpdated()
                })
        )

        this.subscriptions.push(
            fromEvent(this.useSupersampling.checkbox, CHECKBOX_TOGGLED)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const value = next.detail as boolean
                    this.userSettings.useSupersampling = value
                    this.onUserSettingsUpdated()
                })
        )

        this.subscriptions.push(
            fromEvent(this.useSlowWalkToggle.checkbox, CHECKBOX_TOGGLED)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const value = next.detail as boolean
                    this.userSettings.useSlowWalkToggle = value
                    this.onUserSettingsUpdated()
                })
        )

        this.subscriptions.push(
            fromEvent(this.isSoundMuted.checkbox, CHECKBOX_TOGGLED)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const value = next.detail as boolean
                    console.log(value)
                    this.userSettings.isSoundMuted = value
                    this.onUserSettingsUpdated()
                })
        )

        this.subscriptions.push(
            fromEvent(this.generalVolume, SLIDER_VALUE_UPDATE)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const value = next.detail as number
                    this.userSettings.generalVolume = value
                    this.onUserSettingsUpdated()
                })
        )

        this.subscriptions.push(
            fromEvent(this.musicVolume, SLIDER_VALUE_UPDATE)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const value = next.detail as number
                    this.userSettings.musicVolume = value
                    this.onUserSettingsUpdated()
                })
        )

        this.subscriptions.push(
            fromEvent(this.soundEffectVolume, SLIDER_VALUE_UPDATE)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const value = next.detail as number
                    this.userSettings.soundEffectVolume = value
                    this.onUserSettingsUpdated()
                })
        )
    }
}

SettingsBureau.define({
    name: "settings-bureau",
    template,
    styles,
    shadowOptions: { mode: "open", delegatesFocus: true },
})

/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
