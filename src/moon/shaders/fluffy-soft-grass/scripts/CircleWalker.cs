/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Shaders;

// Test helper: walks in a circle around where it was placed, so the grass traces can be
// tried out without a player.
public partial class CircleWalker : Node3D
{
    [Export]
    float Radius { get; set; } = 3f;

    // Metres per second along the circle.
    [Export]
    float Speed { get; set; } = 1.5f;

    Vector3 centre;
    float angle;

    public override void _Ready()
    {
        centre = Position;
    }

    public override void _Process(double delta)
    {
        angle += Speed / Radius * (float)delta;
        Position = centre + new Vector3(Mathf.Cos(angle), 0f, Mathf.Sin(angle)) * Radius;
    }
}

/* created at 2026-10-29, Thu, 16:35 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
