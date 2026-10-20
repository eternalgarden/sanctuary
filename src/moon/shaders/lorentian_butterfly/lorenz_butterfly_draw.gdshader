// Lorenz butterfly, draw-pass shader: one soft, additive, camera-facing dot per particle.
// COLOR arrives already tinted and faded by the process shader (Godot multiplies each
// particle's COLOR into the vertex COLOR of its mesh instance).

shader_type spatial;

// unshaded: no lighting, the dots emit their own colour.
// blend_add: overlapping dots accumulate, so dense regions of the attractor glow.
// depth_draw_never: additive sprites must not occlude each other.
render_mode unshaded, blend_add, depth_draw_never, cull_disabled;

// Values above 1 push the colour into HDR, which the Environment's glow picks up.
uniform float energy = 2.0;

void vertex() {
	// Particle billboard, same as StandardMaterial3D's "Particle Billboard" mode.
	// For particles, MODEL_MATRIX already includes the particle's own TRANSFORM. We keep its
	// position (MODEL_MATRIX[3]) but replace its rotation with the camera's (INV_VIEW_MATRIX
	// is camera-to-world), so the quad always faces the camera.
	mat4 mat_world = mat4(
		normalize(INV_VIEW_MATRIX[0]),
		normalize(INV_VIEW_MATRIX[1]),
		normalize(INV_VIEW_MATRIX[2]),
		MODEL_MATRIX[3]);
	MODELVIEW_MATRIX = VIEW_MATRIX * mat_world;
	// Re-apply the node's scale, which the line above discarded.
	MODELVIEW_MATRIX = MODELVIEW_MATRIX * mat4(
		vec4(length(MODEL_MATRIX[0].xyz), 0.0, 0.0, 0.0),
		vec4(0.0, length(MODEL_MATRIX[1].xyz), 0.0, 0.0),
		vec4(0.0, 0.0, length(MODEL_MATRIX[2].xyz), 0.0),
		vec4(0.0, 0.0, 0.0, 1.0));
	MODELVIEW_NORMAL_MATRIX = mat3(MODELVIEW_MATRIX);
}

void fragment() {
	float d = length(UV - 0.5) * 2.0;
	float a = 1.0 - smoothstep(0.0, 1.0, d);
	ALBEDO = COLOR.rgb * energy;
	ALPHA = a * a * COLOR.a;
}
