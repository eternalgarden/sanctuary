/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Forest.Camera.ScrollInteraction;

[GlobalClass]
public partial class CameraBlendSettings : Resource
{
    [Export]
    public float BlendInSeconds { get; set; } = 1.0f;

    [Export]
    public float BlendOutSeconds { get; set; } = 0.5f;

    [Export]
    public Tween.TransitionType Transition { get; set; } = Tween.TransitionType.Sine;

    [Export]
    public Tween.EaseType Ease { get; set; } = Tween.EaseType.InOut;
}

/* created at 2026-06-14, Sun, 12:16 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
