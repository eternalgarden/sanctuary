/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using System.Reactive.Linq;
using Godot;
using Rzeka;
using Sanctuary.Forest.Autoloads;

namespace Sanctuary.Sandbox.Startup;

/// <summary>
/// The startup orchestrator. It owns the ONE reducer that writes FilloryLoadState,
/// kicks the load chain off, and tears itself down once the game is live.
/// It references no subsystem directly; everything flows through the river.
/// </summary>
public partial class StartupProcess : Node
{
    // A milestone advances the load-info one step forward.
    private delegate FilloryLoadInfo LoadStep(FilloryLoadInfo prev);

    // Collects every spell's IDisposable. rzeka's helper; use += , dispose to unregister.
    private CollectibleDisposable Q { get; set; } = new();

    // Godot calls _Ready after this node and its children have entered the tree.
    public override void _Ready()
    {
        var rzeka = Ursprung.Rzeka;

        // The first time a T flows through the river, emit its state step. Take(1)
        // makes each milestone a one-shot latch. Scry is raw, ownerless stream access.
        IObservable<LoadStep> On<T>(LoadStep step) where T : IMatter =>
            rzeka.Scry<T>().Take(1).Select(_ => step);

        // 1) Seed the state. A Pluck may seed a [HasState] value BEFORE its long-lived
        //    writer exists; registering a second *active* writer would throw. So this
        //    one-shot seed must come before the reducer Loom below.
        rzeka.Pluck(this, new FilloryLoadState(new FilloryLoadInfo()));

        // 2) THE reducer: the single writer of FilloryLoadState. Milestones are Scry'd,
        //    merged, and folded onto the LATEST state via WithLatestFrom. Using
        //    CombineLatest here instead would feed our own output back in as a trigger
        //    and self-loop to a stack overflow.
        Q += rzeka.Loom<FilloryLoadState, FilloryLoadState>(this, state =>
            Observable.Merge(
                    On<MainSceneReady>(prev => prev with { MainSceneLoaded = true }),
                    On<PlayerSpawned>(prev => prev with { PlayerSpawned = true }))
                .WithLatestFrom(state, (step, current) =>
                    new FilloryLoadState(step(current.LoadInfo))));

        // 3) When both milestones are in, announce the game and self-dispose.
        Q += rzeka.Weave<FilloryLoadState>(this, s => s
            .Where(x => x.LoadInfo.IsLoadComplete)
            .Take(1)
            .Subscribe(
                onNext: _ =>
                {
                    rzeka.Pluck(this, new GameStarted());
                    GD.Print("🌟 Startup complete: the game is live.");
                    // Don't dispose Q from inside a spell that lives in Q. Defer it.
                    Callable.From(TearDown).CallDeferred();
                },
                onError: err => rzeka.Whisper(err)));

        // 4) Kick the chain off, but one idle frame later. Godot runs _Ready
        //    children-first, yet sibling order is not something to depend on; deferring
        //    guarantees every subsystem has subscribed before the first request fires.
        //    This is the Godot equivalent of the old "we want it late" execution order.
        Callable.From(BeginLoad).CallDeferred();
    }

    private void BeginLoad() =>
        Ursprung.Rzeka.Pluck(this, new MainSceneLoadRequested());

    private void TearDown() => Q.Dispose();

    // Godot calls _ExitTree when the node leaves the tree; release anything still live.
    public override void _ExitTree() => Q.Dispose();
}

/* created at 2026-07-28, Tue, 00:33 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
