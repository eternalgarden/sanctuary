function getAllFocusableElements(
    root: Document | Element | ShadowRoot = document
): Element[] {
    const focusableSelectors = [
        "a[href]",
        "area[href]",
        "input",
        "select",
        "textarea",
        "button",
        "iframe",
        "object",
        "embed",
        "[contenteditable]",
        '[tabindex]:not([tabindex="-1"])',
    ].join(",")

    // Get elements from light DOM
    let focusableElements = Array.from(
        root.querySelectorAll(focusableSelectors)
    )

    // Get elements from Shadow DOMs
    if (root instanceof Element || root instanceof Document) {
        const shadowRoots = Array.from(root.querySelectorAll("*"))
            // this type weirdness is required for typescript to not throw errers
            .filter((el): el is Element & { shadowRoot: ShadowRoot } => el.shadowRoot !== null )
            .map(el => el.shadowRoot)
            .filter(el => el !== null)

        for (const shadowRoot of shadowRoots) {
            focusableElements = focusableElements.concat(
                getAllFocusableElements(shadowRoot)
            )
        }
    }

    return focusableElements
}

export function disableTabbingInGameUI(): void {
    const elements = getAllFocusableElements()

    elements.forEach(element => {
        if (element.hasAttribute("data-allow-focus")) return

        // Preserve existing tabindex if it exists
        if (!element.hasAttribute("tabindex")) {
            element.setAttribute("tabindex", "-1")
        }

        // Add defensive blur in case any element has focus
        element.addEventListener("focus", e => {
            ;(e.target as HTMLElement).blur()
        })
    })
}
