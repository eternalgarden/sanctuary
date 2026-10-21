export const hasDebugAttribute = () => isAttributeOn("debug")

export const isAttributeOn = (attribute: string) => {
    return window.location.href.includes(`#${attribute}`)
}
