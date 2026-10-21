import "@tiptap/extension-image"

/*
Note this, traveller!
Module augmentation is additive, not exclusive!
So you basically add the renderMode to the ImageOptions here.
*/
declare module "@tiptap/extension-image" {
  interface ImageOptions {
    renderMode?: "runtime" | "export"
  }
}
