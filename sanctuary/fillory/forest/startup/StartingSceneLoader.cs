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

namespace Sanctuary.Forest.Startup;

public partial class StartingSceneLoader : Node
{
    static IRzeka rzeka => Ursprung.Rzeka;
    CollectibleDisposable Q { get; set; } = new();

    // TODO One day replaced by the last scene user was in.
    // Don't use [Export] PackagedScene when you want a lazy load.
    // When the scene containing a node with such export, it will load that resource eagerly.
    [Export(PropertyHint.File, "*.tscn")]
    string StartingScenePath { get; set; }

    [Export]
    Node3D WorldRoot { get; set; }

    public override void _EnterTree() { }

    public override void _Ready()
    {
        Q += rzeka.Loom<StartupProcessReady, StartingSceneLoaded>(
            this,
            spell =>
                spell
                    .Take(1)
                    .SelectMany(started =>
                        rzeka
                            .Ask<LoadSceneRequest, LoadSceneResponse>(
                                this,
                                new LoadSceneRequest(StartingScenePath).WithCircumstances(started)
                            )
                            .SelectMany(
                                res => AttachStartingScene(res).ToObservable(),
                                (res, _) => new StartingSceneLoaded()
                            )
                    )
        );
    }

    public override void _Process(double delta) { }

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

        Node scene = load.PackedScene.Instantiate();

        WorldRoot.CallDeferred(Node.MethodName.AddChild, scene);

        await scene.ToSignal(scene, Node.SignalName.Ready);
    }
}

/* created at 2026-07-30, Thu, 11:09 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
