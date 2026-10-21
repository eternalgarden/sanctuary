import {
    css,
    customElement,
    FASTElement,
    html,
    observable,
    ref,
    repeat,
    when,
} from "@microsoft/fast-element"
import { fromEvent, map, scan, Subscription } from "rxjs"
import {
    SET_KNOWN_CUSTOM_THEME,
    SET_SELECTED_THEME,
} from "../editor-fairy-events"
import { NoteThemeDescriptor } from "../../common/themes/note/note-theme-types"
import { plainEditorTheme } from "./../styles/plain-editor-theme"
import { Theme } from "../../common/themes/note/builtin-themes-enum"
import { IlCovileThemeDescriptor } from "../../common/themes/note/ilCovile/ilCovileTheme"
import markdownit from "markdown-it"
import DOMPurify from "dompurify"
import { filterNullish } from "../../common/functions/filterNullish"
import { disableLinks } from "../../common/functions/disableLinksInDocument"
import { OfMiceAndRabbitsThemeDescriptor } from "../../common/themes/note/miceAndRabbits/miceAndRabbits"

const template = html<ScrollThemePicker>`
    <div class="themePicker">
        <div class="themeList scroller">
            <div class="themeList content">
                <!-- ridiculous, had to put the custom themes on top of built in themes because otherwise
                 the special action buttons for custom themes are not hoverable or clickable  -->
                <h4>Custom Themes</h4>
                <div id="custom-themes-list">
                    ${repeat(
                        x => x.customThemes,
                        html<NoteThemeDescriptor, ScrollThemePicker>`
                            <div class="listedTheme">
                                <p
                                    @click=${(x, y) =>
                                        y.parent.onListedCustomThemeClicked(
                                            x.name
                                        )}>
                                    ${x => x.name}
                                </p>
                            </div>
                        `
                    )}
                </div>
                <h4>Built-In Themes</h4>
                <div id="builtin-themes-list">
                    ${repeat(
                        x => x.builtinThemes,
                        html<NoteThemeDescriptor, ScrollThemePicker>`
                            <div class="listedTheme">
                                <p
                                    @click=${(x, y) =>
                                        y.parent.onListedBuiltingThemeClicked(
                                            x.name
                                        )}>
                                    ${x => x.name}
                                </p>
                            </div>
                        `
                    )}
                </div>
            </div>
        </div>
        <div
            ${ref("selectedThemeElement")}
            class="themeDetail">
            <h3>${x => x.selectedTheme.name}</h3>
            <div :innerHTML="${x => x.mdit(x.selectedTheme.description)}"></div>
            <button
                @click=${(x, y) =>
                    x.onThemeSelectButtonPressed(
                        x.selectedTheme.name,
                        x.selectedTheme.isCustom
                    )}>
                * Use Theme *
            </button>
            <!-- 🗂️ Always available: someone who has never made a custom theme is
                 exactly who needs to find the themes folder. For a built-in theme this
                 opens the scroll themes folder itself. -->
            <button
                class="secondary"
                @click=${x => x.onOpenThemeFolderButtonPressed()}>
                Open Theme Folder
            </button>
            <!-- <p>Theme creation actions:</p> -->
            <div
                class="custom-theme-actions ${x =>
                    x.selectedTheme.isCustom ? "visible" : "hidden"}">
                <button
                    class="secondary"
                    @click=${(x, y) =>
                        x.onReloadCustomThemeButtonPressed(
                            x.selectedTheme.name
                        )}>
                    Manual Theme Reload
                </button>
                <div class="duplicate-section">
                    <input
                        ${ref("duplicateInput")}
                        data-allow-focus
                        type="text"
                        placeholder="New theme name..."
                        @focus=${() => {
                            try {
                                window.OnUITextInputFocused()
                            } catch {}
                        }}
                        @blur=${() => {
                            try {
                                window.OnUITextInputBlurred()
                            } catch {}
                        }} />
                    <button
                        class="secondary"
                        @click=${x => x.onDuplicateThemeButtonPressed()}>
                        Duplicate Theme
                    </button>
                    ${when(
                        x => !!x.duplicateFeedback,
                        html<ScrollThemePicker>`
                            <p
                                class="${x =>
                                    x.duplicateFeedbackIsError
                                        ? "duplicate-error"
                                        : "duplicate-success"}">
                                ${x => x.duplicateFeedback}
                            </p>
                        `
                    )}
                </div>
            </div>
        </div>
    </div>
`

