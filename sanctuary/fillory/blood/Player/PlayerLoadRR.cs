/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System.Text.Json.Serialization;
using Godot;
using Rzeka;

namespace Sanctuary.Blood.Player;

public class PlayerLoadRequest : Request
{
    public PlayerLoadRequest() { }
}

public class PlayerLoadResponse : Response<PlayerLoadRequest>
{
    [JsonIgnore]
    public Node3D Player { get; set; }

    public PlayerLoadResponse(PlayerLoadRequest request, Node3D player, bool wasSuccessful)
        : base(request, wasSuccessful)
    {
        Player = player;
    }
}

/* created at 2026-08-17, Mon, 12:38 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
