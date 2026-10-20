// Lorenz butterfly, trail draw-pass shader: a glowing additive ribbon behind each particle.
// Used instead of the dot shader when the node's Trails export is on.
//
// How Godot particle trails work: with trail_enabled, Godot remembers each particle's recent
// TRANSFORMs (trail_lifetime seconds of history) and uses them as skeleton bones for the
// draw-pass mesh, which must be a RibbonTrailMesh or TubeTrailMesh. The mesh bends along
// the particle's recent path. The process shader aligns each particle's Y axis with its
// velocity, so the ribbon's cross-section stays square to the motion.

shader_type spatial;

// particle_trails: skin the mesh to the trail history bones. Without it the ribbon renders
// as a static strip at the particle's current position.
render_mode unshaded, blend_add, depth_draw_never, cull_disabled, particle_trails;

uniform float energy = 0.12;

void fragment() {
	// UV.x runs across the ribbon, UV.y along it (0 at the particle, 1 at the oldest end).
	float across = abs(UV.x - 0.5) * 2.0;
	float edge = 1.0 - across * across;
	float tail = 1.0 - UV.y;
	ALBEDO = COLOR.rgb * energy;
	ALPHA = edge * tail * tail * COLOR.a;
}
