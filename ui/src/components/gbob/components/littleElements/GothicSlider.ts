/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
 Created: 2025 May 29, Thursday @ 06:52:48
*/

import {
    FASTElement,
    html,
    css,
    attr,
    observable,
    when,
    ref,
} from "@microsoft/fast-element"
import { fromEvent, map, Subscription } from "rxjs"

/* 🎨 STYLES */
import reset from "../../../common/styles/reset.css?raw"
import wind from "../../../common/styles/wind.css?raw"
import gbobMainStyles from "../../styles/gbobMain.css?raw"
import { integerConverter } from "../../../common/functions/converters"
import { ON_SET_USER_SETTINGS } from "../../gbobEvents"
import { UserSettings, UserSettingsKey } from "../../types/UserSettings"

export const SLIDER_VALUE_UPDATE = "slider value update"

const styles = css`
    ${reset}
    ${wind}
    ${gbobMainStyles}

    #content {
        padding: 0.5rem 1rem;
    }

    #value {
        background-color: antiquewhite;
        border: black;
        border-style: double;
        padding: 0.1rem;
        border-radius: 0.5rem;
        padding-top: 0;
        padding-bottom: 0.1rem;
        margin-left: 0.2rem;
        width: 1.8rem;
        text-align: center;
        display: inline-block;
    }

    .fromto {
        text-align: center;
        width: 1.8rem;
        display: inline-block;
    }

    .gothic-slider {
        -webkit-appearance: none;
        appearance: none;
        height: 0.4rem;
        --progress: 75%;
        background: linear-gradient(
            to right,
            #1960ff,
            var(--special-color) var(--progress),
            var(--special-color) var(--progress),
            #ffae19
        );
        border-radius: 3px;
        border: 0.05rem groove black;
        outline: none;
        margin: 1rem 0;
        cursor: pointer;
        width: 11rem;
    }

    .gothic-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 1.5rem;
        height: 1.5rem;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ctext x='0' y='18' font-size='18'%3E%F0%9F%97%A1%EF%B8%8F%3C/text%3E%3C/svg%3E")
                center center / contain no-repeat,
            transparent;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    .gothic-slider::-webkit-slider-thumb:hover {
        transform: scale(1.1);
    }
`

const template = html<GothicSlider>`
    <h3>${x => x.label}</h3>
    <div id="content">
        <p><slot name="description">Test</slot></p>
        <span class="fromto"
            >${when(x => x.min !== null, html`${x => x.min}`)}
        </span>
        <input
            ${ref("slider")}
            @input=${(x, c) => x.onSlideContinous(c.event)}
            @change=${(x, c) => x.onSlide(c.event)}
            class="gothic-slider"
            type="range"
            min="1"
            max="100"
            class="slider"
            id="myRange" />
        <span class="fromto"
            >${when(x => x.max !== null, html`${x => x.max}`)}
        </span>
        <span>Current value: </span>
        <span id="value">${x => x.value}</span>
    </div>
`

export class GothicSlider extends FASTElement {
    @attr label: string
    @attr setting: UserSettingsKey
    @attr({ converter: integerConverter }) min: number
    @attr({ converter: integerConverter }) max: number
    @attr({ converter: integerConverter }) value: number

    @observable progress = 75

    slider: HTMLInputElement
    subscriptions: Subscription[] = []

    connectedCallback() {
        super.connectedCallback()

        this.subscriptions.push(
            fromEvent(document, ON_SET_USER_SETTINGS)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const settings = next.detail as UserSettings
                    this.value = settings[this.setting] as number
                    const t = invLerp(this.min, this.max, this.value)
                    this.updateProgress(t * 100)
                })
        )
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        this.subscriptions?.forEach(sub => sub.unsubscribe())
    }

    onSlideContinous(event: any) {
        const slider = event.target as HTMLInputElement
        this.updateProgress(parseInt(slider.value))
        this.updateValue()
    }

    onSlide(event: any) {
        const slider = event.target as HTMLInputElement
        this.updateProgress(parseInt(slider.value))
        this.updateValue()
        this.publishValueEvent()
    }

    updateProgress(progress: number) {
        this.progress = progress
        this.slider.style.setProperty("--progress", `${this.progress}%`)
        this.slider.style.setProperty("--prog", `${this.progress}%`)
        this.slider.value = this.progress.toString()
    }

    updateValue() {
        const t = mylerpderp(this.min, this.max, this.progress / 100.0)
        this.value = Math.floor(t)
    }

    publishValueEvent() {
        const event = new CustomEvent(SLIDER_VALUE_UPDATE, {
            detail: this.value,
        })
        this.dispatchEvent(event)
    }
}

function mylerpderp(a: number, b: number, t: number): number {
    return a + (b - a) * Math.min(1, Math.max(0, t))
}

function invLerp(a: number, b: number, value: number): number {
    return a !== b ? (value - a) / (b - a) : 0
}

GothicSlider.define({
    name: "gothic-slider",
    template,
    styles,
    shadowOptions: { mode: "open", delegatesFocus: true },
})

/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
