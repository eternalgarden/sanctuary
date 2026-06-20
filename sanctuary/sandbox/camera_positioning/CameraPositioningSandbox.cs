/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Godot;

namespace Sanctuary.Sandbox;

public partial class CameraPositioningSandbox : Node3D
{
    [Export]
    public Camera3D WorldCamera { get; set; }

    [Export]
    public Camera3D FocusCamera { get; set; }

    [Export]
    public MeshInstance3D Note { get; set; }

    [Export]
    public ScrollFramingSettings Settings { get; set; }

    [Export]
    public PlaneMeshGdcef NoteBrowser { get; set; }

    bool _focused;
    ScrollCameraMover _mover;

    public override void _Ready()
    {
        _mover = new ScrollCameraMover(WorldCamera, FocusCamera, this);

        // Build the browser ONCE at its pixel-perfect size. Done here (parent _Ready,
        // which runs after the child's) so the size is known before the browser is
        // created — the browser is never resized live (see PlaneMeshGdcef.Initialize).
        int viewportHeight = (int)GetViewport().GetVisibleRect().Size.Y;
        Vector2I cefSize = ScrollFramingSolver.SolveCefSize(Note, Settings.FillFraction, viewportHeight);
        NoteBrowser.Initialize(cefSize);
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventKey { PhysicalKeycode: Key.E, Pressed: true, Echo: false })
        {
            _focused = !_focused;
            if (_focused)
            {
                Transform3D pose = ScrollFramingSolver.SolvePose(Note, WorldCamera.Fov, Settings.FillFraction);
                _mover.BlendToNote(pose, Settings);
            }
            else
                _mover.BlendBackToPlayer(Settings);
        }
    }
}


/* created at 2026-06-14, Sun, 12:17 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
