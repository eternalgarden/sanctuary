# sanctuary

> 🌟📜🐇 [Download Sanctuary at itch.io](https://eternalgarden.itch.io/sanctuary)

This repository is a FOSS porting project of Sanctuary from its Unity implementation into Godot.

![sanctuary image header](./docs/readme_media/sanctuary_header/sanctuary_header.png)

sanctuary is a software for personal journaling
- You walk around in a little 3D world, place your notes and edit them with a neat little text editor.
- It is inspired by the idea of memory palaces.
- It hopes to function as a spatial aid in both memorization and strengthening emotional connection to things you want to keep close to your heart in the moments of darkness.
- It uses [a custom event-bus 'rzeka'](https://github.com/eternalgarden/rzeka) architecture.
- The final Unity version is freely available for download and your own journaling endeavours [here & now on itch.io](https://eternalgarden.itch.io/sanctuary) for Linux, Mac & Windows.
  - 📜🍰 *Your notes will be fully transferrable to the new Godot version!*

## Your notes are (quite) safe

sanctuary inits a `git repository` where it created your user data & notes directory:
- `~/Documents/sanctuary_magic_box/`
- It does that with help of [libgit2sharp](https://github.com/libgit2/libgit2sharp).
- Every time your note is saved, a `git commit` with changes to this note is made.
- This ensures a much greater safety of your notes in case something goes really bad.
  - e.g. data migration of a new sanctuary version.
  - or simply if you accidentally delete a bunch of your notes or made some edits that you want to undo.
- "_quite_" because it is still your responsibility to make sure to back up that `sanctuary_magic_box` directory.

## Note editor

![sanctuary note editor screenshot](./docs/readme_media/sanct_note_editor.png)

The note editor supports:
- basic text formatting (with a lil' emoji picker)
- adding images (resizing them and setting their text flow property)
- custom themes (that you write with `css` and see them updated in real-time in sanctuary, more notes on that inside sanctuary)

## Why switch to Godot?

I no longer trust in the future Unity licensing decisions. Already locking access to *users' own projects* behind a login screen is a major red flag of their potential intentions and trajectories.

I also firmly believe in the superiority of an open-source software (longevity, safety, transparency, community-orientation) as opposed to the black boxes like Unity Engine.

This is especially important for a notemaking software where people put their private thoughts.

Switching to Godot from Unity was not a decision I made lightly, because Unity *Engine* is a magnificent machine that I came to know very closely over the last 10 years.

But Godot is very meow, I love it, it feels like breathing! The quest begins 🐱🪽🌟

## Log

- `7th May 2026` starting the porting and refactoring work of the underlying [event-bus 'rzeka'](https://github.com/eternalgarden/rzeka) architecture.
- `28th May 2026` the porting of rzeka is basically complete, working on the documentation.
