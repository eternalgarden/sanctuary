%%%%# Input module: design note

> Design for Neo's input module, a rework of Source's `core/input`. It covers which part of
> the game owns input at any moment, and the cursor. It deliberately does *not* centralise
> what keys mean: each component listens for its own input.
> Nothing here is implemented yet. Every design question is settled (see *Decided*). Write the
> code to match this note, or update the note.
>
> Source reference: `sanctuary-legacy/sanctuary/Assets/Fillory/scripts/core/input/`.

## The problem

Several parts of the game want the keyboard and mouse, and only one of them should have them
at a time: walking around, a focused scroll (CEF browser), and later the console, UI overlays,
cutscenes and the planter. Neo currently has no arbiter. Each part decides for itself:

| Where | What it does on its own |
|---|---|
| `fairies/player/.../core/Player.cs` | Captures the mouse in `_Ready`. Treats "mouse is captured" as "I have control". Polls `Input` every physics frame |
| `fairies/player/.../Level.cs` | Quits on `ui_cancel` in debug builds. Re-captures the mouse on any unhandled left click |
| `common/utility/EscapeGameQuitter.cs` | Quits on Escape |
| `forest/scroll/gdcef_bridge/ScrollInputForwarder.cs` | Forwards events to CEF. Only the `research_gdcef` sandbox calls it today |

This holds up with one mode. With two, they already disagree: a left click on a focused scroll
also re-captures the mouse, and Escape is claimed three times over.

## What Source did, and what we keep

Source used a **request/relinquish arbiter with fixed priority**. Any component published
`RequestInputHandlerType(mode)` and later `RelinquishRequestedInputHandlerType(mode)`.
`InputHandler` counted the open requests per mode, picked the highest-priority mode with at
least one request, and published `[HasState] InputHandlerTypeState`. Each mode was a class
(`FreewalkBaseInputActions`, `ScrollsInputActions`, …) that switched its Unity action map on in
`Begin()` and off in `End()`, and turned raw callbacks into `InputActionEvoked(action)`.
`MouseManager` mapped the mode to a `CursorState` and applied it.

**Keep:**

- **Decoupled requests.** A requester names the mode it needs and knows nothing about other
  requesters. Priority settles conflicts. This is the forest rule applied to input.
- **One priority list as the whole policy**, readable in one place.
- **The result is `[HasState]` matter**, so a component that subscribes late still sees the
  current mode immediately.
- **The cursor follows from the mode.** No requester touches the cursor directly.

**Drop:** the central translation from raw input to `InputActionEvoked(action)`. Unity's Input
System forced that shape: action maps had to be enabled and disabled as a whole, so one place
owned them and re-broadcast them. Godot's InputMap is global, and any node can check an action
itself. In Neo every component owns its listeners and obeys the current mode. What a key does
is published as **domain matter** (`ScrollEditingEnded`), not as "Escape was pressed".

**Change:**

| Source | Problem | Neo |
|---|---|---|
| Two Looms (request, relinquish) both write `InputHandlerTypeState` | Neo's Rzeka throws on a second writer of a `[HasState]` type | One reducer Loom: `Merge` of `Scry` triggers + `WithLatestFrom(state)` (wiki: *Attributes → Multiple transitions*) |
| `Loom<State, Request, State>` with `DistinctUntilChanged(x => x.Two.Guid)` | Looks like a workaround for the Loom re-firing on its own state emission | Goes away with the reducer above |
| Per-mode `int` counters in `InputStateCounter`, an 8-case switch each way | A missed relinquish leaves a mode stuck forever. A duplicate one silently cancels someone else's claim | **Leases**: each request has its own id, the state holds the set of live leases, and releasing is idempotent |
| Relinquish is a separate, manual pluck | Easy to forget, especially when a node is freed | A lease is an `IDisposable`, so it goes into `Q` |
| `[Flags]` on `InputHandlerType` | Never combined (except `DisabledOrFreewalk`, unused) | A plain enum. Priority is an explicit ordered list, not the enum's values |
| Eight `*InputActions` classes wrapping Unity's generated action asset, re-broadcasting as `InputActionEvoked` | Godot's InputMap already provides named actions, readable from any node | No translation layer. Components read InputMap actions themselves, gated on the mode. The mode table holds only priority and cursor |
| `PointerDeltaChanged` (`[HighVelocity]`) puts mouse look on the river | Per-frame traffic on the bus | Per-frame input stays off the river (see *Per-frame input* below) |
| `MouseManager` as its own MonoBehaviour, `FocusHandler` an empty stub | The stub hints at a real need: window focus loss | Cursor application lives in the input forest (`CursorKeeper`). Focus regain is left to Godot until testing says otherwise |

## Shape

