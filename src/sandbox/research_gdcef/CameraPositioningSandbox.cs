/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Godot;
using Sanctuary.Forest.Camera.ScrollInteraction;
using Sanctuary.Forest.Scroll.GdcefBridge;

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
    public CameraBlendSettings CameraBlendSettings { get; set; }

    [Export]
    public ScrollDisplaySettings ScrollDisplaySettings { get; set; }

    [Export]
    public PlaneMeshGdcef NoteBrowser { get; set; }

    bool _focused;
    ScrollCameraMover _mover;
    ScrollInputForwarder _forwarder;

    public override void _Ready()
    {
        _mover = new ScrollCameraMover(WorldCamera, FocusCamera, this);

        // Build the browser ONCE at its pixel-perfect size. Done here (parent _Ready,
        // which runs after the child's) so the size is known before the browser is
        // created — the browser is never resized live (see PlaneMeshGdcef.Initialize).
        int viewportHeight = (int)GetViewport().GetVisibleRect().Size.Y;
        Vector2I cefSize = ScrollFramingSolver.SolveCefSize(
            Note,
            ScrollDisplaySettings.FillFraction,
            viewportHeight
        );
        NoteBrowser.Initialize(cefSize);

        _forwarder = new ScrollInputForwarder(FocusCamera, Note, NoteBrowser, cefSize);
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventKey { PhysicalKeycode: Key.E, Pressed: true, Echo: false })
        {
            _focused = !_focused;
            if (_focused)
            {
                Transform3D pose = ScrollFramingSolver.SolvePose(
                    Note,
                    WorldCamera.Fov,
                    ScrollDisplaySettings.FillFraction
                );
                _mover.BlendToNote(pose, CameraBlendSettings);
            }
            else
                _mover.BlendBackToPlayer(CameraBlendSettings);
            return;
        }

        // While focused, route mouse + keyboard to the scroll's editor.
        if (_focused)
            _forwarder.Forward(@event);
    }
}


/* created at 2026-06-14, Sun, 12:17 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
