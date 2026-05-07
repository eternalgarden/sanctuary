![sanctuary image header](./docs/readme_media/sanctuary_header/sanctuary_header.png)

sanctuary is a software for personal journaling. 
- You walk around in a little 3D world, place your notes and edit them with a neat little text editor.
- It is inspired by the idea of memory palaces.
- It hopes to function as a spatial aid in both memorization and strengthening emotional connection to important events in your life and things you want to keep close to your heart in moments of darkness.
- It uses a custom event-bus [rzeka](https://github.com/eternalgarden/rzeka) architecture.
- The latest version `1.7.1_coreprincess` is freely available for download and your journaling [here & now on itch.io](https://eternalgarden.itch.io/sanctuary) for Linux, Mac & Windows. 
  - it is the legacy version built with Unity Engine
  - this repository is the port of that project to Godot (`7th May 2026` _in very early stages_)
  - 📜🍰 *your notes will be fully transferrable to the new Godot version*

## Your notes are (quite) safe

sanctuary inits a `git repository` where it created your user data & notes directory:
- `~/Documents/sanctuary_magic_box/`
- It does that with help of [libgit2sharp](https://github.com/libgit2/libgit2sharp)
- Every time your note is saved, a `git commit` with changes to this note is made
- This ensures a much greater safety of your notes in case something goes really bad with e.g. data migration of a new sanctuary version or simply if you delete accidentally a bunch of your notes or made some accidental edits that you want to undo
- "_quite_" because it is still your responsibility to make sure to back up that magic box directory

## Note editor

![sanctuary note editor screenshot](./docs/readme_media/sanct_note_editor.png)

The note editor supports:
- basic text formatting (with a lil' emoji picker)
- adding images (resizing them and setting their text flow property)
- custom themes (that you write with `css` and see them updated in real-time in sanctuary)

## Why switch to Godot?

I no longer trust in the future Unity licensing decisions. Already locking access to *users' own projects* behind a login screen is a major red flag of their potential intentions and trajectories.

I also firmly believe in the superiority of an open-source software (longevity, safety, transparency, community-orientation) as opposed to the black boxes like Unity Engine. 

This is especially important for a notemaking software where people put their private thoughts.

It was not a decision I made lightly, because Unity *Engine* is a magnificent machine that I came to know very closely over the last 10 years.

But Godot is very meow, I love it, it feels like breathing! The quest begins 🐱🪽🌟

