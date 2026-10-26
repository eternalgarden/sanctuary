/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using System.Reactive.Disposables;
using System.Reactive.Linq;
using System.Reactive.Threading.Tasks;
using System.Threading.Tasks;
using Godot;
using Rzeka;
using Sanctuary.Blood.SceneLoader;
using Sanctuary.Blood.Startup;
using Sanctuary.Forest.Autoloads;
using static Sanctuary.Forest.Startup.StartupHelpers;

namespace Sanctuary.Forest.Startup;

public partial class StartupSceneSpawner : Node
{
    static IRzeka rzeka => Ursprung.Rzeka;
    CollectibleDisposable Q { get; set; } = new();

    // TODO One day replaced by the last scene user was in.
    // Don't use [Export] PackagedScene when you want a lazy load.
    // When the scene containing a node with such export, it will load that resource eagerly.
    [Export(PropertyHint.File, "*.tscn")]
    string StartingScenePath { get; set; }

    // Debug builds only: when set, the game starts in this scene instead. A quick switch for
    // testing a level without touching StartingScenePath; release builds ignore it.
    [Export(PropertyHint.File, "*.tscn")]
    string DebugStartingScenePath { get; set; } = "";

    // TODO One day the entire scene attachment process will have
    // to be moved to its own component like DimensionPlanner which
    // will decide at what coordinates a scene is spawned, because
    // there will be multiple available at once, traversible through
    // protals.
    [Export]
    Node3D WorldRoot { get; set; }

    public override void _EnterTree() { }

    public override void _Ready()
    {
        string scenePath = StartingScene();

        Q += rzeka.Loom<FilloryLoadState, StartupStepReached>(
            this,
            state =>
                state
                    .Where(x => x.LoadInfo.CanSceneSpawn)
                    .Take(1)
                    .SelectMany(y =>
                        rzeka
                            .Ask<LoadSceneRequest, LoadSceneResponse>(
                                this,
                                new LoadSceneRequest(scenePath).WithCircumstances(y)
                            )
                            .SelectMany(res =>
                                res.WasSuccessful && res.PackedScene is not null
                                    ? Observable.FromAsync(() => AttachStartingScene(res))
                                        .Select(_ =>
                                            Cleared(StartupStep.StartingScene, y, res)
                                        )
                                    : Observable.Return(
                                        Failed(
                                            StartupStep.StartingScene,
                                            $"LoadSceneRequest for {scenePath} failed.",
                                            y,
                                            res
                                        )
                                    )
                            )
                            .Catch<StartupStepReached, Exception>(ex =>
                            {
                                rzeka.Whisper(ex, y);
                                return Observable.Return(
                                    Failed(StartupStep.StartingScene, ex.Message, y)
                                );
                            })
                    )
        );
    }

    public override void _Process(double delta) { }

    string StartingScene()
    {
        if (!OS.IsDebugBuild() || string.IsNullOrEmpty(DebugStartingScenePath))
            return StartingScenePath;

        GD.Print($"🎬 Debug starting scene: {DebugStartingScenePath}");
        return DebugStartingScenePath;
    }

    public override void _ExitTree()
    {
        Q.Dispose();
    }

    async Task AttachStartingScene(LoadSceneResponse load)
    {
        if (!load.WasSuccessful || load.PackedScene is null)
            throw new Exception(
                $"Attaching scene failed for scene at path {load.Request.ScenePath}"
            );

        // Instantiate() only allocates the node subtree
        // it doesn't touch the live tree.
        Node scene = load.PackedScene.Instantiate();

        WorldRoot.CallDeferred(Node.MethodName.AddChild, scene);

        await scene.ToSignal(scene, Node.SignalName.Ready);
    }
}

/* created at 2026-07-30, Thu, 11:09 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
