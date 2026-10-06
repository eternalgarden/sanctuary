// Lorenz butterfly, particle process shader.
//
// Every particle is its own trajectory through the Lorenz system. They are all born inside
// a tiny ball around `seed_point`, so at first they move together as one bright dot. Chaos
// then pulls them apart (the separation grows roughly as e^(0.9 t)) until the cloud has
// smeared over both lobes and the whole butterfly is visible.
//
// Coordinates: the integration state lives in "Lorenz space" (x, y, z with z up, about
// ±25 wide and 0..50 tall). Godot is Y-up, so we map Lorenz (x, y, z) to local
// (x, z - center_height, y) and multiply by world_scale. The integration state is recovered
// from TRANSFORM every frame, so we need no extra per-particle storage.

shader_type particles;

// Godot normally runs `TRANSFORM.origin += VELOCITY * DELTA` after process(), and applies
// gravity and attractor nodes. We integrate positions ourselves with RK4, so turn both off.
// VELOCITY is still written below, but only for motion vectors (TAA, motion blur).
render_mode disable_velocity, disable_force;

group_uniforms lorenz;
uniform float sigma = 10.0;
uniform float rho = 28.0;
uniform float beta = 2.6666667;

group_uniforms motion;
// Attractor time units per real second.
uniform float time_scale = 0.8;
// Largest RK4 step in attractor time. A frame is split into as many substeps as needed.
uniform float max_step = 0.004;

group_uniforms seeding;
uniform vec3 seed_point = vec3(1.0, 1.0, 1.0);
uniform float seed_radius = 0.01;

group_uniforms look;
uniform float world_scale = 0.05;
uniform float center_height = 25.0;
uniform sampler2D color_ramp : source_color, filter_linear, repeat_disable;
// Speed (Lorenz units per attractor second) that maps to the right end of the ramp.
uniform float ramp_speed = 180.0;
// Seconds of fade at the start and end of each particle's life.
uniform float fade_time = 1.5;

vec3 lorenz(vec3 p) {
	return vec3(
		sigma * (p.y - p.x),
		p.x * (rho - p.z) - p.y,
		p.x * p.y - beta * p.z);
}

vec3 rk4(vec3 p, float h) {
	vec3 k1 = lorenz(p);
	vec3 k2 = lorenz(p + k1 * h * 0.5);
	vec3 k3 = lorenz(p + k2 * h * 0.5);
	vec3 k4 = lorenz(p + k3 * h);
	return p + (k1 + 2.0 * k2 + 2.0 * k3 + k4) * (h / 6.0);
}

vec3 to_local(vec3 s) {
	return vec3(s.x, s.z - center_height, s.y) * world_scale;
}

vec3 to_lorenz(vec3 p) {
	vec3 s = p / world_scale;
	return vec3(s.x, s.z, s.y + center_height);
}

// PCG hash: a cheap, well-distributed integer RNG.
uint pcg(inout uint state) {
	state = state * 747796405u + 2891336453u;
	uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
	return (word >> 22u) ^ word;
}

float rand01(inout uint state) {
	return float(pcg(state)) / 4294967295.0;
}

// Uniform random point inside the seed ball.
vec3 seed_sample(uint index, uint number, uint random_seed) {
	uint state = index * 1973u + number * 9277u + random_seed * 26699u;
	float cos_theta = rand01(state) * 2.0 - 1.0;
	float phi = rand01(state) * 6.28318530718;
	float r = seed_radius * pow(rand01(state), 1.0 / 3.0);
	float sin_theta = sqrt(max(0.0, 1.0 - cos_theta * cos_theta));
	return seed_point + r * vec3(sin_theta * cos(phi), sin_theta * sin(phi), cos_theta);
}

// start() runs when a particle is (re)born. The RESTART_* flags say which parts the
// engine expects us to reset this time.
void start() {
	if (RESTART_CUSTOM) {
		// CUSTOM.x is read as a rotation by billboard code, so keep it 0.
		// We use CUSTOM.y as the particle's age in seconds.
		CUSTOM = vec4(0.0);
	}
	if (RESTART_ROT_SCALE) {
		TRANSFORM[0] = vec4(1.0, 0.0, 0.0, 0.0);
		TRANSFORM[1] = vec4(0.0, 1.0, 0.0, 0.0);
		TRANSFORM[2] = vec4(0.0, 0.0, 1.0, 0.0);
	}
	if (RESTART_POSITION) {
		// Local coordinates: the C# node forces local_coords on, so TRANSFORM is relative
		// to the emitter node and needs no EMISSION_TRANSFORM.
		TRANSFORM[3] = vec4(to_local(seed_sample(INDEX, NUMBER, RANDOM_SEED)), 1.0);
	}
	if (RESTART_VELOCITY) {
		VELOCITY = vec3(0.0);
	}
	if (RESTART_COLOR) {
		// Invisible until the first process() pass computes a real colour.
		COLOR = vec4(0.0);
	}
}

void process() {
	CUSTOM.y += DELTA;
	float age = CUSTOM.y;

	vec3 s = to_lorenz(TRANSFORM[3].xyz);

	float h_total = DELTA * time_scale;
	int steps = clamp(int(ceil(h_total / max(max_step, 1e-5))), 1, 64);
	float h = h_total / float(steps);
	for (int i = 0; i < steps; i++) {
		s = rk4(s, h);
	}

	// A blown-up integration (absurd time_scale, or rho pushed into wild regimes) would
	// leave a NaN particle stuck forever. Put it back at the seed instead.
	if (any(isnan(s)) || any(isinf(s)) || dot(s, s) > 1e8) {
		s = seed_sample(INDEX, NUMBER + 7919u, RANDOM_SEED);
		CUSTOM.y = 0.0;
		age = 0.0;
	}

	vec3 v = lorenz(s);
	TRANSFORM[3].xyz = to_local(s);
	VELOCITY = vec3(v.x, v.z, v.y) * world_scale * time_scale;

	// Point the particle's Y axis along its motion. Dots ignore this (they billboard), but
	// trails use these rotations as their bones, so the ribbon stays square to the path
	// instead of collapsing to a sliver wherever the path runs along a fixed axis.
	vec3 dir = VELOCITY / max(length(VELOCITY), 1e-6);
	vec3 helper = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
	vec3 side = normalize(cross(helper, dir));
	TRANSFORM[0].xyz = side;
	TRANSFORM[1].xyz = dir;
	TRANSFORM[2].xyz = cross(side, dir);

	float speed01 = clamp(length(v) / max(ramp_speed, 1e-3), 0.0, 1.0);
	vec4 tint = texture(color_ramp, vec2(speed01, 0.5));
	float fade_in = clamp(age / max(fade_time, 1e-3), 0.0, 1.0);
	float fade_out = clamp((LIFETIME - age) / max(fade_time, 1e-3), 0.0, 1.0);
	COLOR = vec4(tint.rgb, tint.a * fade_in * fade_out);
}
