/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/


shader_type spatial;
render_mode cull_disabled;
#include "res://moon/shaders/wind/wind.gdshaderinc"
#include "res://moon/shaders/traces/traces.gdshaderinc"

instance uniform int instance_count : hint_range(1, 32) = 32;
instance uniform float pile_height : hint_range(0.03, 0.5) = 0.08;

group_uniforms NoiseSampling;
// Fine, high-frequency noise: each bright speck will become one blade.
uniform sampler2D grass_pattern : hint_default_white, filter_linear_mipmap, repeat_enable;
uniform sampler2D blade_shape : hint_default_white, filter_linear_mipmap, repeat_enable;
uniform float tiling = 4.0;

group_uniforms Ground;
/*
note: source_color is important for colour textures.
Image files are stored in sRGB, and this hint makes Godot convert them to linear for lighting. 
Without it the ground looks washed out and too bright.source_color is important for colour textures. 
*/
uniform sampler2D ground_texture : source_color, filter_linear_mipmap, repeat_enable;
uniform float ground_tiling = 0.5;
uniform float ground_blend_height : hint_range(0.0, 1.0);
uniform float ground_blend_softness : hint_range(0.0, 1.0);

group_uniforms Traces;
uniform float trace_regrowth_shift_scale : hint_range(0.0, 1.0);

group_uniforms Variation;
uniform sampler2D variation_noise : hint_default_white, filter_linear_mipmap, repeat_enable;
uniform vec3 variation_color : source_color = vec3(0.006, 0.03, 0.0);
uniform float variation_color_strength : hint_range(0.0, 1.0) = 0.5;
uniform float variation_height_strength : hint_range(0.0, 1.0) = 0.5;

group_uniforms Wind;
uniform float wind_scaler : hint_range(1.0, 5.0) = 1.0;
uniform float wind_darkening : hint_range(0.0, 1.0) = 0.3;
uniform float wind_desaturation : hint_range(0.0, 1.0) = 0.5;

group_uniforms Other;
// 0 = a blade on every cell, higher = fewer blades over bare (but solid) floor.
uniform float density_cutoff : hint_range(0.0, 0.99) = 0.0;
uniform float tip_width : hint_range(0.0, 1.0) = 0.5;

uniform vec3 grass_color : source_color = vec3(0.35, 0.6, 0.2);
uniform vec3 bottom_grass_color : source_color = vec3(0.006, 0.03, 0.0);
uniform float color_map_scale : hint_range(0.0, 0.5) = 0.2;

uniform float curve : hint_range(1.0, 5.0) = 2;
uniform float blade_curve : hint_range(0.2, 5.0) = 2;

// uniform bool test_flip;

// Flat to save GPU from bothering to interpolate, because it is based on an int INSTANCE_ID
// so it will be same for all vertices of a given face.
varying flat float layer;

// We don't want 'flat' here because we definitely need interpolation since our operation scope
// is no longer bound to the UV, but to the world coordinates.
varying vec2 world_position;


void vertex() {
    layer = float(INSTANCE_ID) / float(max(instance_count - 1, 1));

    VERTEX += NORMAL * layer * pile_height;

    world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xz; 
}

void fragment() {

    /*
    Two main noise samples, both are using noise maps with same frequency.
    We need them sampled in exactly the same way.
    height_noise    – samples the cell value (determines how tall a grass blade is)
    blade_noise     – samples the distance (0 is the centreuline of a grass blane)
    */
    vec3 wind = wind_offset(world_position, layer * layer * wind_scaler);

    vec2 noise_sampling = (world_position + wind.xy) * tiling;

	float height_noise = texture(grass_pattern, noise_sampling).r;
	float blade = texture(blade_shape, noise_sampling).r;

    /*
    Player walk traces.
    */
    float trace = trace_col(world_position).r;
    float inv_trace = 1.0 - trace;

    /* 
        Variation noise sampling.
        Impact grass height and color variation.
    */
	float variation = texture(variation_noise, world_position * color_map_scale).r;

    /*
    Layer at which this blade's tip is, 0–1.
    */
    float max_layer_pre_trace = (height_noise - density_cutoff) / (1.0 - density_cutoff);

    // todo, a better way to impact grass height with variation map?
    float max_layer = max_layer_pre_trace * inv_trace;
    max_layer *= mix(1.0 - variation_height_strength, 1.0, variation);

    
    // rename to something like which layer we are on
    float current_height = layer / max(max_layer,1e-4);

    /* BELOW TWO EXCLUSION GATES */

    // variant with cutoff
    // bool max_layer_reached = noise < mix(cutoff, 1.0, layer);
    // layer > 0.0 » makes sure at the lowest part where layer == 0 we still paint bottom_grass_color
    bool max_layer_reached = layer > 0.0 && layer > max_layer;

    // if this is unclear at first read just think of:
    // blade > mix(1.0, tip_width, current_height);
    // higher tip means the allowed distance stays larger
    bool outside_of_blade = blade > mix(1.0, tip_width, pow(current_height, blade_curve));


	if ( max_layer_reached || outside_of_blade) {
		discard;
	}

    // sample grass colouring variation noise map


    vec3 top_col = mix(grass_color, variation_color, variation * variation_color_strength);
float luma = dot(top_col, vec3(0.2126, 0.7152, 0.0722));
top_col = mix(vec3(luma), top_col, 1.0 - wind.z * wind_desaturation);
    top_col *= 1.0 - min(wind.z * wind_darkening, 1.0);

    // todo, work on it, idea to make grass darken on wind
    // top_col = mix(top_col, top_col * 0.2, normalize(length(wind)));

    float trace_regrowth_shift = trace * max_layer_pre_trace * trace_regrowth_shift_scale;
    float t = min(pow(layer, curve) + trace_regrowth_shift, 1.0);
    vec3 grass = mix(bottom_grass_color, top_col, t);

    /*
        Blending overall grass colour with the ground texture colour
    */
    vec3 ground = texture(ground_texture, world_position * ground_tiling).rgb;
    float center = ground_blend_height;
    float edge0 = center - ground_blend_softness;
    float edge1 = center + ground_blend_softness;
    float weight = smoothstep(edge0, edge1, layer);

    vec3 final_color = mix(ground, grass, weight);

	ALBEDO = final_color;
	ROUGHNESS = 1.0;
}