```
requesters (any forest)                input forest                         consumers
───────────────────────                ────────────                         ─────────
Rzeka.Lease(...)     ──InputModeRequested──►┐
lease.Dispose()      ──InputModeReleased───►┘ reducer Loom ──► [HasState] InputModeState ──► Player (caches field)
                                                                      │                  ──► Scroll (caches field)
                                                                      └──► cursor Weave (sets Input.MouseMode)

Godot input events ──► each component's own _Input / _UnhandledInput / Input.* polling,
                       gated by its cached mode ──► domain matter (ScrollEditingEnded, …)
```

The input forest is small. It holds the arbiter, the priority list and the cursor. It never
sees a key press.

### Layering

The arbiter is a **forest** (`fillory/forest/input_arbiter`, `Sanctuary.Forest.InputArbiter`),
not a fairy. It's not named `Sanctuary.Forest.Input`, because that namespace would hide Godot's
`Input` class from every file under `Sanctuary.Forest`.
Nothing needs to *query* it. Consumers subscribe to `InputModeState` and keep the last value in
a field. The primer's rule is *"read state synchronously → mark the matter `[HasState]`"*, and
`[HasState]` replays the latest value to each new subscriber, so the cached field is valid as
soon as the subscription is made.

There is no frame of lag either. Rzeka is single-threaded and a pluck lands synchronously, so
lease → reducer → state → consumer Weave all complete in the same call stack.

A fairy (`IInputModeFairy`) would be justified only if something needed the mode without being
able to subscribe, such as a stateless helper with no lifecycle. Nothing like that exists.

Requesters never reference the input forest either. They pluck blood matter through the
generic lease helper in `common` (see *Leases*). Delete the input forest and every requester
still compiles. Their leases go unheard, but nothing breaks.

### Matter (blood, `Sanctuary.Blood.Input`)

```csharp
public enum InputMode { Disabled, Freewalk, Scrolls, UI }   // grows as features port

public class InputModeRequested : Matter
{
    public Guid LeaseId { get; } = Guid.NewGuid();
    public InputMode Mode { get; }

    public InputModeRequested(InputMode mode) => Mode = mode;
}

public class InputModeReleased : Matter
{
    public Guid LeaseId { get; }

    public InputModeReleased(Guid leaseId) => LeaseId = leaseId;
}

[HasState]
public class InputModeState : Matter
{
    public InputMode Current { get; }
    public InputMode Previous { get; }
    public ImmutableDictionary<Guid, InputMode> Leases { get; }
    // Plain data. Picking Current from Leases by priority is policy, so the input forest does it.
}
```

There is no input-action matter. A component that reacts to a key publishes what that *means*
in its own domain.

Only add a mode when the feature that needs it ports. Source's full list, for reference, in
priority order: Console > UI > Cutscene > Scrolls > NoSpells > Planter > Freewalk > Disabled.

### Leases

The lease is a **generic helper in `common`** (`fillory/common/reactive/RzekaLease.cs`,
`Sanctuary.Common.Reactive`). It knows nothing about input. It plucks a "requested" matter now
and a "released" matter on release, and the caller supplies both. It can't live in the input
forest, because forests can't reference each other. It isn't matter, so it doesn't belong in
blood. It isn't a bypass of the river, so it isn't a fairy. `project_structure.md` records the
rule: common may reference Rzeka the library, never a Neo layer.

```csharp
public static RzekaLease<TReleased> Lease<TRequested, TReleased>(
    this IRzeka rzeka, object who,
    TRequested requested, Func<TReleased> released,
    params IMatter[] because)
    where TRequested : Matter where TReleased : Matter
{
    rzeka.Pluck(who, requested.WithCircumstances(because));
    return new RzekaLease<TReleased>(rzeka, who, released);
}

public sealed class RzekaLease<TReleased> : IDisposable where TReleased : Matter
{
    // ctor stores rzeka, who, released
    bool _released;

    public void Release(params IMatter[] because)
    {
        if (_released) return;
        _released = true;
        _rzeka.Pluck(_who, _makeReleased().WithCircumstances(because));
    }

    public void Dispose() => Release();
}
```

No guard is needed around `because`. Since the Rzeka change listed in `CHANGELOG.md` under
*Unreleased*, `WithCircumstances` skips `null`s and returns the matter untouched when nothing
is left to stamp. An empty `because`, or a `null` optional cause, can't crash and can't wipe a
stamp the caller already put on `requested`.

The lease id belongs to the matter (`InputModeRequested` generates its own `LeaseId`), so the
helper stays domain-free.

**Causality.** Pluck never stamps circumstances by itself, so the helper takes the cause from
the caller:

