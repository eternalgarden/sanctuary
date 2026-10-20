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
using Sanctuary.Blood.Player;
using Sanctuary.Blood.Startup;
using Sanctuary.Forest.Autoloads;
using static Sanctuary.Forest.Startup.StartupHelpers;

namespace Sanctuary.Forest.Startup;

public partial class StartupPlayerSpawner : Node
{
    static IRzeka rzeka => Ursprung.Rzeka;
    CollectibleDisposable Q { get; set; } = new();

    [Export]
    public Vector3 PlayerStartingPosition;

    public override void _EnterTree() { }

    public override void _Ready()
    {
        // One day this will also loom in the requested strting location
        // Potentially from save data of the last location
        // Or a default spawn location for a given scene
        Q += rzeka.Loom<FilloryLoadState, StartupStepReached>(
            this,
            state =>
                state
                    .Where(x => x.LoadInfo.CanPlayerSpawn)
                    .Take(1)
                    .SelectMany(x =>
                        rzeka
                            .Ask<PlayerLoadRequest, PlayerLoadResponse>(
                                this,
                                new PlayerLoadRequest().WithCircumstances(x)
                            )
                            // TODO: move to a player positioning shuttle
                            // TODO: add the capacity to process display to display failures in startup
                            // Question: how would we avoid further playermovereques if we failed on this step
                            // because the player move request will be a following ask below the above?
                            // TODO: this leads to a deeper question on how to handle responses with false
                            // was successful, how to prevent the further chain operations? simply .Where?
                            // with side effects inside that would Pluck a related Failure info?
                            // or a side effect with a plain Whisper?
                            .Perform(response =>
                            {
                                if (response.WasSuccessful && response.Player is not null)
                                {
                                    response.Player.Position = PlayerStartingPosition;
                                    return Cleared(StartupStep.UserControllerLoad, x, response);
                                }

                                return Failed(
                                    StartupStep.UserControllerLoad,
                                    "PlayedLoadRequest failed.",
                                    x,
                                    response
                                );
                            })
                    )
        );
    }

    public override void _Process(double delta) { }

    public override void _ExitTree()
    {
        Q.Dispose();
    }
}

/* created at 2026-08-25, Tue, 13:33 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
