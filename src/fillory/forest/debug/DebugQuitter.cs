/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Godot;
using Rzeka;
using Sanctuary.Blood.Input;
using Sanctuary.Forest.Autoloads;

namespace Sanctuary.Forest.Debug;

// Debug builds only: Escape quits, but only in Freewalk. Anyone else who owns Escape (a
// focused scroll, a menu) acts on it first and marks it handled, so it never reaches here.
public partial class DebugQuitter : Node
{
    static IRzeka rzeka => Ursprung.Rzeka;
    CollectibleDisposable Q { get; set; } = new();

    InputMode _mode = InputMode.Disabled;

    public override void _Ready()
    {
        if (!OS.IsDebugBuild())
        {
            SetProcessUnhandledInput(false);
            return;
        }

        Q += rzeka.Weave<InputModeState>(
            this,
            states =>
                states.Subscribe(
                    onNext: s => _mode = s.Current,
                    onError: err => rzeka.Whisper(err)
                )
        );
    }

    public override void _ExitTree()
    {
        Q.Dispose();
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (_mode != InputMode.Freewalk || !@event.IsActionPressed("ui_cancel"))
            return;

        GetViewport().SetInputAsHandled();
        GetTree().Quit();
    }
}

/* created at 2026-10-26, Mon, 09:51 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
