import {
    ElementStyles,
    FASTElement,
    attr,
    css,
    customElement,
    html,
    observable,
    ref,
    repeat,
    when,
} from "@microsoft/fast-element"

/* 🖱️ We count clicks ourselves rather than listening for `dblclick`. ZFBrowser sends
   CEF a clickCount of 2 only on the second mouse *down* — every mouse up goes out as 1
   (StandaloneBrowser.cs) — and a touchpad tap has to survive that plus a position
   tolerance before Blink will synthesise a dblclick at all. Counting two ordinary
   clicks is not subject to any of it. 500ms matches the Vuplex detector used on
   Windows and macOS (OrthoPlaneBrowserPointerInputDetector). */
const IMAGE_DOUBLE_CLICK_MS = 500

import BackgroundPinkSky from "../../../assets/images/background-pink-sky.jpg"
import BackgroundLakeUtena from "../../../assets/images/background-blue-lake.jpg"
import {
    isAttributeOn,
    hasDebugAttribute,
} from "../../common/functions/isDebugModeOn"

import { Editor } from "@tiptap/core"
import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import BubbleMenu from "@tiptap/extension-bubble-menu"
import Heading from "@tiptap/extension-heading"
import Color from "@tiptap/extension-color"
import {TextStyle} from "@tiptap/extension-text-style"
import Link from "@tiptap/extension-link"
import Mention from "@tiptap/extension-mention"
import Highlight from "@tiptap/extension-highlight"
import Bold from "@tiptap/extension-bold"
import Italic from "@tiptap/extension-italic"
import Strike from "@tiptap/extension-strike"
import History from "@tiptap/extension-history"
import HardBreak from "@tiptap/extension-hard-break"
import OrderedList from "@tiptap/extension-ordered-list"
import BulletList from "@tiptap/extension-bullet-list"
import ListItem from "@tiptap/extension-list-item"
import Gapcursor from "@tiptap/extension-gapcursor"
import Focus from "@tiptap/extension-focus"
import { ThemeExtension } from "./ThemeExtension"

import { proseMirrorStyles } from "../styles/proseMirrorStyles"
import Blockquote from "@tiptap/extension-blockquote"
import { html_beautify } from "js-beautify"

// 🪞 builtin styles
import { Theme } from "../../common/themes/note/builtin-themes-enum"
import {
    ilCovileFrame,
    ilCovileThemeStyles,
} from "../../common/themes/note/ilCovile/ilCovileTheme"
import {
    ofMiceAndRabbitsKarteczka,
    ofMiceAndRabbitsThemeStyles,
} from "../../common/themes/note/miceAndRabbits/miceAndRabbits"

import { fromEvent, map, Subscription } from "rxjs"
import { SET_CUSTOM_NOTE_THEME } from "../note-events"
import { CustomNoteTheme } from "../../common/themes/note/note-theme-types"
import TipTapSanctuaryLink from "./TiptapSanctuaryLink"
import { MediaImage, resolveMediaUrl } from "./tiptap/MediaImage"
import { ArchParagraph } from "./tiptap/ArchParagraph"
import { ClipboardImagePaste } from "./tiptap/ClipboardImagePaste"


// This didn't work
// import scrollbarStyles from "./../styles/scrolbar.module.css";
/*
https://www.fast.design/docs/fast-element/leveraging-css
*/

const DEFAULT_THEME = Theme.IlCovile

// Builds the full media-server URL for a custom theme's background image. The relative path is
// already URL-encoded by the C# side (e.g. "My%20Theme/My%20Theme.png?v=<version>"), so it is used
// verbatim. Mirrors resolveMediaUrl in MediaImage.ts.
function resolveThemeUrl(relativePath: string): string {
    if (relativePath.startsWith("http") || relativePath.startsWith("data:")) {
        return relativePath
    }
    return `${window.MediaConfig.baseUrl}/themes/${relativePath}`
}

const builtInStyles = new Map<Theme, { styles: ElementStyles; image: any }>([
    [
        Theme.IlCovile,
        {
            styles: ilCovileThemeStyles,
            image: ilCovileFrame,
        },
    ],
    [
        Theme.OfMiceAndRabbits,
        {
            styles: ofMiceAndRabbitsThemeStyles,
            image: ofMiceAndRabbitsKarteczka,
        },
    ],
])

const borderAnimation =
    "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cstyle%3Epath%7Banimation:stroke 5s infinite linear;%7D@keyframes stroke%7Bto%7Bstroke-dashoffset:776;%7D%7D%3C/style%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23020024' /%3E%3Cstop offset='25%25' stop-color='%231c0979' /%3E%3Cstop offset='50%25' stop-color='%2306a4a6' /%3E%3Cstop offset='100%25' stop-color='%23ffe900' /%3E%3C/linearGradient%3E%3Cpath d='M1.5 1.5 l97 0l0 97l-97 0 l0 -97' stroke-linecap='square' stroke='url(%23g)' stroke-width='5' stroke-dasharray='388'/%3E%3C/svg%3E"

