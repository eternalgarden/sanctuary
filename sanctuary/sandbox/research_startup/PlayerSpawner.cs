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
/// Stub player spawner. Spawns the player once the main scene is ready. Fully
/// decoupled: it knows nothing about the scene loader, only the milestone it publishes.
/// </summary>
public partial class PlayerSpawner : Node
{
    private CollectibleDisposable Q { get; set; } = new();

    public override void _Ready()
    {
        var rzeka = Ursprung.Rzeka;

        Q += rzeka.Weave<MainSceneReady>(this, s => s
            .Take(1)
            .Subscribe(
                onNext: _ => SpawnPlayer(),
                onError: err => rzeka.Whisper(err)));
    }

    private void SpawnPlayer()
    {
        // Real port would instantiate the player fairy's scene here.
        var player = new PlayerAvatar { Name = "Player" };
        GetTree().Root.CallDeferred(Node.MethodName.AddChild, player);
    }

    public override void _ExitTree() => Q.Dispose();
}

/// <summary>
/// Stand-in for the player. Announces its own arrival once actually in the tree.
/// </summary>
public partial class PlayerAvatar : Node3D
{
    public override void _Ready() =>
        Ursprung.Rzeka.Pluck(this, new PlayerSpawned());
}

/* created at 2026-07-28, Tue, 00:33 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
