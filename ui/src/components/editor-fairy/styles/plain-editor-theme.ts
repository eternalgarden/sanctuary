import { css } from "@microsoft/fast-element"

export const plainEditorTheme = css`
    * {
        --special-primary-color: #ff9bd8;
        --special-secondary-color: #5d5dff;
        box-sizing: border-box;
    }

    h1,
    h2,
    h3,
    h4,
    span,
    p {
        font-family: "Fell Pica";
    }

    h3 {
        margin-top: 0;
        margin-bottom: 0.5rem;
    }

    fairy-box::part(container) {
        background-color: #f8faff;
        border-style: double;
        border-width: 4px;
    }

    button {
        background-color: inherit;
        font-family: "Fell Pica SC";
        text-transform: lowercase;
        font-size: 1rem;
        background-color: transparent;
        border: #5d5dff;
        border-style: double;
        outline: none;
        margin: 2px;
    }

    button:hover {
        background-color: var(--special-primary-color);
        color: var(--special-secondary-color);
    }

    button:active {
        background-color: transparent;
        color: #2000ff;
    }

    code {
        /* 🔡 Naming a real family (rather than the bare monospace keyword)
           opts out of Chromium's separate, smaller default monospace size — so
           without an explicit font-size this would render LARGER than before,
           not smaller. 0.75em lands it just under where it used to sit. */
        font-family: "Monof55", monospace;
        font-size: 1em;
    }

    ul {
        list-style-type: square;
        padding-left: 2em;
    }

    li {
    }

    a {
        color: var(--special-secondary-color);
    }

    a:hover {
        color: var(--special-primary-color);
    }

    .secondary {
        color: #5e5e5e;
    }

    /* 
        This works for styling scrollbar:
        https://css-tricks.com/almanac/properties/s/scrollbar/
    */

    .scroller::-webkit-scrollbar {
        width: 1em;
        background-color: var(--special-secondary-color);
    }

    .scroller::-webkit-scrollbar-track {
        box-shadow: inset 0 0 6px var(--special-primary-color);
    }

    .scroller::-webkit-scrollbar-thumb {
        width: 0.8em;
        background-color: var(--special-primary-color);
        outline: 1px solid slategrey;
    }

    .listedTheme {
        padding: 0.4rem;
    }

    .listedTheme:hover {
        background-color: var(--special-primary-color);
        outline: 1px solid slategrey;
    }

    .listedTheme > p, h4 {
        width: 100%;
        text-align: center;
    }

    .listedTheme > p {
        margin: 0;
    }

    .themeList.content {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        background-color: transparent;
        padding: 0.5rem;
    }

    .themeList.scroller {
        min-width: 180px;
        overflow-y: auto;
        border-style: ridge;
    }
`
