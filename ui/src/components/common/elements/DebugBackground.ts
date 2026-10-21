import {
    FASTElement,
    attr,
    css,
    customElement,
    html,
    observable,
    ref,
    when,
} from "@microsoft/fast-element"
import { isAttributeOn, hasDebugAttribute } from "../functions/isDebugModeOn"

import DebugScreenBackground from "./../../../assets/images/debug-screen-background.png"

const styles = css`
    .debug {
        position: absolute;
        height: 100%;
        width: 100%;
        top: 0;
        left: 0;
        z-index: -99999;
    }
`

const template = html<DebugBackground>`
    ${when(
        x => x.setVisible,
        html<DebugBackground>`
      <div class="debug" style="background-color: ${x => x.colour}">
        <img class="usagi" ${ref("screenBackground")}></div>
    </div>
    `
    )}
`

export class DebugBackground extends FASTElement {
    @observable setVisible: boolean = false
    @attr colour: string = "#1f1e20"

    @observable screenBackground: HTMLImageElement

    constructor() {
        super()
        this.setVisible = hasDebugAttribute() && !isAttributeOn("nobg")
    }

    connectedCallback(): void {
        super.connectedCallback() // ! don't forget this

        // console.log(this.usagi)
    }

    screenBackgroundChanged(oldval: any, newval: any) {
        if (newval != undefined) {
            this.screenBackground.src = DebugScreenBackground
        }
    }
}

DebugBackground.define({
    name: "debug-background",
    template,
    styles,
})