const styles = css`
    /* TODO when custom editor themes are possible */

    ${plainEditorTheme}

    .custom-theme-actions.hidden {
        z-index: -100;
    }

    .custom-theme-actions.visible {
    }

    .themePicker {
        display: flex;
        flex-direction: row;
        min-height: 300px;
        max-height: 450px;
        gap: 0.5rem;
        position: relative;
    }

    .themeDetail {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow-y: auto;
    }

    .duplicate-section {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-top: 0.5rem;
    }

    .duplicate-section input {
        width: 100%;
        box-sizing: border-box;
    }

    .duplicate-success {
        color: #8f8;
        margin: 0;
    }
    .duplicate-error {
        color: #f88;
        margin: 0;
    }
`

@customElement({
    name: "scroll-theme-picker",
    template,
    styles,
})
export class ScrollThemePicker extends FASTElement {
    @observable selectedTheme: NoteThemeDescriptor = new NoteThemeDescriptor(
        "Not Yet Loaded",
        "Who knows where did it come from?",
        false
    )
    @observable builtinThemes: NoteThemeDescriptor[] = [
        IlCovileThemeDescriptor,
        OfMiceAndRabbitsThemeDescriptor,
    ]
    @observable customThemes: NoteThemeDescriptor[] = []

    selectedThemeElement: HTMLElement
    selectedThemeMutationObserver: MutationObserver

    duplicateInput: HTMLInputElement
    @observable duplicateFeedback: string = ""
    @observable duplicateFeedbackIsError: boolean = false

    customThemesMap = new Map<string, NoteThemeDescriptor>()
    subscriptions: Subscription[] = []

    connectedCallback(): void {
        super.connectedCallback()

        this.subscriptions.push(this.registerSetCustomThemeListener())
        this.subscriptions.push(this.registerSetSelectedThemeListener())

        this.listBuiltInThemes()


        /*
        MutationObserver: A JavaScript API for observing changes in the DOM.
        childList: true: This option makes the observer listen for changes to the list of child nodes, which includes changes to innerHTML.
        subtree: true: This option makes the observer also observe changes to any child elements within targetElement, not just the direct children.
        */
        this.setThemeDescriptorMutationObserver()
    }

    disconnectedCallback(): void {
        super.disconnectedCallback()

        this.selectedThemeMutationObserver.disconnect()
        this.subscriptions.forEach(x => x.unsubscribe())
    }

