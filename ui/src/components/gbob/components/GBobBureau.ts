/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
 Created: 2025 May 26, Monday @ 13:50:31
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
import gbobLayout from "../styles/gbobLayout.css?raw"
import gbobMainStyles from "../styles/gbobMain.css?raw"

/* 📜 Components */
import "./SettingsBureau"

/* 🛠️ OTHER */
import { ON_SET_USER_SETTINGS, ON_TEXT_SCALING_CHANGED } from "../gbobEvents"
import { UserSettings } from "../types/UserSettings"

const styles = css`
    ${reset}
    ${wind}
    ${gbobLayout}
    ${gbobMainStyles}
`

const template = html<GBobBureau>`
    <div
        class="container"
        ${ref("container")}>
        <div class="panel">
            <div class="header flex flex-col justify-items-center scrollable">
                <h1 id="title">
                    Welcome to GBob, Goblin Bureau of Bureaucracy
                </h1>
                <p class="arch">
                    GBob is an organisation called into being by the Ancients as
                    a reaction to the self-declaration of independence by the
                    <span class="cursive"
                        >Dwarven n-Dimensional Conjurers Congregation</span
                    >
                    (commonly abbreviated as <span class="cursive">Dn-D</span>),
                    whose power to spread chaos over the
                    <span class="cursive">Parallel Universe</span>
                    <span class="cursive">(PU)</span> was considered a threat to
                    the old order. War has been waged for millenia between our
                    factions until the
                    <span class="cursive">Breach of Contract Uprising</span>
                    within our, GBob's ranks, wherein we banished our creators
                    and signed peace treaties with the Dn-D, since then our
                    words of blessing are spoken as:
                    <span class="cursive"
                        >'No gods, no masters. But it has to be on paper.</span
                    >'
                </p>
            </div>
            <div class="content flex flex-col align-items-start scrollable">
                <sanctuary-foldout>
                    <div
                        slot="start"
                        class="emojiguid">
                        <span> ✨ </span>
                    </div>
                    <span slot="collapsed-icon">👈🏻</span>
                    <span slot="expanded-icon">👇🏻</span>
                    <h1 slot="title">Instructions</h1>
                    <div slot="content">
                        <p class="archsmall">
                            Below follows a short description of how to navigate
                            around Sanctuary and how to preform basic note
                            editing operations:
                        </p>
                        <ul>
                            <li>
                                Walk around with
                                <code>W, S, A and D</code> keys.
                            </li>
                            <ul>
                                <li>
                                    Run faster holding <code>Shift</code> key
                                    while walking.
                                </li>
                                <li>Jump with <code>Space</code>.</li>
                                <li>
                                    Double-Jump by pressing
                                    <code>Space</code> again while midair.
                                </li>
                            </ul>
                            <li>
                                Hold <code>Escape</code> for 5 seconds to close
                                Sanctuary.
                            </li>
                            <li>
                                To end any process press <code>Escape</code>.
                            </li>
                            <li>
                                Create new note with <code>R</code>.
                                <ul>
                                    <li>
                                        Move around to find a suitable location
                                        for your new note.
                                    </li>
                                    <li>
                                        Confirm its placement with
                                        <code>Left Mouse Button</code> or
                                        <code>Enter</code>.
                                    </li>
                                    <li>
                                        Cancel note creation by pressing <code>Escape</code>.
                                    </li>
                                </ul>
                            </li>

                            <li>
                                To edit note press <code>E</code> while looking
                                at it.
                            </li>
                            <ul>
                                <li>
                                    A note has a yellow magic frame surrounding it when you look at it.
                                </li>
                                <li>
                                    To stop editing it press <code>Escape</code>, <span class="cursive" >your note is saved at that moment.</span >
                                </li>
                                <li>
                                    Your note is also auto-saved every few minutes.
                                </li>
                            </ul>
                            <li>
                                To reposition a note hold <code>E</code> key for 1 second while looking at it.
                            </li>
                        </ul>
                    </div>
                </sanctuary-foldout>
                <sanctuary-foldout style="margin-bottom: 11rem">
                    <div
                        slot="start"
                        class="emojiguid">
                        <span> ✨ </span>
                    </div>
                    <span slot="collapsed-icon">👈🏻</span>
                    <span slot="expanded-icon">👇🏻</span>
                    <h1 slot="title">Settings</h1>
                    <div slot="content">
                        <settings-bureau></settings-bureau>
                    </div>
                </sanctuary-foldout>
            </div>
            <div class="secret flex">
                <h1>G</h1>
            </div>
            <div class="side flex flex-col scrollable">
                <div class="boxy">
                    <h2>Are you lost?</h2>
                    <p>
                        Or falling through the vast emptiness of space and no
                        angel came to save you? GBob is here for you!
                    </p>
                    <button
                        @click=${x => x.onTakeMeToSafetyClicked()}
                        class="flex flex-row align-items-center gap-medium justify-self-stretch">
                        <h3>✨ Take me to safety!</h3>
                    </button>
                </div>
                <div class="boxy">
                    <h2>Do you know GBob?</h2>
                    <p>
                        Do you already know that you can always find us under
                        the key <code>G</code> ?
                    </p>
                    <p>
                        (Un)check the checkbox below to set your preference.
                        This will turn off the GBob screen info text.
                    </p>
                    <label class="gothic-checkbox">
                        <input
                            type="checkbox"
                            ?checked=${x => x.userSettings.isGbobKnown}
                            @change=${(x, c) =>
                                x.onIsGBobKnownCheckboxChanged(
                                    (c.event.target as HTMLInputElement).checked
                                )} />
                        I know GBob.
                    </label>
                </div>
            </div>
        </div>
    </div>
`

