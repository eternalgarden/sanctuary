export class NoteThemeDescriptor {
    readonly name: string
    readonly description: string
    readonly isCustom: boolean

    constructor(themeName: string, themeDescription: string, isCustom: boolean) {
        this.name = themeName
        this.description = themeDescription
        this.isCustom = isCustom
    }
}

export class CustomNoteTheme {
    readonly name: string
    readonly styles: string
    readonly imageData: string | null
    // Path of the background image relative to the themes root, served by the media server.
    // Preferred over imageData (base64) — avoids marshaling multi-MB strings on every theme set.
    readonly imageUrl: string | null

    constructor(
        themeName: string,
        styles: string,
        imageData: string | null,
        imageUrl: string | null = null
    ) {
        this.name = themeName
        this.styles = styles
        this.imageData = imageData
        this.imageUrl = imageUrl
    }
}