    private setThemeDescriptorMutationObserver() {
        this.selectedThemeMutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === "childList") {
                    // This is crucial since there might be links in theme descriptions
                    const count = disableLinks(document)
                    console.log(`🦑 Theme Picker disabled ${count} links.`)
                }
            })
        })

        this.selectedThemeMutationObserver.observe(this.selectedThemeElement, {
            childList: true,
            subtree: true,
        })
    }

    private listBuiltInThemes() {
        if (this.builtinThemes.length != 0) return
        this.builtinThemes.push(IlCovileThemeDescriptor)
        this.builtinThemes.push(OfMiceAndRabbitsThemeDescriptor)
    }

    private registerSetCustomThemeListener() {
        return fromEvent(document, SET_KNOWN_CUSTOM_THEME)
            .pipe(
                map(next => next as CustomEvent),
                map(e => e.detail as NoteThemeDescriptor),
                scan((acc, next) => {
                    acc.set(next.name, next)
                    // acc.set(next.name + "a", next)
                    // acc.set(next.name + "b", next)
                    // acc.set(next.name + "c", next)
                    // acc.set(next.name + "d", next)
                    // acc.set(next.name + "e", next)
                    // acc.set(next.name + "f", next)
                    // acc.set(next.name + "g", next)
                    // acc.set(next.name + "h", next)
                    // acc.set(next.name + "i", next)
                    // acc.set(next.name + "j", next)
                    // acc.set(next.name + "k", next)
                    // acc.set(next.name + "l", next)
                    // acc.set(next.name + "m", next)
                    // acc.set(next.name + "n", next)
                    // acc.set(next.name + "o", next)
                    // acc.set(next.name + "p", next)
                    // acc.set(next.name + "r", next)
                    // acc.set(next.name + "s", next)
                    return acc
                }, this.customThemesMap),
                map(acc => Array.from(acc.values()))
            )
            .subscribe(customThemes => {
                this.customThemes = customThemes
        this.selectedTheme = this.customThemes[0]

            })
    }

    mdit(markdown: string) {
        if (!markdown) return ""
        const md = markdownit({
            html: false,
            breaks: true,
            linkify: true,
        })

        const html = md.render(markdown)

        // console.log(html)

        return DOMPurify.sanitize(html)
    }

    private registerSetSelectedThemeListener() {
        return fromEvent(document, SET_SELECTED_THEME)
            .pipe(
                map(next => next as CustomEvent),
                map(e => e.detail as { name: string; isCustom: boolean }),
                map(next => {
        this.selectedTheme = this.customThemes[0]

                    const themeDescriptor: NoteThemeDescriptor | undefined =
                        next.isCustom
                            ? this.customThemes.find(x => x.name === next.name)
                            : this.builtinThemes.find(x => x.name === next.name)

                    if (themeDescriptor === undefined) {
                        this.logError(
                            `Scroll Editor UI: Failed to select used theme for theme name '${next.name}', it seems to be unknown.`
                        )
                        return this.builtinThemes[0]
                    }

                    return themeDescriptor
                }),
                filterNullish()
            )
            .subscribe(theme => {
                // hack: delay just because on windows chromium version the custom theme buttons
                // dont work if they dont get time to render first for a moment
                // 500ms was not enough
                setTimeout(() => this.selectedTheme = theme, 1500);
            })
    }

    onListedBuiltingThemeClicked(themeName: string) {
        this.blur()
        this.selectedTheme = this.builtinThemes.find(x => x.name === themeName)!
    }

    onListedCustomThemeClicked(themeName: string) {
        this.blur()
        this.selectedTheme = this.customThemesMap.get(themeName)!
    }

    onThemeSelectButtonPressed(themeName: string, isCustom: boolean) {
        // TODO it assumes selected theme is custom
        this.blur()
        window.OnThemeSelectButtonPressed(themeName, isCustom)
    }

    onReloadCustomThemeButtonPressed(themeName: string) {
        this.blur()
        window.OnReloadCustomThemeButtonPressed(themeName)
    }

    onOpenThemeFolderButtonPressed() {
        this.blur()
        try {
            window.OnOpenThemeFolderButtonPressed(this.selectedTheme.name)
        } catch (e: any) {
            window.OnUIError(e.message)
        }
    }

    onDuplicateThemeButtonPressed() {
        const newName = this.sanitizeThemeName(this.duplicateInput?.value ?? "")
        if (!newName) {
            this.duplicateFeedback = "Invalid name."
            this.duplicateFeedbackIsError = true
            return
        }
        this.duplicateFeedback = ""
        this.blur()
        try {
            window.OnDuplicateThemeButtonPressed(
                this.selectedTheme.name,
                newName
            )
        } catch (e: any) {
            window.OnUIError(e.message)
        }
    }

    setDuplicateResult(success: boolean, error: string) {
        if (success) {
            this.duplicateFeedback = "Duplicated."
            this.duplicateFeedbackIsError = false
            if (this.duplicateInput) this.duplicateInput.value = ""
        } else {
            this.duplicateFeedback = error ?? "Duplication failed."
            this.duplicateFeedbackIsError = true
        }
    }

    private sanitizeThemeName(input: string): string {
        return input
            .replace(/\s+/gu, "-")
            .replace(/[^\p{L}\p{N}_-]/gu, "")
            .replace(/^-+|-+$/g, "")
    }

    logError(errorMessage: string) {
        window.OnUIError(errorMessage)
    }
}
