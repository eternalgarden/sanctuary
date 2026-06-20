/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Godot;

namespace Sanctuary.Sandbox;

// Two separate concerns with different lifetimes, kept as two methods:
//  - SolveCefSize: computed ONCE at startup (the browser is built at this size and
//    never resized — a live software-OSR resize crashes CEF). Depends on the note
//    aspect, the fill fraction and the viewport height.
//  - SolvePose: recomputed EACH time a note is focused. Depends on the note transform,
//    the camera fov and the fill fraction.
// fillFraction is the only shared input; both read it from the same settings so they
// stay consistent. Both keep perspective (no ortho/dolly): a screen-parallel plane has
// constant depth, so it projects with uniform scale and is pixel-perfect once the
// browser resolution matches its on-screen size.
//
// Scale-safe (note scale is uniform by project rule, but this holds regardless): scale
// is baked into GlobalTransform (applied to the AABB-centre transform and the world
// height via the basis column length); normal/up are normalised so direction is
// unaffected; aspect is a ratio so scale cancels; the pose uses an identity basis so
// scale never leaks into the camera.
public static class ScrollFramingSolver
{
    // Head-on pose: sit `distance` in front of the note's geometric centre, looking
    // down its normal. Distance is derived so the note fills `fillFraction` of the
    // screen vertically: visibleHeight = 2*d*tan(fovY/2), note fills f when
    // worldHeight/visibleHeight = f.
    public static Transform3D SolvePose(MeshInstance3D note, float fovYDegrees, float fillFraction)
    {
        Transform3D xf = note.GlobalTransform;
        Vector3 normal = xf.Basis.Z.Normalized(); // front faces +Z; use -xf.Basis.Z if the camera lands behind
        Vector3 up = xf.Basis.Y.Normalized();

        // Pivot is at the bottom-centre edge, so the local AABB centre transformed
        // through xf gives the true world centre for any pivot, with scale applied.
        Aabb box = note.GetAabb();
        Vector3 noteWorldCenter = xf * (box.Position + box.Size * 0.5f);

        float worldHeight = box.Size.Y * xf.Basis.Y.Length(); // height along up, scaled
        float fovY = Mathf.DegToRad(fovYDegrees);
        float distance = worldHeight / (2f * fillFraction * Mathf.Tan(fovY * 0.5f));

        Vector3 camPos = noteWorldCenter + normal * distance;
        return new Transform3D(Basis.Identity, camPos).LookingAt(noteWorldCenter, up);
    }

    // Pixel-perfect browser resolution: the note occupies `fillFraction * viewportHeight`
    // screen px tall, so render at that many px (width keeps the note's aspect) for
    // 1 texel = 1 screen pixel.
    public static Vector2I SolveCefSize(MeshInstance3D note, float fillFraction, int viewportHeightPx)
    {
        Aabb box = note.GetAabb();
        float doorAspect = box.Size.X / box.Size.Y; // width / height (scale cancels)

        int cefH = Mathf.RoundToInt(fillFraction * viewportHeightPx);
        int cefW = Mathf.RoundToInt(cefH * doorAspect);
        return new Vector2I(cefW, cefH);
    }
}

/* created at 2026-06-14, Sun, 12:47 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
