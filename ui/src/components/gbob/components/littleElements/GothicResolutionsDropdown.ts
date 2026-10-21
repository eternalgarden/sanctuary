import { css, FASTElement, html, ref } from "@microsoft/fast-element"
import reset from "../../../common/styles/reset.css?raw"
import wind from "../../../common/styles/wind.css?raw"
import { fromEvent, map, Subscription } from "rxjs"
import { ON_SET_AVAILABLE_RESOLUTIONS } from "../../gbobEvents"

const styles = css`
    ${reset}
    ${wind}
`

const template = html<GothicResolutionsDropdown>`
    <div id="container">
        <select ${ref("resolutionDropdown")}></select>
    </div>
`

export class GothicResolutionsDropdown extends FASTElement {
    resolutionDropdown: HTMLSelectElement
    resolutions: any

    subscriptions: Subscription[] = []

    connectedCallback(): void {
        super.connectedCallback()

        this.subscriptions.push(
            fromEvent(document, ON_SET_AVAILABLE_RESOLUTIONS)
                .pipe(map(next => next as CustomEvent))
                .subscribe(next => {
                    const resolutions = next.detail as any
                    this.resolutions = resolutions
                })
        )
    }

    disconnectedCallback(): void {
        super.disconnectedCallback()

        this.subscriptions.forEach(sub => sub.unsubscribe())
    }
}

GothicResolutionsDropdown.define({
    name: "gothic-resolutions-dropdown",
    template,
    styles,
    shadowOptions: { mode: "open", delegatesFocus: true },
})
