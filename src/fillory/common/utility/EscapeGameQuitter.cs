/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Godot;

namespace Sanctuary.Common.Utility;

public partial class EscapeGameQuitter : Node
{
    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventKey keyEvent)
        {
            if (keyEvent.Pressed && keyEvent.Keycode == Key.Escape)
            {
                GetTree().Quit(0);
            }
        }
    }
}

/* created at 2026-06-12, Fri, 14:28 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