const styles = css`
    ${proseMirrorStyles}

    *,
    *:before,
    *:after {
        box-sizing: inherit;
    }

    :not(:defined) {
        visibility: hidden;
    }

    #wrapper {
        width: 100%;
        height: 100%;
    }

    #box {
        height: 100%;
    }

    #frame {
        height: 100%;
        padding: 0px;
        background-size: 100% 100%;
    }

    #topMenu {
        position: absolute;
        left: 0.1rem;
        top: 0.1rem;
        z-index: 9999;
        width: 100%;
    }

    #sideMenu {
        position: absolute;
        top: 3.3rem;
        left: 0.4rem;
        z-index: 9999;
        overflow: visible;
    }

    #bubbleMenu {
        font-size: 1rem;
        width: auto;
        display: flex;
        flex-flow: column nowrap;
        background-color: #e3e3e3;
        padding: 0.2rem;
        border-radius: 0.1rem;
    }

    #bubbleMenuRow {
        width: auto;
        display: flex;
        flex-flow: row nowrap;
        flex-wrap: wrap; /* important to prevent overflows */
        justify-content: center;
        gap: 0.1rem;
    }

    /* BubbleMenu.hide() is a no-op at init (isVisible guard), so the element
       sits at its original shadow DOM position, visible. Suppress that here.
       BubbleMenu.show() sets inline visibility:visible/opacity:1 which
       overrides these CSS rules, then appends the element to view.dom.parentElement
       (outside shadow DOM) so these rules stop applying from that point on. */
    .bubble-menu-wrapper {
        visibility: hidden;
        opacity: 0;
        position: absolute;
    }

    #imageBubbleMenu {
        font-size: 1rem;
        width: auto;
        display: flex;
        flex-flow: column nowrap;
        background-color: #e3e3e3;
        padding: 0.2rem;
        border-radius: 0.1rem;
    }

    #imageBubbleMenuRow {
        width: auto;
        display: flex;
        flex-flow: row nowrap;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.1rem;
    }

    .bubbleButton {
        /* use this too style bubble buttons one day */
    }

    .bubbleButton span {
        font-size: 1rem;
    }

    /* 🪞 Important! Available to be custom styled by users. */
    #content {
        padding: 2rem;
        height: 100%;
        max-width: 100vw;
        overflow-y: hidden;
        background-color: transparent;
        display: flex;
        text-rendering: optimizeLegibility;
        font-feature-settings: "kern", "liga", "dlig", "hlig", "cswh";
        font-kerning: auto;
        font-variant-numeric: oldstyle-nums;
        font-variant-ligatures: common-ligatures;
    }

    /* 🪞 Important! Available to be custom styled by users. */
    #background-image {
        position: absolute;
        height: 100%;
        width: 100%;
        padding: 0px;
        z-index: -2;
    }

    /* TODO entire scrollbar thing should be moved to the covile theme*/
    #scrollbar {
        position: fixed;
        left: 0.9rem;
        top: 2.8rem;
        bottom: 2.8rem;
        z-index: -1;
        transform: rotate(-0.2deg);
    }

    #scrollprogress {
        width: 8px;
        background-color: black;
        border-radius: 1px;
    }

    #scrollbackground {
        background: transparent;
        z-index: -1;
    }

    #openEditorButton {
        position: absolute;
        height: 2rem;
        width: 2rem;
        background-image: url("data:image/svg+xml,%3Csvg width='2rem' height='2rem' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M64.34 14.66A8 8 0 0 0 70 17a8 8 0 0 0-8 8 8 8 0 0 0-8-8 8 8 0 0 0 8-8 8 8 0 0 0 2.34 5.66Z' style='fill:%23fcd116'/%3E%3Cpath d='M30.81 50.19A13 13 0 0 0 40 54a13 13 0 0 0-13 13 13 13 0 0 0-13-13 13 13 0 0 0 13-13 13 13 0 0 0 3.81 9.19Z' style='fill:%23cbdb2e'/%3E%3Cpath d='M93.22 92.78A11 11 0 0 0 101 96a11 11 0 0 0-11 11 11 11 0 0 0-11-11 11 11 0 0 0 11-11 11 11 0 0 0 3.22 7.78Z' style='fill:%23fcd116'/%3E%3Cpath d='M85.56 38.42a177.85 177.85 0 0 1 21.55-29.55 5 5 0 0 1 7.06-.2l.1.1a5 5 0 0 1 .1 7 172 172 0 0 0-20.18 27.7C85.68 58 71.79 69.18 64.88 74.16l-1.3 1.3-7.19-7.2L57.62 67c5.48-3.8 19.79-14.64 27.94-28.58Z' style='fill:%23a2542a'/%3E%3Cpath d='m114.27 8.77-.1-.1a5 5 0 0 0-2.27-1.2 5 5 0 0 1-1.22 4.59 172 172 0 0 0-20.17 27.73C82 54.35 68.11 65.5 61.2 70.48l-1.3 1.3 3.68 3.68 1.3-1.3c6.91-5 20.8-16.13 29.31-30.69a172 172 0 0 1 20.18-27.73 5 5 0 0 0-.1-6.97Z' style='fill:%23bf7f66'/%3E%3Cpath d='M79.88 54.1a124.9 124.9 0 0 1-19.17 17.06l-.72.72 3.58 3.59 1.3-1.3A123.71 123.71 0 0 0 85.08 56l-1.93-2a2.26 2.26 0 0 0-3.27.1Zm10.67-14.5a2.71 2.71 0 0 0 .39 3.34l2.22 2.22c.52-.84 2.81-4.8 6.29-10.05l-2.17-2.28a1.65 1.65 0 0 0-2.57.23C93.41 35 92 37.21 90.55 39.6Zm20.62-32.25c1.9 4.46-.65 3.58-10.59 17.19a2 2 0 0 0 .2 2.6l2.46 2.46a144.21 144.21 0 0 1 11.14-13.87 5 5 0 0 0-3.21-8.38Z' style='fill:%23d3987f'/%3E%3Cpath style='fill:%23f9d8a2' d='m66.9 78.77-12.73 5.66-7.78-7.78 5.66-12.72 4.34 4.33 7.19 7.2 3.32 3.31z'/%3E%3Cpath style='fill:%23f2c05c' d='m60.58 72.46-4.19-4.2-1.64-1.64 4.45 4.46 1.38 1.38zm1.94 1.93-1.94-1.93 1.94 1.94v-.01zM52 63.93l-5.61 12.72 3.41 3.41a9.57 9.57 0 0 0 2.87-15.51Z'/%3E%3Cpath d='M54.1 93.17a47 47 0 0 1-13.37 28.74c-2.7 2.7-7.22-.09-12-5s-10-12-13.86-17.63c-3.54-5.22-5.95-9.23-5.95-9.23C28 71 46.39 76.65 46.39 76.65l7.78 7.78Z' style='fill:%23f2c05c'/%3E%3Cpath d='M54.1 93.17a47 47 0 0 1-13.37 28.74c-2.7 2.7-7.22-.09-12-5s-10-12-13.86-17.63c-3.54-5.22-5.95-9.23-5.95-9.23C28 71 46.39 76.65 46.39 76.65l7.78 7.78Z' style='fill:%23f9d8a2'/%3E%3Cpath d='m44.95 114 1.27 1.27a45.23 45.23 0 0 1-5.49 6.64c-2.7 2.7-7.22-.09-12-5s-10-12-13.86-17.63c-3.54-5.22-5.95-9.23-5.95-9.23C28 71 46.39 76.65 46.39 76.65l3.81 3.81-5.25 5.25a20 20 0 0 0 0 28.29Z' style='fill:%23f2c05c'/%3E%3Cpath d='M28.32 109.66 25 112.93a162.11 162.11 0 0 1-10.14-13.61c-3.54-5.22-5.95-9.23-5.95-9.23 14.85-14.84 29.26-14.73 34.94-13.94L30.13 89.87c-3.22 3.22-4.59 8.15-1.21 13.46a5.06 5.06 0 0 1-.6 6.33Z' style='fill:%23d39d48'/%3E%3Cpath d='M116.41 6.67a8 8 0 0 0-11.48.14C82.34 30.63 85.44 43.62 56.51 64.14c-2.26-2.26-3.08-3.53-5-3.17s-2 1.24-6.87 12.25c-6.1-.94-21.77-1.33-37.85 14.78a3 3 0 0 0-.45 3.67c7 11.7 26.79 42.12 36.51 32.4a50 50 0 0 0 14.24-30.6c.4-3.94-5.57-4.56-6-.61a44 44 0 0 1-12.5 26.92c-1 .94-4.45-1.82-5.49-2.73 3-2.74 7.87-7.66 10.89-12.69 2-3.4-3.1-6.49-5.14-3.09-2.68 4.47-7.3 9-10 11.52a142.15 142.15 0 0 1-10.08-13 55.05 55.05 0 0 1 6.5-5c3.4-2 .31-7.19-3.09-5.14a56.39 56.39 0 0 0-6.8 5.17c-.94-1.44-1.85-2.85-2.7-4.23C27.8 76.64 41.67 78.65 44.85 79.36c7.57 7.57 7.46 7.79 8.8 8s1.61-.15 14.46-5.87a3 3 0 0 0 .9-4.86l-1-1C75.73 69.87 88.58 59 96.78 45a169.22 169.22 0 0 1 19.77-27.2 8 8 0 0 0-.14-11.13ZM54.83 80.85 50 76l3-6.85 8.67 8.67Zm57.35-67.17C91 36.23 93 50 63.68 71.32l-2.87-2.87c29.2-21.13 27-34.82 48.48-57.51a2 2 0 0 1 2.9 2.74Z' style='fill:%2331352e'/%3E%3Cpath d='M14 57a10 10 0 0 1 10 10 3 3 0 0 0 6 0 10 10 0 0 1 10-10 3 3 0 0 0 0-6 10 10 0 0 1-10-10 3 3 0 0 0-6 0 10 10 0 0 1-10 10 3 3 0 0 0 0 6Zm13-6.68A16.12 16.12 0 0 0 30.68 54 16.12 16.12 0 0 0 27 57.68 16.12 16.12 0 0 0 23.32 54 16.12 16.12 0 0 0 27 50.32ZM101 93a8 8 0 0 1-8-8 3 3 0 0 0-6 0 8 8 0 0 1-8 8 3 3 0 0 0 0 6 8 8 0 0 1 8 8 3 3 0 0 0 6 0 8 8 0 0 1 8-8 3 3 0 0 0 0-6Zm-11 5.35A14.14 14.14 0 0 0 87.65 96 14.14 14.14 0 0 0 90 93.65 14.14 14.14 0 0 0 92.35 96 14.14 14.14 0 0 0 90 98.35ZM54 20a5 5 0 0 1 5 5 3 3 0 0 0 6 0 5 5 0 0 1 5-5 3 3 0 0 0 0-6 5 5 0 0 1-5-5 3 3 0 0 0-6 0 5 5 0 0 1-5 5 3 3 0 0 0 0 6Zm8-3.46.46.46-.46.46-.46-.46Z' style='fill:%2331352e'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;

        /* button cute outline? */
        border: black;
        border-style: solid;
        border-width: 2px;
        border-radius: 5px;
        outline: 1px solid #d3d3d3;
    }

    #openEditorButton:hover {
        background-color: #fff073;
    }

    #openEditorButton:active {
        background-color: cyan;
    }

    @keyframes shake {
        0% {
            transform: translate(0, 0) rotate(0deg);
        }
        20% {
            transform: translate(-0.5px, 0.5px) rotate(-3deg);
        }
        40% {
            transform: translate(1px, -0.5px) rotate(3deg);
        }
        60% {
            transform: translate(-1px, 0.5px) rotate(-2deg);
        }
        80% {
            transform: translate(-0.5px, -0.5px) rotate(2deg);
        }
        100% {
            transform: translate(0, 0) rotate(0deg);
        }
    }

    .shake {
        animation: shake 0.4s ease;
    }

    @keyframes glow {
        0% {
            box-shadow: 0 0 0px rgba(255, 255, 150, 0);
        }
        30% {
            box-shadow: 0 0 8px rgba(255, 255, 150, 0.7);
        }
        100% {
            box-shadow: 0 0 0px rgba(255, 255, 150, 0);
        }
    }

    .glow {
        animation: glow 0.6s ease;
    }

    .shake-glow {
        animation: shake 0.6s ease, glow 0.6s ease;
    }

    #lightbox {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.88);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    #lightbox[hidden] {
        display: none;
    }

    #lightbox-img {
        max-width: 95vw;
        max-height: 95vh;
        object-fit: contain;
        display: block;
    }

    #lightbox-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: white;
        font-size: 1.4rem;
        line-height: 1;
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 0.2rem;
        cursor: pointer;
    }

    #lightbox-close:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    span.glitter {
        position: absolute;
        top: 50%;
        width: 6px;
        height: 6px;
        animation: fall 1.5s ease-out forwards;
        opacity: 0;
    }

    span.glitter.g1 {
        left: 10%;
        animation-delay: 0s;
    }
    span.glitter.g2 {
        left: 30%;
        animation-delay: 0.2s;
    }
    span.glitter.g3 {
        left: 50%;
        animation-delay: 0.4s;
    }

    @keyframes fall {
        0% {
            transform: translateY(0) rotate(0);
            opacity: 1;
        }
        100% {
            transform: translateY(60px) rotate(360deg);
            opacity: 0;
        }
    }
`

