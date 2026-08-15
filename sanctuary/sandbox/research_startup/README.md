# startup_research

A minimal, self-contained sketch of a rzeka-driven startup for the Godot port.
Load process = wait for two milestones: **main scene loaded** and **player spawned**.

## The idea

One `[HasState]` snapshot (`FilloryLoadState` / `FilloryLoadInfo`) records how far
startup has progressed. Subsystems publish past-tense milestone matter as they finish.
A **single reducer** folds those milestones into the snapshot. When the snapshot says
`IsLoadComplete`, the orchestrator announces `GameStarted` and disposes itself.

This is the post-refactor shape: the old design had many Looms all writing
`FilloryLoadState`, which the new single-writer rule forbids. Here there is exactly one
writer (the reducer in `StartupProcess`); everything else either publishes a milestone
or reads the state to produce a *different* matter type.

## The flow

```
StartupProcess seeds FilloryLoadState { } and (deferred) Plucks MainSceneLoadRequested
        │
        ▼
SceneLoader  reacts → adds MainSceneRoot → MainSceneRoot._Ready Plucks MainSceneReady
        │
        ▼
reducer folds → FilloryLoadState { MainSceneLoaded = true }
        │
        ▼
PlayerSpawner reacts to MainSceneReady → adds PlayerAvatar → _Ready Plucks PlayerSpawned
        │
        ▼
reducer folds → FilloryLoadState { MainSceneLoaded, PlayerSpawned }  → IsLoadComplete
        │
        ▼
StartupProcess Plucks GameStarted, prints, and tears itself down
```

## Running it

`RiverSource` must be registered as an autoload (it already is in `project.godot`), and
it must initialise before this scene. Then build a scene like:

```
StartupDemo            (Node)
├── SceneLoader        (Node)
├── PlayerSpawner      (Node)
└── StartupProcess     (Node)
```

Set it as the run scene (or F6 on it). Expected output:

```
🌊 Rzeka is operational!
🌟 Startup complete: the game is live.
```

The spawned `MainScene` and `Player` nodes appear under the window root. Sibling order
in the scene does not matter: the first request is deferred one idle frame, so every
subsystem has subscribed before anything fires.

## Assumptions (say the word to change any)

- The main scene is represented by a bare code node instead of a real `PackedScene`,
  and the player by a bare node instead of the `fillory/fairies/player` controller.
  Swapping in the real ones is a one-line change in `SceneLoader` / `PlayerSpawner`.
- No failure handling yet. The natural next step is a `.Timeout(...)` on the reducer
  (or per milestone) that emits a `StartupStalled` matter naming which flags are still
  false, so a missing subsystem surfaces instead of hanging.
- Spawned nodes are parented to the window root for brevity; real code would use a
  dedicated content-holder node.
- This is `Sanctuary.Sandbox.Startup`, exempt from NetArchTest. When it graduates, the
  matter moves to `Sanctuary.Matter`, the reducer becomes a forest, and the loader /
  spawner become whatever the forest-vs-fairy rule dictates.
```
