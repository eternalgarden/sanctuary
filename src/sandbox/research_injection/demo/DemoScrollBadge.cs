/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Sanctuary.Sandbox.Injection;

namespace Sanctuary.Sandbox.InjectionDemo;

/// <summary>
/// The rare node that resolves something itself. Each badge should print the note of its
/// own scroll, proving the lookup stops at the nearest installer.
/// </summary>
public partial class DemoScrollBadge : Node
{
    public override void _Ready()
    {
        GD.Print($"🏷️ [{this.Resolve<NoteId>()}] badge found its own scroll's note");
    }
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