const template = html<MarkdownNote>`
    <div id="scrollbar">
        <div
            ${ref("scroller")}
            id="scrollprogress"></div>
        <div id="scrollbackground"></div>
    </div>
    <div
        id="sideMenu"
        ?hidden="${x => !x.isEditorButtonVisible}">
        <button
            @click="${(x, c) =>
                x.onEditorToggleButtonClicked(c.event.currentTarget)}"
            id="openEditorButton">
            <span class="glitter g1">✨</span>
            <span class="glitter g2">🛸</span>
            <span class="glitter g3">📜</span>
        </button>
    </div>
    <div ${ref("bubbleMenu")} class="bubble-menu-wrapper">
        <div id="bubbleMenu">
            <div id="bubbleMenuRow">
                <button
                    class="bubbleButton"
                    @click="${x =>
                        x.editor.chain().focus().toggleBold().run()}">
                    <span><b>b</b></span>
                </button>
                <button
                    class="bubbleButton"
                    @click="${x =>
                        x.editor.chain().focus().toggleItalic().run()}">
                    <span><i>i</i></span>
                </button>
                <button
                    class="bubbleButton"
                    @click="${x =>
                        x.editor.chain().focus().toggleStrike().run()}">
                    <span><s>s</s></span>
                </button>
                <button
                    class="bubbleButton"
                    @click="${x =>
                        x.editor.chain().focus().toggleHighlight().run()}">
                    <span><mark>highlight</mark></span>
                </button>
            </div>
        </div>
    </div>
    <div ${ref("imageBubbleMenu")} class="bubble-menu-wrapper">
        <div id="imageBubbleMenu">
            <div id="imageBubbleMenuRow">
                <button
                    class="bubbleButton"
                    @click="${x => x.setImageLayout('float-left')}">
                    <span>← Float left</span>
                </button>
                <button
                    class="bubbleButton"
                    @click="${x => x.setImageLayout('block')}">
                    <span>↕ Block</span>
                </button>
                <button
                    class="bubbleButton"
                    @click="${x => x.setImageLayout('float-right')}">
                    <span>Float right →</span>
                </button>
                <button
                    class="bubbleButton"
                    @click="${x => x.displaySelectedImage()}">
                    <span>🖼 Display</span>
                </button>
            </div>
        </div>
    </div>
    <div
        ${ref("lightbox")}
        id="lightbox"
        ?hidden="${x => !x.lightboxOpen}"
        @click="${x => x.closeLightbox()}">
        <img
            ${ref("lightboxImg")}
            id="lightbox-img"
            @click="${(x, c) => x.onLightboxImageClicked(c.event)}" />
        <button
            id="lightbox-close"
            @click="${x => x.closeLightbox()}">&#x2715;</button>
    </div>
    <div id="wrapper">
        <div id="box">
            <div
                id="topMenu"
                ?hidden="${x => !x.isEditable}">
                ${when(
                    x => x.editor !== undefined,
                    html<MarkdownNote>`
                        <note-toolbar :editor=${x => x.editor}></note-toolbar>
                    `
                )}
            </div>
            <div id="frame">
                <img
                    ${ref("backgroundImage")}
                    id="background-image" />
                <div
                    ${ref("note")}
                    id="content"
                    class="scrollbar"
                    spellcheck="false"></div>
            </div>
        </div>
    </div>
`

