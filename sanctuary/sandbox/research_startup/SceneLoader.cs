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
/// Stub scene loader. Reacts to MainSceneLoadRequested by bringing the main scene
/// into the tree. It never references the orchestrator, only the matter it listens for.
/// </summary>
public partial class SceneLoader : Node
{
    private CollectibleDisposable Q { get; set; } = new();

    public override void _Ready()
    {
        var rzeka = Ursprung.Rzeka;

        // Weave is a terminal consumer (it publishes nothing itself).
        Q += rzeka.Weave<MainSceneLoadRequested>(this, s => s
            .Take(1)
            .Subscribe(
                onNext: _ => LoadMainScene(),
                onError: err => rzeka.Whisper(err)));
    }

    private void LoadMainScene()
    {
        // In the real port: GD.Load<PackedScene>(path).Instantiate().
        // A bare node stands in here; its own _Ready announces when it is truly live.
        var mainScene = new MainSceneRoot { Name = "MainScene" };

        // Scene-tree edits from inside a rzeka reaction MUST be deferred (primer rule):
        // it avoids re-entrant tree mutation and off-thread tree access. In the real
        // port this would go under a dedicated content-holder node, not the window root.
        GetTree().Root.CallDeferred(Node.MethodName.AddChild, mainScene);
    }

    public override void _ExitTree() => Q.Dispose();
}

/// <summary>
/// Stand-in for the loaded main scene. It announces readiness from its OWN _Ready.
/// With a deferred AddChild the subtree is not live until the next idle frame, so
/// the node itself is the honest signal that it is actually in the tree.
/// </summary>
public partial class MainSceneRoot : Node3D
{
    public override void _Ready() =>
        Ursprung.Rzeka.Pluck(this, new MainSceneReady());
}

/* created at 2026-07-28, Tue, 00:33 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
