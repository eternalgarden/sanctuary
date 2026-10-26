
# ProtonScatter

> *Preparing new assets to work with ProtonScatter*.

- 1. Prepare mesh in Blender
	- *One object per variant*: join each tree or bush into one object, but keep the variants as separate objects in the .blend.
	- *Origin at the base* (trunk base or bush bottom), so scattered copies sit on the ground and spin in place.
	- *Apply Transform*: real metres, with scale (Sketchfab models often come in centimetres) and rotation applied.
	- *Materials*: merge duplicates so all variants share them
	- *Clean up*: remove leftover empties and heavy animations.

- 2. Import into Godot
	- Save the .blend next to its license.txt in `earth/...`
	- Use `Set Mesh Save Paths` in blender file option's actions (upper left corner of the import window), so each variant becomes its own .res. 
		- Turn on LOD generation for anything scattered in large numbers.
	- Delete leftover imports, such as a scene.gltf that duplicates the .blend.
	- *Textures*: remove unused textures (this will definitely mean normal maps which sanctuary does not use)

- 3. Wrap each variant in a scene (only for things with collision)
	- Grass and small plants skip this step: point ProtonScatter straight at the .res.
	- For larger objects that need to block spawning of the undergrowth in them need a set of scenes for each variant in `some_asset/scenes/<name>.tscn` with:
		- mesh (`MeshInstance3D`), pointing at the .res
		- trunk (`StaticBody3D`, *layer 1*): what the player bumps into
		- scatter_blocker (`StaticBody3D`, *layer 3 only*, mask 0): 
			- as a child a `CollisionShape3D` (cylinder) about 1 m wider than the trunk, to keep undergrowth away
				- ⭐ this step is pretty much an art of balancing, set the radius of the collision too small and undergrowth will overlap on it
				- consider the size of the undergrowth element that should surround it, despite a distance it might be broad enough to overlap anyway
				- make it too large and you will have plain gaps of undergrowth around it
			- layer 3 was arbitrarilly selected, it is now reserved for `scatter_block`


- 4. Scatter it
	- *One ProtonScatter node per layer* (trees, bushes, grass). 
		- Variants of the same thing go in as ScatterItems in the same node, with proportion controlling the mix.
	- Trees:
		- Render mode `Create Copies`, so the colliders become real nodes.
		- Create Inside (`Poisson`) with *radius set to the trunk-to-trunk distance*.
		- Then `Project On Colliders` to snap them to the ground.
	- Undergrowth:
		- Use Instancing render mode.
		- Only one Create modifier.
		- Project On Colliders settings:
			- collision_mask = layer 1 (ground)
			- exclude_mask = layer 3 (blockers)
			- `ray_offset` higher than the tallest blocker (15 m for the redwoods)
				- so don't be afraid to go with it pretty high
			- `ray_length` long enough to reach the ground
			- `Remove Points On Miss`: on
				- this is a crucial setting for the undergrowth to respect collisions from the exclude mask
		- *`scatter_parent`*: set it to the tree scatter, so it rebuilds after the trees.
		- *For performance*: turn off cast_shadow on grass, and set a visibility range with fade on small items.