- **Stamp it when matter caused the request or release.** For example, a lease taken in a Weave
  on `ScrollOpened` passes that matter. The arbiter's Loom then stamps the request onto the new
  state automatically, so Eris shows `ScrollOpened → InputModeRequested → InputModeState`.
- **Leave it unstamped when nothing in the river caused it**, such as a lease taken in `_Ready`
  or released because `Q` was disposed when the node was freed. That is a genuine root emission,
  the same reasoning the wiki gives for `Strand`.
- **Never stamp the request onto its own release.** The request didn't cause the release, and
  the arbiter already pairs the two by `LeaseId`.

```csharp
// lifetime-bound: no cause
var walk = new InputModeRequested(InputMode.Freewalk);
Q += Rzeka.Lease(this, walk, () => new InputModeReleased(walk.LeaseId));

// event-bound: cause in scope, so stamp it
Q += Rzeka.Weave<ScrollOpened>(this, Observer.Create<ScrollOpened>(opened =>
{
    var read = new InputModeRequested(InputMode.Scrolls);
    _lease = Rzeka.Lease(this, read, () => new InputModeReleased(read.LeaseId), opened);
}));

Q += Rzeka.Weave<ScrollClosed>(this, Observer.Create<ScrollClosed>(closed =>
    _lease?.Release(closed)));
```

### The arbiter

```csharp
Rzeka.Pluck(this, InputModeState.Initial);   // Disabled, no leases

Q += Rzeka.Loom<InputModeState, InputModeState>(this, state => Observable.Merge(
    Rzeka.Scry<InputModeRequested>()
        .WithLatestFrom(state, (e, s) => Next(s, s.Leases.SetItem(e.LeaseId, e.Mode))),
    Rzeka.Scry<InputModeReleased>()
        .WithLatestFrom(state, (e, s) => Next(s, s.Leases.Remove(e.LeaseId)))));

// Next: Current = the highest-priority mode among the leases (Disabled if none),
// Previous = s.Current.
```

Releasing an unknown id returns the state unchanged. Every change to the lease set emits, even
when `Current` stays the same. That keeps the state honest and shows every lease in Eris.
Consumers that care only about the mode add `DistinctUntilChanged(s => s.Current)` themselves.

### The mode table

The input forest's whole policy is priority (the order below) and the cursor:

| Mode | Cursor | Who acts on input (their own listeners) |
|---|---|---|
| UI | visible, free | the UI (Godot `Control` / CEF) |
| Scrolls | visible, free | Scroll (forwards to CEF, Escape leaves edit mode) |
| Freewalk | hidden, captured | Player (movement, look); debug fast-quit |
| Disabled | hidden, captured | nobody |

Which keys a component reacts to in which mode is that component's business, not the table's.

### Component input listeners

Components read input themselves: per-frame polling (`Input.GetVector`, held buttons) and
edge events (`_Input`, `_UnhandledInput`) alike. None of it goes through the river. Godot's
`Input` singleton and InputMap are already synchronous global services, so a fairy wrapping
them would only forward the same calls. The input forest decides *who* acts on input. It never
relays or interprets it.

```csharp
InputMode _mode = InputMode.Disabled;

public override void _Ready()
    => Q += Rzeka.Weave<InputModeState>(this,
           Observer.Create<InputModeState>(s => _mode = s.Current));

public override void _PhysicsProcess(double delta)
{
    if (_mode != InputMode.Freewalk) { Move((float)delta); return; }
    Vector2 axis = Input.GetVector(...);
    // ...
}

public override void _Input(InputEvent e)
{
    if (_mode == InputMode.Freewalk && e is InputEventMouseMotion m) RotateHead(m.Relative);
}
```

**Rule: a listener that acts on an event marks it handled** with
`GetViewport().SetInputAsHandled()`. A lease change lands synchronously, so the mode can change
*during* one event's dispatch. Without the rule, the next listener in line sees the new mode
and acts on the same key press. Example: Escape leaves the scroll, the mode becomes Freewalk,
and the debug fast-quit in `Level.cs` then sees Escape in Freewalk and quits the game.

**Escape in a focused scroll.** The scroll handles it itself. The forwarder doesn't pass Escape
to CEF. Instead the scroll ends edit mode: it releases its Scrolls lease, publishes
`ScrollEditingEnded`, and marks the event handled.

```csharp
public override void _Input(InputEvent e)
{
    if (_mode != InputMode.Scrolls) return;

    if (e.IsActionPressed("ui_cancel"))
    {
        var ended = new ScrollEditingEnded();
        Rzeka.Pluck(this, ended);
        _lease?.Release(ended);
        GetViewport().SetInputAsHandled();
        return;
    }

    _forwarder.Forward(e);
}
```

