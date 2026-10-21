import { resolve } from "node:path"
import { defineConfig } from "vite"

// gdcef loads the build straight from the Godot project as
// res://moon/browser/dist/components/<view>/<view>.html
const DIST_PATH = resolve(__dirname, "../src/moon/browser/dist")

export default defineConfig({
    root: resolve(__dirname, "src"),

    // relative asset urls, so the build works under res:// as well as http://
    base: "./",

    // copied verbatim into dist; holds the .gdignore that keeps the Godot editor
    // from importing the build's fonts and images as resources
    publicDir: resolve(__dirname, "public"),

    // debug runs of the game pick this up automatically, see PlaneMeshGdcef.cs
    server: {
        host: "127.0.0.1",
        port: 9001,
        strictPort: true,
    },

    build: {
        outDir: DIST_PATH,
        emptyOutDir: true,
        sourcemap: true,
        // gdcef ships a current Chromium, nothing older ever loads these pages
        target: "chrome130",
        rolldownOptions: {
            input: {
                note: resolve(__dirname, "src/components/note/note.html"),
                // Neo: not migrated yet, only the note is wired into Godot
                // eris: resolve(__dirname, "src/eris/eris.html"),
                // editorFairy: resolve(__dirname, "src/components/editor-fairy/editor-fairy.html"),
                // gbob: resolve(__dirname, "src/components/gbob/gbob.html"),
                // fullscreenViewer: resolve(__dirname, "src/components/fullscreenViewer/fullscreenViewer.html"),
            },
        },
    },
})
