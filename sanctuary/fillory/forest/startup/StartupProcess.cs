/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using System.Reactive.Disposables;
using System.Reactive.Linq;
using Godot;
using Rzeka;
using Sanctuary.Blood.Startup;
using Sanctuary.Forest.Autoloads;

namespace Sanctuary.Forest.Startup;

public partial class StartupProcess : Node
{
    static IRzeka rzeka => Ursprung.Rzeka;
    CollectibleDisposable Q { get; set; } = new();

    delegate FilloryLoadInfo LoadStep(FilloryLoadInfo prev);

    static IObservable<LoadStep> On<T>(LoadStep step)
        where T : Matter => rzeka.Scry<T>().Take(1).Select(_ => step);

    public override void _Ready()
    {
        // Initial seed
        // This is legale because the loom generating FilloryLoadState below is not yet inside the river.
        rzeka.Pluck(this, new FilloryLoadState(new FilloryLoadInfo()));

        // Reducer – single writer of FilloryLoadState
        // Loadup milestones are
        Q += rzeka.Loom<FilloryLoadState, FilloryLoadState>(
            this,
            state =>
                Observable
                    .Merge(
                        On<StartingSceneLoaded>(prev => prev with { StartingSceneLoaded = true })
                    )
                    .WithLatestFrom(
                        state,
                        (step, currentState) => new FilloryLoadState(step(currentState.LoadInfo))
                    )
        );

        Q += rzeka.Loom<FilloryLoadState, FilloryReady>(
            this,
            state =>
                state.Where(s => s.LoadInfo.IsLoadComplete).Take(1).Select(_ => new FilloryReady())
        );

        Q += rzeka.Weave<FilloryReady>(
            this,
            ready =>
                ready
                    .Take(1)
                    .Subscribe(
                        onNext: _ =>
                        {
                            // self-remove the entire startup node containing this script with all its children
                        },
                        onError: err => rzeka.Whisper(err)
                    )
        );

        Callable.From(BeginLoad).CallDeferred();
    }

    public override void _Process(double delta) { }

    public override void _ExitTree()
    {
        Q.Dispose();
    }

    void BeginLoad() => rzeka.Pluck(this, new StartupProcessReady());
}

/* created at 2026-07-29, Wed, 15:59 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
