
shader_type spatial;
render_mode cull_disabled;

// Fine, high-frequency noise: each bright speck will become one blade.
uniform sampler2D grass_pattern : hint_default_white, filter_linear_mipmap, repeat_enable;
uniform sampler2D blade_shape : hint_default_white, filter_linear_mipmap, repeat_enable;


// Later it will be set by a spawner script, which will both set MultiMesh instance_count and
// this uniform from one nujmber using set_shader_parameter
uniform float tiling = 4.0;
uniform int instance_count : hint_range(1, 32) = 32;

uniform float pile_height : hint_range(0.03, 0.5) = 0.08;

// 0 = a blade on every cell, higher = fewer blades over bare (but solid) floor.
uniform float density_cutoff : hint_range(0.0, 0.99) = 0.0;
uniform float tip_width : hint_range(0.0, 1.0) = 0.5;

uniform vec3 grass_color : source_color = vec3(0.35, 0.6, 0.2);
uniform vec3 bottom_grass_color : source_color = vec3(0.006, 0.03, 0.0);

uniform float curve : hint_range(1.0, 5.0) = 2;
uniform float blade_curve : hint_range(0.2, 5.0) = 2;

// uniform bool test_flip;

// Flat to save GPU from bothering to interpolate, because it is based on an int INSTANCE_ID
// so it will be same for all vertices of a given face.
varying flat float layer;

void vertex() {
    layer = float(INSTANCE_ID) / float(max(instance_count - 1, 1));

    VERTEX += NORMAL * layer * pile_height;  
}

void fragment() {
    // noise samples cell value
    // it determines how tall a grass blade is
	float noise = texture(grass_pattern, UV * tiling).r;

    // blade samples distance
    // 0 is the centre line of a grass blade
	float blade = texture(blade_shape, UV * tiling).r;

    // layer at which this blade's tip is, 0–1
    // float max_layer = noise; 
    float max_layer = (noise - density_cutoff) / (1.0 - density_cutoff);

    float current_height = layer / max(max_layer,1e-4);

    // variant with cutoff
    // bool max_layer_reached = noise < mix(cutoff, 1.0, layer);
    // layer > 0.0 » makes sure at the lowest part we still paint bottom_grass_color
    bool max_layer_reached = layer > 0.0 && layer > max_layer;

    // if this is unclear at first read just think of:
    // blade > mix(1.0, tip_width, current_height);
    // for higher tip width more will get excluded
    bool outside_of_blade = blade > mix(1.0, tip_width, pow(current_height, blade_curve));

	if ( max_layer_reached || outside_of_blade) {
		discard;
	}

    float t = pow(layer, curve);
	ALBEDO = mix(bottom_grass_color, grass_color, t);
	ROUGHNESS = 1.0;
}