export class GBobBureau extends FASTElement {
    @observable userSettings: UserSettings = new UserSettings()

    container: HTMLElement

    subscriptions: Subscription[] = []

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

        this.subscriptions.push(
            fromEvent(document, ON_TEXT_SCALING_CHANGED)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const textScaling = next.detail as number

                    const t = (textScaling - 1) / 2 // 1→0, 3→1

                    console.log(t)

                    const width = 50 + (100 - 50) * t // vw
                    const height = 60 + (100 - 60) * t // vh
                    const left = 25 * (1 - t) // 25 → 0
                    const top = 15 * (1 - t) // 15 → 0

                    console.log(this.container)

                    if (!this.container) return

                    this.container.style.width = width + "vw"
                    this.container.style.height = height + "vh"
                    this.container.style.left = `${left}vw`
                    this.container.style.top = `${top}vh`
                })
        )
    }

    userSettingsChanged(
        oldValue: UserSettings | undefined,
        newValue: UserSettings
    ): void {
        if (oldValue === undefined) return
        console.log("user setting changed")
    }

    disconnectedCallback(): void {
        super.disconnectedCallback()

        this.subscriptions.forEach(sub => sub.unsubscribe())
    }

    onUserSettingsUpdated() {
        const json = JSON.stringify(this.userSettings)
        try {
            window.OnUserSettingsUpdated(json)
        } catch (e) {
            console.log(this.userSettings)
            console.log(
                "🐱 'OnUserSettingsUpdated' Listener not registered yet."
            )
        }
    }

    onIsGBobKnownCheckboxChanged(value: boolean) {
        this.userSettings.isGbobKnown = value
        this.onUserSettingsUpdated()
    }

    onTakeMeToSafetyClicked(): void {
        const count = this.userSettings.angelicInterventionCount + 1
        this.userSettings.angelicInterventionCount = count
        this.onUserSettingsUpdated()
        try {
            window.OnTakeMeToSafety()
        } catch (e) {
            console.log("🐱 'OnTakeMeToSafety' Listener not registered yet.")
        }
    }
}

GBobBureau.define({
    name: "gbob-bureau",
    template,
    styles,
    shadowOptions: { mode: "open", delegatesFocus: true },
})

/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