export class MarkdownNote extends FASTElement {
    // TODO rename to HTMLNote
    // * its actually more of a HTMLNote now
    @observable isEditable: boolean = false
    @observable isEditorButtonVisible: boolean = false
    @observable isDebug: boolean = false
    @observable editor: Editor
    @observable lightboxOpen: boolean = false

    themeStyles: ElementStyles | undefined
    fontFaceStyleElement: HTMLStyleElement | undefined

    note: HTMLDivElement
    bubbleMenu: HTMLElement
    imageBubbleMenu: HTMLElement
    scroller: HTMLElement
    backgroundImage: HTMLImageElement
    lightbox: HTMLElement
    lightboxImg: HTMLImageElement

    /* 🖼️ The picture this note is currently displaying, as the note stores it:
       a logical media path, not a resolved URL. Kept so the lightbox can hand the
       same image to the fullscreen viewer when it is double-clicked. */
    lightboxSrc: string | null = null
    lightboxMediaId: string | null = null

    subscriptions: Subscription[] = []

    /* 🖱️ Double-click bookkeeping. Images are keyed by their media path rather than by
       element identity, so a node view rebuilt between the two clicks (which ProseMirror
       is free to do when the first click selects the image) still counts as the same
       picture. */
    private lastImageClickAt: number = 0
    private lastImageClickKey: string | null = null
    private lastLightboxClickAt: number = 0

