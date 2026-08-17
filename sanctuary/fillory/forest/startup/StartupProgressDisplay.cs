/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using System.Collections.Generic;
using System.Reactive.Disposables;
using System.Reactive.Linq;
using Godot;
using Rzeka;
using Sanctuary.Blood.Startup;
using Sanctuary.Forest.Autoloads;

namespace Sanctuary.Forest.Startup;

public partial class StartupProgressDisplay : Node
{
    static IRzeka rzeka => Ursprung.Rzeka;
    CollectibleDisposable Q { get; set; } = new();

    [Export]
    VBoxContainer StepsContainer { get; set; }

    HashSet<string> _appended = new();

    public override void _EnterTree() { }

    public override void _Ready()
    {
        Q += rzeka.Weave<FilloryLoadState>(
            this,
            spell =>
                spell.Subscribe(
                    onNext: state =>
                    {
                        foreach (var step in state.LoadInfo.Steps)
                        {
                            if (step.Done && _appended.Add(step.Name))
                            {
                                AppendClearedStep(step.Name, state.LoadInfo.Elapsed);
                            }
                        }
                    },
                    onError: err => rzeka.Whisper(err)
                )
        );

        AppendClearedStep("meow", TimeSpan.MinValue);
    }

    public override void _Process(double delta) { }

    public override void _ExitTree()
    {
        Q.Dispose();
    }

    void AppendClearedStep(string name, TimeSpan elapsed)
    {
        var line = new RichTextLabel
        {
            BbcodeEnabled = true,
            FitContent = true,
            ScrollActive = false,
            Text =
                $"[color=#888888][{elapsed.TotalSeconds:00.00}s][/color]"
                + $" {name} : [color=#7cfc9e]yes[/color]",
        };
        StepsContainer.CallDeferred(Node.MethodName.AddChild, line);
    }
}

/* created at 2026-08-15, Sat, 19:25 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
