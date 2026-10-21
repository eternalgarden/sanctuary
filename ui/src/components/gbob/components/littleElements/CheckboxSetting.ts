/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
 Created: 2025 June 02, Monday @ 09:53:30
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
import reset from "../../../common/styles/reset.css?raw"
import wind from "../../../common/styles/wind.css?raw"
import gbobMainStyles from "../../styles/gbobMain.css?raw"

/* 📜 Components */
import "./GothicCheckbox"
import { GothicCheckbox } from "./GothicCheckbox"
import { ON_SET_USER_SETTINGS } from "../../gbobEvents"
import { UserSettings, UserSettingsKey } from "../../types/UserSettings"
import { ourBooleanConverter } from "../../../common/functions/converters"

const styles = css`
    ${reset}
    ${wind}
    ${gbobMainStyles}

    #content {
        padding: 0.7rem 1rem;
    }
`

const template = html<CheckBoxSetting>`
    <h3>${x => x.label}</h3>
    <div id="content">
        <p><slot name="description">Test</slot></p>
        <gothic-checkbox
            ${ref("checkbox")}
            checked=${x => x.checked}
            label=${x => x.label}>
        </gothic-checkbox>
    </div>
`

export class CheckBoxSetting extends FASTElement {
    @attr label: string
    @attr checked: boolean
    @attr setting: UserSettingsKey

    checkbox: GothicCheckbox

    subscriptions: Subscription[] = []

    connectedCallback() {
        super.connectedCallback()

        this.subscriptions.push(
            fromEvent(document, ON_SET_USER_SETTINGS)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const settings = next.detail as UserSettings
                    this.checked = settings[this.setting] as boolean
                })
        )
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        this.subscriptions?.forEach(sub => sub.unsubscribe())
    }
}

CheckBoxSetting.define({
    name: "checkbox-setting",
    template,
    styles,
    shadowOptions: { mode: "open", delegatesFocus: true },
})

/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
