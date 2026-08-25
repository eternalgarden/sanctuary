/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Godot;

namespace Sanctuary.Common.Utility;

// Mostly just to be able to have things a world environment while doing
// level design when ingame uses a central world environment.
public partial class AutoremovedNode : Node
{
    public override void _EnterTree()
    {
        QueueFree();
    }
}


/* created at 2026-06-12, Fri, 14:33 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
