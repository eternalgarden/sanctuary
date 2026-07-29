/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Godot;
using System;
using System.Reactive.Disposables;
using System.Reactive.Linq;
using Rzeka;
using Sanctuary.Forest.Autoloads;

namespace Sanctuary.Forest.StartupProcess;
public partial class StartupProcess : Node
{
    CollectibleDisposable Q { get; set; }
    static IRzeka rzeka => Ursprung.Rzeka;

    public override void _EnterTree()
    {
        Q = new();
    }

    public override void _Ready()
    {
        
    }

    public override void _Process(double delta)
    {
    }

    public override void _ExitTree()
    {
        Q.Dispose();
    }
}

/* created at 2026-07-29, Wed, 15:59 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
