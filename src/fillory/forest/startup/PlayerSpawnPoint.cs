/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Godot;

namespace Sanctuary.Forest.Startup;

// Drop one into a level: the player starts here, facing the marker's forward (-Z) direction.
// StartupPlayerSpawner finds it through the group once the starting scene is attached.
public partial class PlayerSpawnPoint : Marker3D
{
    public const string Group = "player_spawn";

    public override void _EnterTree() => AddToGroup(Group);
}

/* created at 2026-10-26, Mon, 12:46 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
