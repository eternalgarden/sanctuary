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

    const string green = "#00ff41";
    const string yellow = "#ffb000";
    const string red = "#ff2d2d";
    const string dim = "#4f7a4f";

    [Export]
    VBoxContainer StepsContainer { get; set; }

    readonly Dictionary<StartupStep, RichTextLabel> _rows = new();

    public override void _EnterTree() { }

    public override void _Ready()
    {
        // var step = StartupStep.StartingScene;
        // var status = new StepStatus(StepState.Failed, "CRITICAL ERROR");
        // RenderStep(step, status, TimeSpan.Zero);
        // step = StartupStep.UserControllerLoad;
        // status = new StepStatus(StepState.Aborted, "All else drops.");
        // RenderStep(step, status, TimeSpan.Zero);

        Q += rzeka.Weave<FilloryLoadState>(
            this,
            spell =>
                spell.Subscribe(
                    onNext: state =>
                    {
                        foreach ((StartupStep step, StepStatus status) in state.LoadInfo.Progress)
                        {
                            // Steps that have not concluded stay off the list entirely.
                            if (status.State is StepState.Pending)
                                continue;

                            RenderStep(step, status, state.LoadInfo.Elapsed);
                        }
                    },
                    onError: err => rzeka.Whisper(err)
                )
        );
    }

    public override void _Process(double delta) { }

    public override void _ExitTree()
    {
        Q.Dispose();
    }

    void RenderStep(StartupStep step, StepStatus status, TimeSpan elapsed)
    {
        (string colour, string verdict) = status.State switch
        {
            StepState.Cleared => (green, "CLEARED"),
            StepState.Failed => (red, "FAILED"),
            StepState.Aborted => (yellow, "ABORTED"),
            _ => (dim, status.State.ToString().ToUpperInvariant()),
        };

        string text =
            $"[color={dim}][{elapsed.TotalSeconds:00.00}s][/color]"
            + $" {step} : [color={colour}]{verdict}[/color]";

        if (string.IsNullOrWhiteSpace(status.Reason) is false)
        {
            text += $" [color={dim}]- {status.Reason}[/color]";
        }

        if (_rows.TryGetValue(step, out RichTextLabel existing))
        {
            existing.Text = text;
            return;
        }

        var row = new RichTextLabel
        {
            // BBCode is what makes the [color=...] tags render instead of showing literally.
            BbcodeEnabled = true,
            // Without this a RichTextLabel keeps its own minimum height and the
            // VBoxContainer would give every row the same tall box.
            FitContent = true,
            ScrollActive = false,
            Text = text,
        };

        _rows[step] = row;
        StepsContainer.CallDeferred(Node.MethodName.AddChild, row);
    }
}

/* created at 2026-08-15, Sat, 19:25 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
