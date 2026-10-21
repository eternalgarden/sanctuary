import { css } from "@microsoft/fast-element";

/* 
    TODO import postcss-digested styles into css`` HOW?
    so apparently this is some postcss generated magic (the scrollbar stuff) 
    but since i didn't know and still sadly don't
    how to import css files into this css`` fast-element syntax
    so that a postcss, webpack-digested version of that css would
    go into css``
    well maybe one day
*/

export const proseMirrorStyles = css`

    div.ProseMirror {
        /* the only div created by prosemirror is the root editor 
        container, here scrolling is enabled on it */
        overflow-y: scroll;
    }

    .ProseMirror {
        /* this flex-grow is an important setting as otherwise the
        clicking-space for getting focus inside writing editor is either
        tiny or completely null otherwise*/
        flex-grow: 1;
    }

    .ProseMirror:focus {
        /* avoid the ugly default outline for editable div */
        outline: none;
    }

    .ProseMirror::-webkit-scrollbar {
        display: none;
    }
    .ProseMirror {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .ProseMirror img {
        max-width: 100%;
        height: auto;
    }

    /* ResizableNodeView container — constrain to note width */
    .ProseMirror [data-resize-container] {
        max-width: 100%;
    }

    .ProseMirror [data-resize-wrapper] {
        max-width: 100%;
    }

    /* Image layout modes */
    .ProseMirror [data-resize-container][data-image-layout="float-left"] {
        float: left;
        margin-right: 1em;
        margin-bottom: 0.5em;
    }

    .ProseMirror [data-resize-container][data-image-layout="float-right"] {
        float: right;
        margin-left: 1em;
        margin-bottom: 0.5em;
    }

    .ProseMirror [data-resize-container][data-image-layout="block"] {
        clear: both;
    }

    /* Resize handles — hidden by default, only shown on selected node in edit mode */
    .ProseMirror [data-resize-handle] {
        background-color: rgba(0, 0, 0, 0.45);
        border-radius: 2px;
        z-index: 10;
        transition: background-color 0.15s;
        opacity: 0;
        pointer-events: none;
    }

    .ProseMirror[contenteditable="true"] .ProseMirror-selectednode [data-resize-handle] {
        opacity: 1;
        pointer-events: auto;
    }

    .ProseMirror[contenteditable="true"] .ProseMirror-selectednode [data-resize-handle]:hover {
        background-color: rgba(0, 100, 200, 0.7);
    }

    /* Edge handles — sizes still apply regardless of visibility */
    .ProseMirror [data-resize-handle="top"],
    .ProseMirror [data-resize-handle="bottom"] {
        height: 10px;
        cursor: ns-resize;
    }

    .ProseMirror [data-resize-handle="left"],
    .ProseMirror [data-resize-handle="right"] {
        width: 10px;
        cursor: ew-resize;
    }

    /* Corner handles */
    .ProseMirror [data-resize-handle="top-left"],
    .ProseMirror [data-resize-handle="bottom-right"] {
        width: 14px;
        height: 14px;
        cursor: nwse-resize;
    }

    .ProseMirror [data-resize-handle="top-right"],
    .ProseMirror [data-resize-handle="bottom-left"] {
        width: 14px;
        height: 14px;
        cursor: nesw-resize;
    }

`