/* 🪶🗃️ Inspired by Tailwind */
/* But not using it because it is a mess to set it up with Shadow DOM */

import { css } from "@microsoft/fast-element"

export const windcss = css`
    .flex {
        display: flex;
    }

    .flex-row {
        flex-direction: row;
    }

    .flex-col {
        flex-direction: column;
    }

    .flex-grow-one {
        flex-grow: 1;
    }

    .justify-items-center {
        justify-items: center;
    }

    /* https://tailwindcss.com/docs/align-self */
    .self-center {
        align-self: center;
    }

    .self-baseline {
        align-self: baseline;
    }
`