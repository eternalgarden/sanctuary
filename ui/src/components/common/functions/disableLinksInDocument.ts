
const OVERRIDDEN_LINK_ATTRIBUTE: string = "data-disabled-link"
const LINK_PRESSED_MESSAGE: string = "link-pressed-with-url"

export function disableLinks(root: Document | ShadowRoot = document): number {
    let count = 0

    function queryLinksInShadow(root: Document | ShadowRoot) {

        // Select all links in the current root that do not have the attribute
        // a[href]: Selects all <a> tags with an href attribute.
        const links: NodeListOf<HTMLAnchorElement> = root.querySelectorAll(
            `a[href]:not([${OVERRIDDEN_LINK_ATTRIBUTE}])`
        )

        count += links.length

        // Process each link found
        links.forEach(link => {
            // 🦜 because why not, it's pretty
            link.setAttribute(OVERRIDDEN_LINK_ATTRIBUTE, "🦜")

            const linkUrl = link.href

            link.addEventListener("click", event => {

                // Important fix to link press-spam
                (event.target as HTMLElement).blur();

                if (window.vuplex) {
                    // Send the link URL to the C# script.
                    window.vuplex.postMessage(LINK_PRESSED_MESSAGE + linkUrl)
                } else {
                    console.warn(
                        `🦜 Link pressed :: ${linkUrl} :: vuplex is not available on the window object.`
                    )
                }
                // Call preventDefault() to prevent the webview from loading the URL.
                event.preventDefault()
            })
        })

        // Recursively look into nested shadow roots
        root.querySelectorAll("*").forEach(element => {
            if (element.shadowRoot) {
                // Recurse into this element's shadow root
                // console.log("going deepr" + element.tagName)
                queryLinksInShadow(element.shadowRoot)
            }
        })
    }

    // Start querying from the initial root
    queryLinksInShadow(root)

    return count
}

/* with help of chatgpt 🪶*/