The cost: web pages inside a scroll never see Escape, so it can't close a page's own dropdowns
or cancel an IME composition. That's acceptable. Escape belongs to the shell.

*Later, if it ever matters:* the scroll pages are first-party (the TipTap UI in `ui/`), so the
page could decide instead. Godot forwards Escape. The page closes whatever it has open, and
otherwise sends `window.sendIpcMessage('scroll:leave')` when the key arrives with
`!e.defaultPrevented`. Shift+Escape stays handled by Godot as a fallback for cross-origin
iframes and hung pages. This depends on gdcef's IPC route, which is still unverified.

### Cursor

`CursorKeeper`, a Weave on `InputModeState`, sets `Input.MouseMode` from the table. It is the
**only** writer of `Input.MouseMode` in the project.

Focus loss: Godot keeps `MouseMode` as `Captured` while the window is unfocused, and its
desktop display servers are expected to re-grab the pointer on focus-in. Writing the same mode
again would be a no-op anyway, so `CursorKeeper` doesn't handle focus. Verify by alt-tabbing out
of Freewalk and back. Add a handler only if the pointer comes back free. Source's empty
`FocusHandler` stub was probably meant for this.

## Migration

1. The generic lease in `common/reactive/RzekaLease.cs`, matter in `blood/input`, forest in
   `fillory/forest/input_arbiter` (`InputArbiter`, `CursorKeeper`). Put the forest node in
   `Fillory.tscn` **above** `startup`, so it is ready before anything requests a lease (see
   `docs/sanctuary/project/processes/startup.md`).
2. `Player.cs`: remove the `Input.MouseMode` write and the "captured means valid" check. Gate on
   the cached `_mode` instead. Take the Freewalk lease in a Weave on `FilloryReady`, stamped
   with it.
3. The debug fast quit moves to `forest/debug/DebugQuitter.cs`: debug builds only, gated on
   `_mode == Freewalk`, in `_UnhandledInput` so anyone who handled Escape first wins. It
   replaces `EscapeGameQuitter` on the `Fillory.tscn` root. `Level.cs` (click-to-capture, an
   ungated quit) only lives in `TemporaryMainLevel.tscn`, which nothing loads; delete both.
4. Delete `EscapeGameQuitter` once nothing uses it. The sandbox scene and the unreferenced
   `main_level_scene.tscn` still do, and the sandbox has no arbiter, so an ungated quitter is
   right there.
5. The scroll focus work, when it leaves the sandbox, takes a Scrolls lease, gates `Forward` on
   the mode, and handles Escape itself (see *Component input listeners*).

## Decided

- **Where the lease helper lives: `common`, as a generic helper.** We considered three options.
  Widening blood to "matter and its vocabulary" would put behaviour into a data layer. Widening
  fairy to cover public helpers would spend the bypass exception on code that never bypasses
  the river. Allowing `common` to reference external libraries (Rx, Godot, Rzeka) but no Neo
  layer changes one sentence and leaves every layer's meaning intact.
- **No central input translation.** Components own their listeners and gate on the mode. Unity's
  action maps forced Source's centralisation, and Godot doesn't need it. Consequences:
  `InputActionEvoked` and its enum are gone, components publish domain matter, and the
  "mark it handled" rule matters (see *Component input listeners*).
- **Freewalk starts on `FilloryReady`**, so the player can't move during the remaining startup
  steps. This may change as startup grows. It's one Weave in the player, so moving it is cheap.
- **Every change to the lease set emits**, even when `Current` stays the same.
- **Escape in a focused scroll is never forwarded to CEF.** The scroll consumes it to leave edit
  mode.
- **Web export is out.** `Level.cs`'s click-to-capture came from the character controller
  template, written for browser builds, where pointer lock is only granted on a click. Neo can't
  export to the web anyway: gdcef is a native GDExtension with a full Chromium, which the web
  platform can't load.

- **Releasing during shutdown is safe.** Godot runs `_ExitTree` children-first, and later
  siblings before earlier ones. Autoloads are added to the root before the main scene, so
  `Ursprung` exits *after* everything in the game, and leases released on quit still find a
  live river. **Confirmed on 2026-10-25:** quitting with Escape logged `SceneLoader exiting` before
  `Ursprung exiting`. The editor's Output panel stops capturing before tree teardown, so check
  shutdown prints in `user://logs/godot.log`
  (`~/.local/share/godot/app_userdata/sanctuary/logs/` on Linux), not in the editor.

  The fallback is in place either way. Rzeka now drops a `Pluck` on a disposed river quietly
  (`CHANGELOG.md`, *Unreleased*). Before that, a late pluck was still delivered to leftover
  subscribers, because river disposal is shallow. Neo picks this up with the next Rzeka release.
