shader_type spatial;
render_mode unshaded, cull_disabled, depth_draw_never, blend_mix, shadows_disabled;

uniform sampler3D noise_tex : filter_linear, repeat_enable;
uniform sampler2D depth_tex : hint_depth_texture, filter_nearest;
uniform vec4 fog_color : source_color = vec4(0.85, 0.88, 0.92, 1.0);
uniform float floor_y = 0.0;
uniform float fog_height = 0.15;
uniform float layer_alpha = 0.18;          // per-layer, tune with layer count
uniform float noise_scale = 0.6;
uniform vec3 wind = vec3(0.04, 0.0, 0.015);
uniform float soft_distance = 0.08;

varying vec3 world_pos;

void vertex() {
    world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
    float h = clamp((world_pos.y - floor_y) / fog_height, 0.0, 1.0);

    // two octaves moving at different speeds = less "sliding texture" look
    vec3 p = world_pos * noise_scale;
    float n = texture(noise_tex, p + wind * TIME).r * 0.65
            + texture(noise_tex, p * 2.3 - wind * 1.7 * TIME).r * 0.35;

    // threshold rises with height -> dense bottom, wispy top
    float d = smoothstep(h * 0.7, h * 0.7 + 0.2, n) * (1.0 - h);

    // soft fade where geometry intersects the layer
    float depth = texture(depth_tex, SCREEN_UV).r;
    vec4 v = INV_PROJECTION_MATRIX * vec4(SCREEN_UV * 2.0 - 1.0, depth, 1.0);
    float scene_z = -v.z / v.w;
    float soft = clamp((scene_z + VERTEX.z) / soft_distance, 0.0, 1.0);

    ALBEDO = fog_color.rgb;
    ALPHA = d * layer_alpha * soft;
    //ALBEDO = vec3(h);
//ALPHA = 1.0;
    
}