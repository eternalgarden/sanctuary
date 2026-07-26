https://www.reddit.com/r/godot/comments/1irns4p/what_light_baking_method_is_the_best_godot/

## 3D models

https://docs.godotengine.org/en/3.5/tutorials/assets_pipeline/importing_scenes.html#import-hints

## blender

- Using [Goblend](https://goblend.dev/).
- Using [MACHIN3tools](https://machin3.io/MACHIN3tools).
- Important notes on using name suffixes on objects in Blender to automatically perform tasks on those objects as they are transformed to Godot nodes.
	- https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/node_type_customization.html#create-collisions-col-convcol-colonly-convcolonly

## format

### GLB vs. GLTF

https://www.reddit.com/r/godot/comments/17cqalr/which_gltf_file_type_is_best_for_godot/

- Use `.glb` when you won't reuses the asset texture.
- Use `.gltf` when there will be multiple meshes with the same material using the same texture. With `.glb` this texture would be copiet for every mesh imported like that.
