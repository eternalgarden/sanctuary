// TODO This is not super justified to be bundled into an actual component
// TODO Find a way to just fetch host json files with webpack
// TODO And preferably avoid that in production
import testData from "./../../assets/test-data/editorFairyTestData.json"

export function loadTestDataIfInDebugMode_editorFairy() {
    // * since I am debugging in firefox and unity plugin uses chromium

    try {
        const href = window.location.href

        if (href.includes("#debug")) {
            console.log("🔎 Detected debug mode.")

            let debugs = Array.from(document.getElementsByClassName("debug"))

            debugs.forEach(el => {
                ;(el as HTMLElement).style.visibility = "visible"
            })
        }

        if (href.includes("#local")) {
            let data = JSON.parse(testData).data

            for (let index = 0; index < data.length; index++) {
                const element = data[index]

                if (element.MethodName === "SetEditorPositioning") {
                    window.SetEditorPositioning(element)
                } else if (element.MethodName === "SetKnownCustomTheme") {
                    window.SetKnownCustomTheme(element)
                } else if (element.MethodName === "SetSelectedNoteTheme") {
                    window.SetSelectedNoteTheme(element)
                } else if (element.MethodName === "SetBasicNoteInfo") {
                    window.SetBasicNoteInfo(element)
                }
            }
        }
    } catch (error) {
        throw error
    }
}
