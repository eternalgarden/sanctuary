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

    // Keeping this as a reminder to the previous implementation which was very elegant and schick
    // but was not allowing us to track step failures and would require a considerable amount of
    // boilerplate across at least three different files which coould be easily overlooked and leading
    // to a waste of debugging time. It was also breaking the casuality graph,
    //
    // delegate FilloryLoadInfo LoadStep(FilloryLoadInfo prev);
    //
    // static IObservable<LoadStep> On<T>(LoadStep step)
    //     where T : Matter => rzeka.Scry<T>().Take(1).Select(_ => step);
    //
    // Q += rzeka.Loom<FilloryLoadState, FilloryLoadState>(
    //     this,
    //     state =>5zh
    //         Observable
    //             .Merge(
    //                 On<StartupSceneLoaded>(prev => prev with { StartupSceneLoaded = true }),
    //                 On<PlayerLoaded>(prev => prev with { PlayerLoaded = true })
    //             )
    //             .WithLatestFrom(
    //                 state,
    //                 (step, currentState) => new FilloryLoadState(step(currentState.LoadInfo))
    //             )
    // );
    // But casuality graph could have been fixed with this
    // static IObservable<(T trigger, LoadStep step)> On<T>(LoadStep step)
    //     where T : Matter => rzeka.Scry<T>().Take(1).Select(trigger => (trigger, step));

    public override void _Ready()
    {
        // Initial seed
        // Beware, this is load-bearing in this position!
        // Initial seed has to be emitted before the reducer loom before registers.
        // It is to ensure no StartupStepReached vanishes unnoticed.
        rzeka.Pluck(this, new FilloryLoadState(new FilloryLoadInfo()));

        // Reducer – single writer of FilloryLoadState
        // 🐖 neat!
        Q += rzeka.Loom<FilloryLoadState, StartupStepReached, FilloryLoadState>(
            this,
            (state, step) =>
                step.Distinct(x => x.StartupStep)
                    .WithLatestFromMatter(state)
                    .Select(pair => (loadInfo: pair.Item2.LoadInfo, stepStatus: pair.Item1))
                    .Select(x => new FilloryLoadState(
                        x.loadInfo.WithStep(
                            x.stepStatus.StartupStep,
                            x.stepStatus.WasSuccessful ? StepState.Cleared : StepState.Failed,
                            x.stepStatus.Reason
                        )
                    ))
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
