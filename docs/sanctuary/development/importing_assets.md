
# 3D models

## general

- Saving each tree as a mesh file (recommended for foliage): 
	- Double-click the .blend in the FileSystem dock to open Advanced Import Settings, then use `Actions » Set Mesh Save Paths`. 
	- Each tree becomes a .res mesh you can drop into a `MeshInstance3D` or, better for scattering lots of trees, a `MultiMeshInstance3D`. 
	- The meshes update whenever you re-save the .blend, neat.

## blender

- You can automate some things with proper suffixes to object names in blender:
	- `-col`
		- automatically enable physics collisions on the object
		- `-convcol`
			- same but for caves basically
	- `-colonly`
		- mesh will be invisible and will serve as a collider only

## glb & gltf

https://www.reddit.com/r/godot/comments/17cqalr/which_gltf_file_type_is_best_for_godot/

> *glb vs gltf*
- Use `.glb` when you won't reuses the asset texture.
- Use `.gltf` when there will be multiple meshes with the same material using the same texture. 
	- Also use it to download assets whos only some textures you will be using, this way you can just remove the unused ones and prevent project unnecessary bloating.
- With `.glb` this texture would be copied for every mesh imported like that.

> *Using the asset*
- When using an external texture: export from blender with option:
	- `Material » Images » None`
	- Inside Godot, open the mesh file, go in the structure to the materials and select option `Use External` and point to the material using an external shader / textures.
