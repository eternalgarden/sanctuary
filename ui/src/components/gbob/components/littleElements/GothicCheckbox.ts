/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
 Created: 2025 June 02, Monday @ 09:14:45
*/

import {
    FASTElement,
    html,
    css,
    attr,
    observable,
} from "@microsoft/fast-element"
import { fromEvent, map, Subscription } from "rxjs"

/* 🎨 STYLES */
import wind from "../../../common/styles/wind.css?raw"
import reset from "../../../common/styles/reset.css?raw"
import gbobMainStyles from "../../styles/gbobMain.css?raw"

export const CHECKBOX_TOGGLED = "checkbox toggled"

const styles = css`
    ${reset}
    ${wind}
    ${gbobMainStyles}

 .gothic-checkbox {
        display: flex;
        align-items: center;
        cursor: pointer;
        color: var(--primary-color);
    }

    .gothic-checkbox input[type="checkbox"] {
        appearance: none;
        -webkit-appearance: none;
        width: 1.2rem;
        height: 1.2rem;
        border: 3px double var(--primary-color);
        background-color: antiquewhite;
        margin-right: 0.5rem;
        position: relative;
        cursor: pointer;
    }

    .gothic-checkbox input[type="checkbox"]:checked::before {
        content: "🗡️";
        font-size: 1rem;
        color: var(--primary-color);
        position: absolute;
        top: 0;
        left: 0;
        width: 1.2rem;
        height: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`

const template = html<GothicCheckbox>`
    <label class="gothic-checkbox">
        <input
            type="checkbox"
            ?checked=${x => x.checked}
            @change=${(x, c) =>
                x.onCheckboxChanged(
                    (c.event.target as HTMLInputElement).checked
                )} />
        ${x => x.label} ${x => {
            console.log(x.checked)
            return x.checked ? "Yes. 🙉" : "No. 🙈"
        }}
    </label>
`

export class GothicCheckbox extends FASTElement {
    @attr label: string
    @attr({mode: 'boolean'}) checked: boolean

    subscriptions: Subscription[] = []

    connectedCallback() {
        super.connectedCallback()

        console.log(this.checked)
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        this.subscriptions?.forEach(sub => sub.unsubscribe())
    }

    onCheckboxChanged(checked: boolean) {
        this.checked = checked
        const rawEvent = new CustomEvent(CHECKBOX_TOGGLED, {
            detail: this.checked,
        })
        this.dispatchEvent(rawEvent)
    }

    checkedChanged(oldValue: boolean | string | null, newValue: boolean | string | null): void {
        // this.checked = newValue === true || newValue === "true";
        // console.log(oldValue)
        // console.log(newValue)
        // console.log(this.checked)
    }
}

GothicCheckbox.define({
    name: "gothic-checkbox",
    template,
    styles,
    shadowOptions: { mode: "open", delegatesFocus: true },
})

/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
