/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

#ifndef WIND_INCLUDED
#define WIND_INCLUDED

global uniform sampler2D wind_noise;
global uniform vec2 wind_direction;
global uniform float wind_scale;
global uniform float wind_speed;
global uniform float wind_strength;

vec3 wind_offset(vec2 world_position, float impact) {
    vec2 wind_dir = wind_direction;
    vec2 wind_sampling = world_position * wind_scale - wind_dir * TIME * wind_speed;
	float wind_map = texture(wind_noise, wind_sampling).r;
    wind_map *= wind_map;
    float wind = wind_map * wind_strength * impact;
    return vec3(wind * wind_direction, wind_map);
}

#endif
