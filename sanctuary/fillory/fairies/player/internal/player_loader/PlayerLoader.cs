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

namespace Sanctuary.Fairies.Player;

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
        // we don;t need to instantiate it because it is already auto-loaded through the export property?
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
