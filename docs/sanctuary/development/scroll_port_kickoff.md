# Scroll port: kickoff

> Handoff for starting the scroll port in a fresh conversation. Paste the prompt below, then
> work through the plan. Written 2026-10-27, at the end of the input-system session.

## Prompt

```
We're starting the port of Source's scrolls into Neo. Read
docs/sanctuary/development/scroll_port_kickoff.md first. It holds the decisions already
made, the current state of Neo and the plan. Then read CLAUDE.md, the Rzeka primer, and
docs/sanctuary/project/project_structure.md before proposing anything.

First task: map Source's scroll states and their matter for step 1 of the plan (one scroll,
out of the sandbox, focusable and editable). Propose the scroll state matter and decide,
module by module, what is a forest and what is a fairy under Neo's rules. Write it up as a
design note like docs/sanctuary/development/input_module.md before writing code.
```

## Working agreements

- **The user runs builds, exports and the game.** Hand over commands. Read-only inspection is
  fine; when unsure whether a file edit is wanted, propose it.
- **Paths:** CLAUDE.md's `/home/merryangel/...` paths are stale. Source lives at
  `/home/merry/sanctuary/sanctuary-legacy/sanctuary` (scripts under `Assets/Fillory/scripts/`).
  The Rzeka wiki is at `/home/merry/sanctuary/rzeka.wiki`, the library at
  `/home/merry/sanctuary/rzeka`.
- **New `.cs` files** carry the kitty header and the timestamp footer (see CLAUDE.md).
- **Design first:** each module gets a short design note, settled with the user, before code.
  Notes are working documents and won't stay in the project docs long term.

## Decisions already made (apply to the scrolls)

### Layering

- **common:** references no fillory layer. Godot, Rx, Rzeka and
  Microsoft.Extensions.DependencyInjection are fine. Generic helpers that speak Rzeka go here
  (e.g. `common/reactive/RzekaLease.cs`).
- **blood:** matter plus the plain data it carries and pure reducers. No helpers that act on the
  river.
- **forest:** talks only through the river; never references another forest.
- **fairies:** only for a synchronously queried interface that justifies bypassing the river.
  Sharing a helper or a command API is *not* a reason to be a fairy: commands travel as matter,
  shared Rzeka code goes to common. Source's scroll code is mostly fairies (`ScrollEditorFairy`,
  `ScrollThemeFairy`, `FullscreenViewerFairy`, `NoteDataFairy`, `GitFairy`, `FileBrowserFairy`).
  Expect most to become forests.
- **Namespace trap:** a folder/namespace named like a Godot class (e.g. `Sanctuary.Forest.Input`)
  shadows `Godot.Input` in every `Sanctuary.Forest.*` file. Pick names that don't collide.

### Rzeka idioms in use

- `[HasState]` matter has one writer and replays its latest value. Seed it with a `Pluck`
  **before** the reducer `Loom` registers (see `InputArbiter`, `StartupProcess`).
- State reducers: `Observable.Merge` of `Scry` triggers plus `WithLatestFrom(state)`. Stamp each
  output with its trigger only (`.WithCircumstances(trigger)`). Automatic stamping would chain
  every previous state and keep the session's history alive.
- `WithCircumstances` ignores nulls and returns the matter untouched when nothing remains
  (Rzeka 1.2.1). Plucking into a disposed river is a no-op (1.2.2).
- **Leases:** `Q += rzeka.Lease(this, request, () => released, because)` returns an
  `IDisposable`. Pass a cause only when matter caused the request or release.

### Input (done, `forest/input_arbiter`)

- Modes: `Disabled`, `Freewalk`, `Scrolls`, `UI`. Priority runs UI > Scrolls > Freewalk >
  Disabled. Components lease a mode with `InputModeRequested` / `InputModeReleased`.
  `InputArbiter` publishes `InputModeState`; `CursorKeeper` is the only writer of
  `Input.MouseMode` (Scrolls and UI → Visible, everything else → Captured).
- Components read Godot `Input` themselves and gate on a cached `_mode` from a Weave on
  `InputModeState`. No input travels on the river; components publish domain matter instead.
- **Handled rule:** a listener that acts on an event calls `GetViewport().SetInputAsHandled()`.
  A lease change lands synchronously, so without it the next listener sees the new mode and
  acts on the same key press.
- **Scroll input (input step 5, owed by the scrolls):** a focused scroll takes a Scrolls lease
  and gates `ScrollInputForwarder.Forward` on the mode. It handles Escape itself in `_Input`:
  Escape is not forwarded to CEF, the scroll plucks `ScrollEditingEnded`, releases its lease
  stamped with it, and marks the event handled. Pages never see Escape; that's accepted.
  A later option is to let the TipTap page decide via gdcef IPC (`scroll:leave`), with
  Shift+Escape as a fallback. It depends on an unverified IPC route.
- `DebugQuitter` (`forest/debug`) quits on Escape in Freewalk only, in `_UnhandledInput`, so a
  scroll handling Escape first wins.

### Startup and scenes

- `StartupProcess` runs the steps through `FilloryLoadState`; `FilloryReady` (plain matter, not
  state) fires once when every step is cleared. The player takes its Freewalk lease on it.
- Loading notes and spawning their scrolls fits as **a new startup step**.
- `StartupSceneSpawner` has `StartingScenePath` plus `DebugStartingScenePath` (debug builds
  only). `PlayerSpawnPoint` (a `Marker3D` in group `player_spawn`) places the player. The player
  spawner falls back to `PlayerStartingPosition` when a scene has none.
