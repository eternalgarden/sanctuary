/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

#ifndef TRACES_INCLUDED
#define TRACES_INCLUDED

global uniform sampler2D trace_map : hint_default_black, filter_linear_mipmap, repeat_disable;
global uniform vec2 trace_center;
global uniform float trace_size;

vec3 trace_col(vec2 world_xz){
vec2 relative = world_xz - trace_center;
vec2 fraction = relative / trace_size;
vec2 uv = fraction + 0.5;
return vec3(texture(trace_map, uv).r);
}

#endif
