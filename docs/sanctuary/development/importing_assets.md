
# 3D models

## general

- Saving each tree as a mesh file (recommended for foliage): 
	- Double-click the .blend in the FileSystem dock to open Advanced Import Settings, then use `Actions » Set Mesh Save Paths`. 
	- Each tree becomes a .res mesh you can drop into a `MeshInstance3D` or, better for scattering lots of trees, a `MultiMeshInstance3D`. 
	- The meshes update whenever you re-save the .blend, neat.
- *Poly count*
	- Trees: `3k - 15k` (medium poly)
	- Grass clump: `20-400` (thousands in a scene)
	- Small undergrowth: `300-1500` (hundreds)
	- Bushes and shrubs: `1000-4000` (dozens to low hundreds)
	- Special elements `~10000k` (just a few)

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
- Prefer `.gltf` assets because you can then remove unused textures and the file itself doesn't unnecessarily bloat up repo size.

> *Using the asset*
- When using an external texture: export from blender with option:
	- `Material » Images » None`
	- Inside Godot, open the mesh file, go in the structure to the materials and select option `Use External` and point to the material using an external shader / textures.

## textures

- Remember to consciously set `Import` values on new textures.
- Download them in max preferred quality, but in import settings (Top Left bar next to `Scene`) set:
	- `Compression » Mode` make sure it is set to `VRAM Compressed`, don't accept anything else. This requires the texture to be in power of two size.
	- `Size Limit`, for unimportant textures without details you can go as low as 512 even. This setting is very neat because it lets you keep the high detail asset in case we wanted a HighRez version of the project, but currently simply ship the less VRAM consuming variant.