- Godot order: `_EnterTree` runs top-down before any `_Ready`; `_ExitTree` runs children first,
  later siblings first, so the Ursprung autoload exits last.

### Dependency injection

- The layer lives in `fillory/common/injection` (`Sanctuary.Common.Injection`): `Installer`,
  `Scope`, `SceneFactory<TFacade>` with `Spawned<T>`, `SceneLifetime`, `IInitializable`,
  `AddInterfaces` / `AddSelfAndInterfaces` / `AddInitializable` / `Import`.
- A runnable demo, spawning scrolls each with their own scope, stays in
  `sandbox/research_injection/demo`.
- Porting primer: `docs/sanctuary/development/zenject_migration.md`. The reasoning is in
  `sandbox/research_injection/neo_di_notes.md`.
- Spawned scrolls will likely each be an `Installer` scene built by a `SceneFactory`, with the
  note id as a per-instance registration. The demo already does exactly this.

### Other settled things

- Image picking (not ported yet): use `DisplayServer.FileDialogShow` (portal), not Source's
  crashing libFileBrowser. This replaces `FileBrowserFairy` / `FileBrowserProProxy`.
- Web export is out (gdcef is native).

## Current state of Neo's scroll code

- `fillory/forest/scroll/gdcef_bridge/`: `PlaneMeshGdcef`, `ScrollInputForwarder`,
  `ScrollDisplaySettings`. `game/scroll_plane/` holds the plane mesh and material.
- `sandbox/research_gdcef/`: `CameraPositioningSandbox`, `plane_gdcef.tscn`. This is the
  focus/camera research that step 1 graduates.
- The TipTap page UI lives in `ui/`; its build output goes to `src/moon/browser/dist/`.

## Plan

1. **One scroll, out of the sandbox.** It spawns at a fixed spot and can be focused and edited:
   a Scrolls lease, Escape leaves edit mode, `ScrollEditingEnded` gets plucked. This closes
   input step 5 and settles the scroll state matter.
2. **Note data.** Decide the on-disk shape: a note file plus where its scroll sits. Save on
   `ScrollEditingEnded`; load as a startup step that spawns the scrolls. Then the full loop
   works: place, write, quit, relaunch, it's there.
3. **The remaining scroll features, one at a time:** spawning new scrolls, replanting (moving a
   placed scroll), fading, activation grouping (`ScrollAngel`), the fullscreen viewer, themes
   (last; large and cosmetic).
4. **Git tracking** of the notes directory, once the file layout has settled.

Steps 1 and 2 are best designed together. Source ties scroll state to persistence:
`ScrollData` is exactly what the saver writes and the loader reads back.

## Source map

Under `Assets/Fillory/scripts/`. Line counts give a sense of size.

**`components/scrolls/`**
- `internal/core/`: `Scroll.cs` (388), `ScrollMonoInstaller.cs` (136), `ScrollPlayerDetector.cs` (66)
- `internal/noteEditor/`: `ScrollEditorFairy.cs` (132), `ScrollEditorPositioner.cs` (67), installer
- `internal/scrollAngel/`: `ScrollActivationGrouper.cs` (296), `ScrollAngel.cs` (86)
- `internal/spawner/`: `ScrollSpawner.cs` (184), `ScrollSpawnerMono.cs`, installer
- `internal/fullscreenViewer/`: `FullscreenViewerFairy.cs` (155)
- `internal/scrollThemes/`: `ScrollThemeFairy.cs` (844), `ScrollThemeDatabase.cs` (184)
- `public/structures/ScrollData.cs`: `ScrollIdentity`, `NoteGuid`, `Position`, `Forward`,
  `Right`, `Up`, `Rotation`, `CenterOffset`, `WorldTransformedVertices`
- `public/matter/`:
  - editing: `CurrentlyEditedScrollState`, `ScrollEditingStarted`, `ScrollEditingEnded`
  - editor: `ScrollEditorToggleState`, `NoteEditorInputFocusChange`, `ScrollEditorReady`,
    `ScrollEditorPositionsRequestResponse`, many `ButtonPressed_ScrollEditor_*`, `SetNoteThemeRR`
  - fading: `ScrollFading`, `ScrollUnfading`
  - fullscreenViewer: `FullscreenViewerState`
  - positioning: `ScrollReplantingEvoked`, `ScrollReplantingCompleted`, `ScrollReplantingCancelled`
  - spawning: `NewScrollSpawnRequest`/`Response`, `SpawnScrollRR`, `SpawnScrollCollectionRR`,
    `ScrollSpawnerReady`
  - themes: `LoadedCustomScrollThemesState`, `DuplicateScrollThemeRR`,
    `ReloadedLoadedCustomScrollTheme`, `OpenThemeFolderCommand`

**`core/data-persistent/internal/`**
- `fairies/`: `NoteDataFairy.cs` (90), `GitFairy.cs` (368), `FirstRunInvestigator.cs` (57)
- `persistent-data/`: `DataLocator.cs` (273), `FileManager.cs` (128),
  `note-data/NoteDataLoader.cs` (545), `note-data/NoteDataSaver.cs` (231),
  `note-parsers/NoteDataParser.cs` (42)
- `fileBrowser/`: replaced by the portal file dialog (see above)

**Elsewhere:** `core/player/public/matter/ScrollsCameraOrthoSizeState.cs`, and Source's input
handler counters (`core/input/`), already superseded by Neo's input module.
