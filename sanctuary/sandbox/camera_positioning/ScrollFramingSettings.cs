/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Godot;

namespace Sanctuary.Sandbox;

[GlobalClass]
public partial class ScrollFramingSettings : Resource
{
    [Export(PropertyHint.Range, "0.5,1,0.01")]
    public float FillFraction { get; set; } = 0.9f;

    [Export] public float BlendInSeconds { get; set; } = 1.0f;
    [Export] public float BlendOutSeconds { get; set; } = 0.5f;

    [Export] public Tween.TransitionType Transition { get; set; } = Tween.TransitionType.Sine;
    [Export] public Tween.EaseType Ease { get; set; } = Tween.EaseType.InOut;

    [Export(PropertyHint.Range, "-1,1,0.01")]
    public float HorizontalOffset { get; set; } = 0f;
}

/* created at 2026-06-14, Sun, 12:16 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
