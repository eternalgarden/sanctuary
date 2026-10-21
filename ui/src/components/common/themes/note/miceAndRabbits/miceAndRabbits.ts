import { css } from "@microsoft/fast-element"
import { Theme } from "../builtin-themes-enum"
import { NoteThemeDescriptor } from "../note-theme-types"
// import frame from "./miceAndRabbits.png"
import frame from "./miceAndRabbitsGray.png"

const themeDescription = `
These might be actually rats, not mice, even better!

A theme with graphics from **electric fur** 🖤⚔️🦭

https://www.instagram.com/electric.fur/
`

export const ofMiceAndRabbitsKarteczka: any = frame

export const OfMiceAndRabbitsThemeDescriptor: NoteThemeDescriptor =
    new NoteThemeDescriptor(Theme.OfMiceAndRabbits, themeDescription, false)

export const ofMiceAndRabbitsThemeStyles = css`
    * {
        font-family: "Fell Pica";
    }

    :host {
        --main-text-color: #fffaee;
        --secondary-text-color: #f9e8bb;
    }

    ::selection {
        background-color: #c97878;
    }

    #content {
        padding: 4rem 6rem;
    }

    /* dark transparent layer between text and background */
    #content::before {
        content: "";
        position: absolute;
        left: 4vw;
        top: 2vh;
        right: 4vw;
        bottom: 2vh;
        background-color: #1a1a1a73;
        backdrop-filter: blur(1px);
        border-radius: 5px;
        z-index: -1;
        box-sizing: content-box;
        padding: inherit;
    }

    #scrollprogress {
        background-color: var(--secondary-text-color);
        border-radius: 1px;
    }

    p {
        color: var(--main-text-color);
        font-size: 1rem;
        line-height: 1.5;
        letter-spacing: 0.01em;
    }

    s,
    strong,
    em,
    mark,
    a {
        font-family: inherit;
    }

    mark {
        background-color: #c97878;
        border-radius: 2px;
        color: inherit;
    }

    a {
        color: #ffb4a2;
        text-decoration-thickness: 0.1em;
        text-decoration: underline;
        text-underline-offset: 0.2em;
    }

    blockquote p.arch,
    blockquote p {
        color: var(--secondary-text-color);
        font-style: italic;
    }

    ol {
        color: var(--secondary-text-color);
        list-style-type: georgian;
    }

    ul {
        color: var(--secondary-text-color);
    }

    li > p {
        margin: 0.2rem;
    }

    h1,
    h2,
    h3 {
        font-family: "Double Pica";
        text-shadow: 3px 2px 2px rgb(16 16 16);
        text-align: right;
        color: var(--secondary-text-color);
    }

    h4 {
        font-family: "Fell Pica SC";
        color: var(--secondary-text-color);
        font-weight: normal;
        font-size: 1rem;
        letter-spacing: 0.01em;
        line-height: 1.3;
        text-shadow: rgb(119, 119, 119) 1px 1px 1px;
    }

    p.arch {
        color: var(--main-text-color);
    }

    p.arch::first-line {
        font-family: "Fell Pica SC";
        letter-spacing: 0.01em;
    }

    p.arch::first-letter {
        font-family: "Typographer Woodcut";
        font-style: normal;
        font-weight: normal;
        text-transform: uppercase;

        font-size: 4rem;
        margin-bottom: -2rem;
        margin-top: -0.9rem;

        text-shadow: 3px 3px 0px rgb(16 16 16);
        padding-right: 0.4rem;

        vertical-align: top;
        float: left;
    }

    blockquote p.arch::first-letter {
        margin-bottom: -0.5rem;
    }

    blockquote p.arch {
        margin-top: 1.5rem;
        margin-bottom: 1.5rem;
        line-height: 1.3;
    }
`
