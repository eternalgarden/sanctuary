export interface BrowserTransparencyRectangle {
    top: number
    left: number
    right: number
    bottom: number
    width: number
    height: number
}

export function collectRects(
    root: Document | ShadowRoot
): BrowserTransparencyRectangle[] {
    const nonTransparentRects: BrowserTransparencyRectangle[] = []

    root.querySelectorAll("*").forEach(element => {
        if (isNonTransparent(element)) {
            const boundingRect = element.getBoundingClientRect()
            const rect: BrowserTransparencyRectangle = {
                top: boundingRect.top,
                left: boundingRect.left,
                right: boundingRect.right,
                bottom: boundingRect.bottom,
                width: boundingRect.width,
                height: boundingRect.height,
            }

            // console.log("Detected non-transparent rect:")
            // console.elog(element)
            // console.log(rect)

            nonTransparentRects.push(rect)
        }

        // Check if the element has a Shadow DOM and recursively collect rects
        if ((element as HTMLElement).shadowRoot) {
            nonTransparentRects.push(...collectRects((element as HTMLElement).shadowRoot!))
        }
    })

    return nonTransparentRects
}

function isNonTransparent(element: Element) {
    const style = window.getComputedStyle(element)

    // Check if the element is displayed and has a non-zero size
    if (style.display === "none" || style.visibility === "hidden") {
        // console.log("none" + element.tagName)
        return false
    }

    const rect = element.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
        // console.log("width")

        return false
    }

    // Check if the background color has transparency
    const bgColor = style.backgroundColor
    if (
        bgColor === "transparent" ||
        bgColor === "" ||
        (bgColor.includes("rgba") && bgColor.endsWith(", 0)"))
    ) {
        // console.log("bg")

        return false
    }

    return true
}

/* with help of chatgpt 🪶*/

