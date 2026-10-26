/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System.Reactive.Linq;
using Godot;
using Rzeka;
using Sanctuary.Blood.Input;
using Sanctuary.Forest.Autoloads;

namespace Sanctuary.Forest.InputArbiter;

// The only writer of Input.MouseMode in the project: the cursor follows the input mode,
// and no one else touches it.
public partial class CursorKeeper : Node
{
    static IRzeka rzeka => Ursprung.Rzeka;
    CollectibleDisposable Q { get; set; } = new();

    public override void _Ready()
    {
        Q += rzeka.Weave<InputModeState>(
            this,
            states =>
                states
                    .Select(s => s.Current)
                    .DistinctUntilChanged()
                    .Subscribe(
                        onNext: mode => Input.MouseMode = CursorFor(mode),
                        onError: err => rzeka.Whisper(err)
                    )
        );
    }

    public override void _ExitTree()
    {
        Q.Dispose();
    }

    static Input.MouseModeEnum CursorFor(InputMode mode) =>
        mode switch
        {
            InputMode.Scrolls or InputMode.UI => Input.MouseModeEnum.Visible,
            _ => Input.MouseModeEnum.Captured,
        };
}

/* created at 2026-10-25, Sun, 17:20 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