    constructor() {
        super()
    }

    connectedCallback(): void {
        super.connectedCallback()

        console.log(this.bubbleMenu)

        // TODO custom themes
        this.generateEditor("", "null")

        this.isDebug = hasDebugAttribute()

        this.setNoteTheme("OfMiceAndRabbits")
        // this.setNoteTheme("IlCovile")

        this.subscriptions.push(this.setCustomNoteThemeSubscription())

        document.documentElement.style.fontSize = `${
            window.devicePixelRatio * 16
        }px`
    }

    disconnectedCallback(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe())

        super.disconnectedCallback()
    }

    setCustomNoteThemeSubscription(): Subscription {
        return fromEvent(document, SET_CUSTOM_NOTE_THEME)
            .pipe(
                map(x => x as CustomEvent),
                map(x => x.detail as CustomNoteTheme)
            )
            .subscribe(x => {
                if (x.imageUrl) {
                    // Preferred path: load the background from the media server by URL.
                    this.backgroundImage.hidden = false
                    this.setNoteBackgroundImageFromPath(resolveThemeUrl(x.imageUrl))
                } else if (x.imageData) {
                    // Legacy fallback: inline base64 data URI.
                    this.backgroundImage.hidden = false
                    this.setNoteBackgroundImageFromBase64(x.imageData)
                } else {
                    this.backgroundImage.hidden = true
                }

                this.setNoteStyles(x.styles)
            })
    }

    setNoteContent(content: string) {
        if (this.editor == undefined) {
            console.error("Editor is not yet initialized.")
            return
        }

        this.editor.commands.setContent(content)
    }

    setNoteBackgroundImageFromPath(path: string) {
        this.backgroundImage.hidden = false
        this.backgroundImage.src = path
    }

    setNoteBackgroundImageFromBase64(imageData: string) {
        this.backgroundImage.src = `data:image/png;base64,${imageData}`
    }

    setNoteTheme(name: string) {
        let themeName = name as Theme

        if (!builtInStyles.has(themeName)) {
            console.error(
                `Failed to find builtin theme for name: ${name}, reverting to default.`
            )
            themeName = DEFAULT_THEME
        }

        const theme = builtInStyles.get(themeName)!

        this.setNoteStyles(theme.styles!)
        this.setNoteBackgroundImageFromPath(theme.image!)
    }

    setNoteStyles(styles: ElementStyles | string) {
        if (typeof styles === "string") {
            // @font-face inside adopted stylesheets (shadow DOM) is silently
            // ignored by Chromium. Hoist them into document.head instead.
            const fontFaceRules = styles.match(/@font-face\s*\{[^}]*\}/g) ?? []
            if (this.fontFaceStyleElement) {
                this.fontFaceStyleElement.remove()
                this.fontFaceStyleElement = undefined
            }
            if (fontFaceRules.length > 0) {
                this.fontFaceStyleElement = document.createElement("style")
                this.fontFaceStyleElement.textContent = fontFaceRules.join("\n")
                document.head.appendChild(this.fontFaceStyleElement)
            }
        }

        const elementStyles =
            styles instanceof ElementStyles
                ? styles
                : css`
                      ${styles}
                  `

        if (this.themeStyles !== undefined)
            this.$fastController.removeStyles(this.themeStyles)
        this.themeStyles = elementStyles
        this.$fastController.addStyles(this.themeStyles)
    }

    setNoteEditable(editable: boolean) {
        this.isEditable = editable
        this.editor.setEditable(editable)
        if (!editable) {
            this.editor.commands.setTextSelection({ from: 0, to: 0 })
            window.getSelection()?.removeAllRanges()
        }
    }

    setMediaSrc(mediaId: string, src: string) {
        console.log("meow 🐱")
        console.log(mediaId)
        console.log(src)
        this.editor
            .chain()
            .command(({ tr, state }) => {
                let found = false

                state.doc.descendants((node, pos) => {
                    if (
                        node.type.name === "mediaImage" &&
                        node.attrs.mediaId === mediaId
                    ) {
                        tr.setNodeMarkup(pos, undefined, {
                            ...node.attrs,
                            src,
                            mediaState: "ready",
                        })
                        found = true
                        return false // stop traversal
                    }
                    return true
                })

                return found
            })
            .run()
    }

    setMediaNodeState(mediaId: string, state: string) {
        this.editor
            .chain()
            .command(({ tr, state: editorState }) => {
                let found = false
                editorState.doc.descendants((node, pos) => {
                    if (node.type.name === "mediaImage" && node.attrs.mediaId === mediaId) {
                        tr.setNodeMarkup(pos, undefined, { ...node.attrs, mediaState: state })
                        found = true
                        return false
                    }
                    return true
                })
                return found
            })
            .run()
    }

    removeMediaNode(mediaId: string) {
        this.editor
            .chain()
            .command(({ tr, state }) => {
                state.doc.descendants((node, pos) => {
                    if (node.type.name === "mediaImage" && node.attrs.mediaId === mediaId) {
                        tr.delete(pos, pos + node.nodeSize)
                        return false
                    }
                    return true
                })
                return true
            })
            .run()
    }

    setImageLayout(layout: string) {
        const { state } = this.editor
        // Only insert a trailing paragraph when floating and the image is
        // the last node — avoids inserting when there is already content below.
        const needsTrailingParagraph =
            layout !== 'block' && state.selection.to >= state.doc.content.size

        const chain = this.editor.chain().focus().updateAttributes('mediaImage', { layout })

        if (needsTrailingParagraph) {
            chain.command(({ state: s, dispatch, tr }) => {
                if (dispatch) {
                    dispatch(tr.insert(
                        s.selection.to,
                        s.schema.nodes.paragraph.create()
                    ))
                }
                return true
            })
        }

        chain.run()
        this.editor.commands.setTextSelection(this.editor.state.selection.to)
    }

    toggleEditorButton(toggle: boolean) {
        this.isEditorButtonVisible = toggle
    }

    onEditorToggleButtonClicked(eventTarget: EventTarget | null) {
        this.blur()

        if (eventTarget === null) return

        const button = eventTarget as HTMLButtonElement
        const wrapper = button.parentElement

        const glitter = wrapper?.querySelectorAll(".glitter")

        glitter?.forEach(el => {
            const htmlel = el as HTMLElement
            htmlel.style.animation = "none"
            htmlel.offsetHeight // trigger reflow
            htmlel.style.animation = ""
        })

        button.classList.add("shake-glow")
        button.addEventListener(
            "animationend",
            () => {
                button.classList.remove("shake-glow")
            },
            { once: true }
        )

        try {
            window.OnEditorToggleRequested()
        } catch {
            console.log("Editor Toggle button is not registered.")
        }
    }

    listAllExtensions() {
        this.editor.extensionManager.extensions.forEach(x => console.log(x))
    }

    generateEditor(content: string, theme: string) {
        // * tiptap
        this.editor = new Editor({
            element: this.note,
            content,
            autofocus: true, // ? need to check what is this actually doing
            editable: false,
            extensions: [
                /* Core Extensions */
                Document,
                Text,
                TextStyle,
                Paragraph,
                History,
                Focus.configure({
                    // https://tiptap.dev/api/extensions/focus
                    mode: "shallowest",
                    className: "focus",
                }),
                /* */
                Heading.configure({ levels: [1, 2, 3, 4] }),
                ArchParagraph,
                Bold,
                Italic,
                Color,
                Strike,
                Highlight,

                /* */
                // MediaImage,
                MediaImage.configure({
                    resize: {
                        enabled: true,
                        directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
                        minWidth: 50,
                        minHeight: 50,
                        alwaysPreserveAspectRatio: true,
                    },
                }),

                HardBreak,
                /* */
                OrderedList,
                BulletList,
                ListItem,
                /* */
                Blockquote,
                /* huh */
                Mention,
                Gapcursor,
                ClipboardImagePaste,
                /* */
                BubbleMenu.configure({
                    element: this.bubbleMenu,
                    shouldShow: ({ state, editor }) =>
                        editor.isEditable && !editor.isActive('mediaImage') && !state.selection.empty,
                    options: {
                        placement: 'top',
                        flip: { padding: 60 },
                    },
                }),
                BubbleMenu.extend({ name: 'imageBubbleMenu' }).configure({
                    element: this.imageBubbleMenu,
                    shouldShow: ({ editor }) => editor.isEditable && editor.isActive('mediaImage'),
                    options: {
                        placement: 'top',
                        flip: { padding: 60 },
                    },
                }),
                // * Obsolete, themes are now added through $fastController.add/removeStyles()
                // ThemeExtension.configure({
                //     theme: theme,
                // }),
                //

                /* Custom Extensions */
                TipTapSanctuaryLink,
            ],
            editorProps: {
                attributes: {
                    class: "ilCovile",
                },
            },
            onUpdate: ({ editor }) => {
                if (this.isEditable) {
                    const html = editor.getHTML()

                    // TODO possibly add throttle
                    // TODO disable this in debug mode
                    // TODO make sure this even is always being properly registered
                    try {
                        // https://github.com/beautifier/js-beautify?tab=readme-ov-file

                        const options = { indent_size: 4, inline: [] as string[] }
                        var formattedHtml = html_beautify(html, options)

                        window.OnNoteContentUpdated(formattedHtml)
                    } catch {
                        if (hasDebugAttribute()) return
                        console.error("OnNoteContentUpdated was not set.")
                    }
                }
            },
        })

        const proseEl = this.note.firstChild as HTMLElement | null
        if (proseEl) {
            // Inline style applied immediately so the scrollbar never flashes
            // before the shadow-DOM stylesheet gets its first paint cycle.
            proseEl.style.setProperty('scrollbar-width', 'none')
            ;(proseEl.style as any).msOverflowStyle = 'none'
        }

        this.note.firstChild?.addEventListener("scroll", e => {
            // console.log("scrollin")
            const element = this.note.firstChild as HTMLElement
            var html = document.documentElement
            let step = 100 / (element.scrollHeight - element.clientHeight)
            this.scroller.style.height = step * element.scrollTop + "%"
        })

        /* Capture phase on the editor container: it sits above every image node view, so
           it keeps working when ProseMirror throws one away and builds another, and it
           can't be silenced by anything inside the editor that stops propagation. */
        this.note.addEventListener('click', (e: Event) => this.onEditorClicked(e), true)

        console.log(this.note.firstChild)
    }

    /* 🖼️ The lightbox is not a viewer — it is a property of the note, saved with it
       and restored on load, so a scroll can hang in space showing a picture. Setting
       one is therefore an edit-mode act, done from the image's bubble menu, and only
       the ✕ takes it back down. Escape deliberately does not: it leaves the note, and
       the picture stays up. */
    displaySelectedImage() {
        const { mediaId, src } = this.editor.getAttributes('mediaImage')
        if (!src) return

        this.openLightbox(mediaId ?? null, src)

        // A deliberate act, unlike a restore — Unity saves it with the note.
        // Images from before media ids existed can still be displayed, just not remembered.
        if (mediaId) {
            try { window.OnLightboxStateChanged(mediaId) } catch { /* not registered outside Unity */ }
        }
    }

    onEditorClicked(event: Event) {
        /* Anchored on data-media-src rather than the media id: the rendered <img> and the
           node view's wrapper both carry it, and for a legacy note whose image is an inline
           data: URI only the wrapper does — so closest() walks up and still finds a path. */
        const image = (event.target as HTMLElement | null)?.closest(
            '[data-media-src]'
        ) as HTMLElement | null

        if (!image) {
            this.lastImageClickKey = null
            return
        }

        const src = image.dataset.mediaSrc || null
        const mediaId = image.dataset.mediaId || null
        const key = src ?? mediaId
        if (!key) return

        const now = Date.now()
        const isSecondClick =
            key === this.lastImageClickKey &&
            now - this.lastImageClickAt <= IMAGE_DOUBLE_CLICK_MS

        this.lastImageClickAt = now
        // Cleared on a hit so a third click starts a fresh pair rather than firing again.
        this.lastImageClickKey = isSecondClick ? null : key

        if (isSecondClick) this.requestFullscreenView(src, mediaId)
    }

    onLightboxImageClicked(event: Event) {
        // Without this the click reaches the backdrop and takes the picture down.
        event.stopPropagation()

        const now = Date.now()
        const isSecondClick = now - this.lastLightboxClickAt <= IMAGE_DOUBLE_CLICK_MS
        this.lastLightboxClickAt = isSecondClick ? 0 : now

        if (isSecondClick) this.requestFullscreenView(this.lightboxSrc, this.lightboxMediaId)
    }

    /* 🔍 Fullscreen is the opposite: a look, owned by the player rather than the note.
       It lives in its own browser, so opening it leaves the lightbox untouched
       underneath and closing it drops straight back onto whatever was here. */
    requestFullscreenView(src: string | null, mediaId: string | null) {
        if (!src) return
        try {
            window.OnFullscreenViewRequested({ mediaId: mediaId ?? '', src })
        } catch { /* not registered outside Unity */ }
    }

    closeLightbox() {
        this.lightboxOpen = false
        this.lightboxImg.src = ''
        this.lightboxSrc = null
        this.lightboxMediaId = null
        try { window.OnLightboxStateChanged('') } catch { /* not registered outside Unity */ }
    }

    openLightboxByMediaId(mediaId: string) {
        let targetSrc: string | null = null

        this.editor.state.doc.descendants((node) => {
            if (node.type.name === 'mediaImage' && node.attrs.mediaId === mediaId) {
                targetSrc = node.attrs.src
                return false
            }
            return true
        })

        if (!targetSrc) return
        this.openLightbox(mediaId, targetSrc)
        // intentionally no OnLightboxStateChanged call here — this is a restore, not a user action
    }

    private openLightbox(mediaId: string | null, src: string) {
        const resolved = resolveMediaUrl(src)
        if (!resolved) return

        this.lightboxImg.src = resolved
        this.lightboxSrc = src
        this.lightboxMediaId = mediaId
        this.lightboxOpen = true
    }

    /* 🖼️ The displayed picture is a plain <img> outside ProseMirror, so the node-view
       refresh below never reaches it. On a cold start the media server can announce itself
       after this note has already restored its lightbox, which leaves the picture resolved
       against an empty base url — a broken-image icon until it is closed and reopened. */
    refreshLightboxSrc() {
        if (!this.lightboxOpen || !this.lightboxSrc) return

        const resolved = resolveMediaUrl(this.lightboxSrc)
        if (!resolved || this.lightboxImg.src === resolved) return

        this.lightboxImg.src = resolved
    }

    refreshMediaImageSrcs() {
        if (!this.editor) return
        const { doc } = this.editor.state
        const { view } = this.editor
        doc.descendants((node, pos) => {
            if (node.type.name !== 'mediaImage') return
            const src = node.attrs.src as string | null
            if (!src) return
            const resolved = resolveMediaUrl(src)
            if (!resolved) return
            const domNode = view.nodeDOM(pos) as HTMLElement | null
            if (!domNode) return
            const img = (domNode instanceof HTMLImageElement
                ? domNode
                : domNode.querySelector('img')) as HTMLImageElement | null
            if (!img || img.src === resolved) return
            img.src = resolved
        })
    }
}

MarkdownNote.define({
    name: "markdown-note",
    template,
    styles,
})
