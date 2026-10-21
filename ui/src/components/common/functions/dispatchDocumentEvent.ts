
export const dispatchDocumentEvent = (eventName: string, detail: any) => {
    const e = new CustomEvent(eventName, {
        detail
    })
    document.dispatchEvent(e)
}