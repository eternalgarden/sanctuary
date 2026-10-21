import { css } from "@microsoft/fast-element"
import { NoteThemeDescriptor } from "../note-theme-types"
import { Theme } from "../builtin-themes-enum"
import frame from "./ilCovileFrame.png"

const ilCovileThemeDescription = `
A theme inspired by Il Covile magazine and their usage of Fell Types.

https://www.ilcovile.it/

Fell Types by Igino Marini: https://www.ikern.space/about
`

export const ilCovileFrame: any = frame

export const IlCovileThemeDescriptor: NoteThemeDescriptor =
    new NoteThemeDescriptor(Theme.IlCovile, ilCovileThemeDescription, false)

export const ilCovileThemeStyles = css`
    * {
        font-family: "Fell Pica";
    }

    ::selection {
        background-color: #cdc1f4;
    }

    #content {
        padding: 12vw;
    }

    #scrollprogress {
        background-color: #ff2525;
        z-index: -3;
    }

    p {
        line-height: 1.3;
    }

    p.arch {
        font-weight: normal;
    }

    p.arch::first-line {
        font-family: "Fell Pica SC";
    }

    p.arch::first-letter {
        font-family: "Flowers Initials";
        font-style: normal;

        /* The margin sizes are hightly font-dependant in this case */
        margin-top: -0.8rem;
        margin-bottom: -2rem;

        text-transform: uppercase;

        font-size: 5rem;
        line-height: 6rem;

        float: left;
        vertical-align: top;
        padding-right: 0.4rem;
    }

    s,
    strong,
    em,
    mark,
    a {
        font-family: inherit;
    }

    a {
        color: red;
    }

    strong {
        color: black;
    }

    mark {
        background-color: #ff8484;
        border-radius: 2px;
        padding: 0 0.3rem;
    }

    h1,
    h2,
    h3 {
        color: #393939;
        font-family: "Double Pica";
    }

    h4 {
        font-family: "Fell Pica SC";
        color: #393939;
        font-weight: normal;
        font-size: 1rem;
        letter-spacing: 0.04em;
    }

    li > p {
        margin: 0.2rem;
    }

    pre {
        background-color: #131313;
        border-radius: 5px;
        color: #fff;
        padding: 0.5rem;
        font-size: 0.7rem;
    }

    blockquote {
        color: #393939;
        font-style: italic;
    }
`
