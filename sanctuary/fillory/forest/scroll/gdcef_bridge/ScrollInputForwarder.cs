/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Forest.Scroll.GdcefBridge;

// Maps screen-space mouse input onto the focused scroll's CEF browser pixels and
// forwards it (keys need no mapping). While focused the scroll is front-on, so the
// plane projects to screen with a linear (affine) mapping — no raycast or collider
// needed. Only valid while the scroll is the focused, front-facing surface.
public sealed class ScrollInputForwarder(
    Camera3D camera,
    MeshInstance3D scroll,
    PlaneMeshGdcef browser,
    Vector2I cefSize
)
{
    // Two clipboards: the page's own (in-memory, Chromium runs headless) and the system's
    // (Godot). Paste whichever was written last. Godot can't read the page's, so at each
    // in-page copy/cut note what the system held; if it is unchanged at paste time, the
    // page's copy is newer and Chromium pastes natively.
    string? _systemTextAtPageCopy;

    public void Forward(InputEvent e)
    {
        switch (e)
        {
            case InputEventMouseMotion m when TryMapToBrowserPixel(m.Position, out Vector2I px):
                browser.ForwardMouseMotion(
                    new InputEventMouseMotion
                    {
                        Position = px,
                        // A drag is a move with a button held: godot-cef turns this mask into
                        // Chromium's LEFT_MOUSE_BUTTON flag, which is what extends a selection.
                        ButtonMask = m.ButtonMask,
                        ShiftPressed = m.ShiftPressed,
                        CtrlPressed = m.CtrlPressed,
                        AltPressed = m.AltPressed,
                        MetaPressed = m.MetaPressed,
                    }
                );
                break;

            // Covers wheel too: a mouse wheel is an InputEventMouseButton with a WheelUp/
            // Down ButtonIndex. Factor carries the scroll magnitude.
            case InputEventMouseButton b when TryMapToBrowserPixel(b.Position, out Vector2I px):
                browser.ForwardMouseButton(
                    new InputEventMouseButton
                    {
                        Position = px,
                        ButtonIndex = b.ButtonIndex,
                        Pressed = b.Pressed,
                        DoubleClick = b.DoubleClick,
                        Factor = b.Factor,
                        ButtonMask = b.ButtonMask,
                        ShiftPressed = b.ShiftPressed,
                        CtrlPressed = b.CtrlPressed,
                        AltPressed = b.AltPressed,
                        MetaPressed = b.MetaPressed,
                    }
                );
                break;

            // in Forward(), replacing the current Ctrl+V case:
            case InputEventKey { Pressed: true, Keycode: Key.C or Key.X, CtrlPressed: true } k:
                if (!k.Echo)
                    _systemTextAtPageCopy = DisplayServer.ClipboardGet();
                browser.ForwardKey(k);
                break;

            case InputEventKey { Pressed: true, Keycode: Key.V, CtrlPressed: true } k:
                string system = DisplayServer.ClipboardGet();
                if (system == _systemTextAtPageCopy)
                    browser.ForwardKey(k); // page's copy is newer: native paste, keeps rich text
                else if (!k.Echo)
                    browser.PasteText(system);
                break;

            case InputEventKey k:
                browser.ForwardKey(k);
                break;
        }
    }

    // Screen position -> browser pixel via the scroll's projected plane. Returns false
    // if the point lands outside the scroll (u,v outside [0,1]) or the projection is
    // degenerate (edge-on).
    bool TryMapToBrowserPixel(Vector2 screen, out Vector2I pixel)
    {
        Transform3D xf = scroll.GlobalTransform;
        Aabb box = scroll.GetAabb();

        // In-plane axes: local X = width, Y = height; Z is the thin/normal axis (matches
        // the framing solver). z sits at the centre of the thin axis (the visible face).
        float z = box.Position.Z + box.Size.Z * 0.5f;
        float minX = box.Position.X,
            maxX = box.Position.X + box.Size.X;
        float minY = box.Position.Y,
            maxY = box.Position.Y + box.Size.Y;

        // Top-left in browser space = top in world (maxY) + left (minX). UnprojectPosition
        // is Godot's world->screen for this specific camera.
        Vector2 topLeft = camera.UnprojectPosition(xf * new Vector3(minX, maxY, z));
        Vector2 rightEdge = camera.UnprojectPosition(xf * new Vector3(maxX, maxY, z)) - topLeft;
        Vector2 downEdge = camera.UnprojectPosition(xf * new Vector3(minX, minY, z)) - topLeft;

        // Solve `screen = topLeft + u*rightEdge + v*downEdge` for (u, v) via 2x2 inverse.
        float det = rightEdge.X * downEdge.Y - rightEdge.Y * downEdge.X;
        if (Mathf.Abs(det) < 1e-6f)
        {
            pixel = default;
            return false;
        }

        Vector2 rel = screen - topLeft;
        float u = (rel.X * downEdge.Y - rel.Y * downEdge.X) / det;
        float v = (rightEdge.X * rel.Y - rightEdge.Y * rel.X) / det;

        if (u < 0f || u > 1f || v < 0f || v > 1f)
        {
            pixel = default;
            return false;
        }

        pixel = new Vector2I(
            Mathf.Clamp((int)(u * cefSize.X), 0, cefSize.X - 1),
            Mathf.Clamp((int)(v * cefSize.Y), 0, cefSize.Y - 1)
        );
        return true;
    }
}

/* created at 2026-06-20, Sat, 19:09 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
