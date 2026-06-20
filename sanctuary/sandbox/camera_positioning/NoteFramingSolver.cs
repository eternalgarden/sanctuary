/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Godot;

namespace Sanctuary.Sandbox;

public readonly record struct FramingResult(Transform3D Pose, Vector2I CefSize);

public static class NoteFramingSolver
{
    // Phase 2: derive BOTH the head-on camera pose and the pixel-perfect browser
    // resolution from the desired vertical fill. Perspective is kept (no ortho, no
    // dolly): a screen-parallel plane has constant depth, so it projects with uniform
    // scale and is pixel-perfect once the browser resolution matches its screen size.
    //
    // Scale-safe (note scale is uniform by project rule, but this holds regardless):
    //  - scale is baked into GlobalTransform, applied when transforming the local AABB
    //    centre to world and via the basis column length for the world height;
    //  - normal/up are normalised so scale does not affect direction;
    //  - aspect is a ratio, so scale cancels;
    //  - the pose is built from an identity basis, so scale never leaks into the camera.
    public static FramingResult Solve(
        MeshInstance3D note,
        float fovYDegrees,
        float fillFraction,
        int viewportHeightPx
    )
    {
        Transform3D xf = note.GlobalTransform;
        Vector3 normal = xf.Basis.Z.Normalized(); // front faces +Z; use -xf.Basis.Z if the camera lands behind
        Vector3 up = xf.Basis.Y.Normalized();

        // Pivot is at the bottom-centre edge, so the local AABB centre transformed
        // through xf gives the true world centre for any pivot, with scale applied.
        Aabb box = note.GetAabb();
        Vector3 noteWorldCenter = xf * (box.Position + box.Size * 0.5f);

        float worldHeight = box.Size.Y * xf.Basis.Y.Length(); // height along up, scaled
        float doorAspect = box.Size.X / box.Size.Y; // width / height (scale cancels)

        // Distance so the note fills `fillFraction` of the screen vertically:
        // visibleHeight = 2*d*tan(fovY/2); the note fills f when worldHeight/visibleHeight = f.
        float fovY = Mathf.DegToRad(fovYDegrees);
        float distance = worldHeight / (2f * fillFraction * Mathf.Tan(fovY * 0.5f));

        Vector3 camPos = noteWorldCenter + normal * distance;
        Transform3D pose = new Transform3D(Basis.Identity, camPos).LookingAt(noteWorldCenter, up);

        // Pixel-perfect: the note occupies f * viewportHeight screen px tall, so render
        // the browser at that many px (width keeps the note's aspect). 1 texel = 1 px.
        int cefH = Mathf.RoundToInt(fillFraction * viewportHeightPx);
        int cefW = Mathf.RoundToInt(cefH * doorAspect);
        return new FramingResult(pose, new Vector2I(cefW, cefH));
    }
}

/* created at 2026-06-14, Sun, 12:47 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
