/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using System.Reactive;
using System.Reactive.Disposables;
using System.Reactive.Linq;
using System.Threading.Tasks;
using Godot;
using Rzeka;
using Sanctuary.Blood.Player;
using Sanctuary.Forest.Autoloads;

namespace Sanctuary.Fairies.Player.Internal;

public partial class PlayerLoader : Node
{
    static IRzeka rzeka => Ursprung.Rzeka;
    CollectibleDisposable Q { get; set; } = new();

    [Export]
    Node3D PlayerNodeParent { get; set; }

    [Export]
    PackedScene PlayerScene { get; set; }

    bool _wasCharacterAlreadySpawned;

    public override void _EnterTree() { }

    public override void _Ready()
    {
        Q += rzeka.Shuttle<PlayerLoadRequest, PlayerLoadResponse>(
            this,
            reqs =>
                reqs.SelectMany(req =>
                    Observable
                        .FromAsync(() => SpawnPlayer())
                        .Select(player => new PlayerLoadResponse(req, player, true))
                        .Catch<PlayerLoadResponse, Exception>(ex =>
                        {
                            rzeka.Whisper(ex);
                            return Observable.Return(new PlayerLoadResponse(req, null, false));
                        })
                // TODO: how can i learn about all the overloads of rx methods
                // maybe the thing is to get my neovim setup to work with source decompilation
                // so that i could easily read rx implementation
                // because here if i do go to implementation on .FromAsync i get no locations found
                // TODO: the latest solution only lets me jump to the definition not to implementation
                // which would be way more useful to learn how Rx works
                )
        );
    }

    public override void _Process(double delta) { }

    public override void _ExitTree()
    {
        Q.Dispose();
    }

    async Task<Node3D> SpawnPlayer()
    {
        if (_wasCharacterAlreadySpawned)
        {
            throw new Exception(
                "Player scene was already spawned, maybe you need to only reposition it now?"
            );
        }
        Node3D player = PlayerScene.Instantiate<Node3D>();

        // TODO: you made a comment:  The orphan-node window is still open, in both PlayerLoader.cs:72-74 
        // and StartupSceneSpawner.cs:80-82. Same analysis as the crash we chased: between Instantiate 
        // and the deferred AddChild landing, nothing owns the node, and a throw in that 
        // window leaks it into a GC-finalizer crash at an unrelated later moment.
        // can you please explain that, this means we need to manually handle disposal of the player node?
        // why wouldn't it be automatically GCd?

        // TODO: so earlier comment about instantiation was clearly self-contradicting
        // what i meant was the case of resource loading, a packedscene is loaded eagerly
        // so this means when we use [Export] attributes on godot Resource types this means
        // we can then simply instantiate them without needing to use ResourceLoader, but
        // this happens at the cost of an eagerly, meain-threadedly loaded data? ff
        PlayerNodeParent.CallDeferred(Node.MethodName.AddChild, player);

        _wasCharacterAlreadySpawned = true;

        // TODO: this needs a timeout in case it hangs, same with StartupSceneSpawner
        // is this what is meant by orphan-node?
        await player.ToSignal(player, Node.SignalName.Ready);

        return player;
    }
}

/* created at 2026-08-17, Mon, 12:37 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
