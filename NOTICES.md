# Template
#### attrtemplate
- **Filename:**
- **Author:** 
- **Source:** 
- **License:** [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)
- **Changes:** 

# Third-Party Notices
## 3D

#### manul
- **Filename:** lil_manul
- **Author:** [lightinkat](https://sketchfab.com/lightinkat)
- **Source:** https://sketchfab.com/3d-models/manul-63904e8b8e0042ffa678ec6c929d063b
- **License:** [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)
- **Changes:** 

#### psx_temple_island
- **Author:** Peter Seifert
- **Source:** https://sketchfab.com/3d-models/psx-temple-island-2ed1d1300b3a41e28009efe369262baf
- **License:** [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)
- **Changes:** 
    - Added Godot import suffixes. 
    - Removed skybox and water plane to replace with custom shaders.
    - Corrected some floating bush meshes positions.

#### alien_slime_tree
- **Filename:** alien_slime_tree
- **Author:** LOLIPOP
- **Source:** https://skfb.ly/prJwS ("Alien slime tree (game-ready, lowpoly)")
- **License:** [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)
- **Changes:** 

#### forest_with_road_at_night
- **Filename:** forest_with_road_at_night
- **Author:** dasy444
- **Source:** https://skfb.ly/pMHKA ("a forest (3) with a road at night for game")
- **License:** [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)
- **Changes:** 
    - Scaled up 10× to real-world size and applied all transforms.
    - Removed the imported empty hierarchy and joined the forest meshes by material (foliage, bark, ground).
    - Switched the foliage material from alpha blend to alpha clip.
    - Renamed the materials and replaced them in Godot with standard materials built from the original textures (ground roughness raised from 0 to 0.9).
    - Surrounded the mesh with a void ring and copied some of the trees around on it.
    - Added mighty invisible walls, you're safe within from what lurks beyond.
    - Decorated the scene using this model with a variety of other landmarking models.
    
#### forest_houses
- **Filename:** forest_houses
- **Author:** [katydid](https://sketchfab.com/Katydid.)
- **Source:** https://sketchfab.com/3d-models/forest-houses-c3f714eb2c1b4c35aacbe251cba7ea9f ("Forest houses")
- **License:** [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)
- **Changes:** 
    - Removed unused textures.

#### jacaranda_tree
- **Filename:** jacaranda_tree
- **Author:** [Uncanny Bichilling](https://sketchfab.com/RokoSama)
- **Source:** https://sketchfab.com/3d-models/jacaranda-tree-380a2c4bfa6d4ac5b73dc6b001651b4c ("JACARANDA_TREE")
- **License:** [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)
- **Changes:** 
    - Converted to a `.blend` file.
    - Replaced the trunk material in Godot with a standard material built from the original trunk texture.
    - Removed too heavy for a game animation of the leaves.

#### stylised_redwood_trees_pack_with_lod_groups
- **Filename:** stylised_redwood_trees_pack_with_lod_groups (stylised_redwood_trees_pack.blend)
- **Author:** [Parelaxel](https://sketchfab.com/parelaxel)
- **Source:** https://sketchfab.com/3d-models/stylised-redwood-trees-pack-with-lod-groups-80dec2fffb174051a5a88a404b760895 ("Stylised Redwood Trees Pack (with LOD groups)")
- **License:** [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)
- **Changes:** 
    - Converted to a `.blend` file and scaled from centimetres to metres.
    - Split the display scene into separate trees, each joining its branch and wood meshes, with the origin at the trunk base.
    - Merged the per-tree duplicate materials into one shared branch and one shared wood material.
    - Removed the normal map from the wood material.
    
## Textures

### ambient.cg - CC0

> Such amazing place and so much beautiful work shared for free.

List of textures from ambient.cg:
- rock_gray_moss

### PolyHeaven - CC0

- [Rocky Terrain by Amal Kumar](https://polyhaven.com/a/rocky_terrain)

## Plugins

#### CharacterControllerPlugin

- **Description**: 
	- Modular Character Controller for Godot 4. 
	- Includes FPS version with headbob and camera movement
	- Walk, Crouch, Sprint, Swim and Fly Mode
- **Author**: Expresso Bits and Whimfoome
- **Version**: 2.1.6
- **Script**: CharacterControllerPlugin.cs
- **Changes**: Gradual overhauls for the needs of Sanctuary (yes, no sanctuary without double-jump).
- **Source**: https://github.com/ExpressoBits/character-controller
- **License**: MIT, Copyright (c) 2022 Dimitar "Whimfoome" Dimitrov

#### godot-cef

- **Description**: Chromium Embedded Framework (CEF) integration for Godot, powering the in-game browser.
- **Author**: Delton Ding
- **Version**: v1.17.0 (pinned in `src/moon/tools/fetch_godot_cef.sh`)
- **Changes**: None. Native binaries are fetched by the script, not tracked.
- **Source**: https://github.com/dsh0416/godot-cef
- **License**: MIT, Copyright 2025-2026 Delton Ding
- **Bundled**: CEF (BSD-3-Clause, Marshall A. Greenblatt) and Chromium, which carries its own third-party notices.


## Fonts

### Avara
- **Filename:** avara (Avara-Bold, Avara-BoldItalic, Avara-Black)
- **Author:** Raphaël Bastide, Wei Huang, Lucas Le Bihan, Jérémy Landes, Walid Bouchouchi (published by Velvetyne)
- **Source:** https://gitlab.com/velvetyne/Avara
- **License:** SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007

### Libertinus Mono
- **Filename:** libertinus-mono (libertinusmono-regular, version 6.3)
- **Author:** Philipp H. Poll (Linux Libertine, 2003-2012), Khaled Hosny and the Libertinus Project Authors (2012-)
- **Source:** https://github.com/alerque/libertinus
- **License:** SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007

### Maple Mono
- **Filename:** maple_mono (MapleMono, all weights with italics, version 7.900)
- **Author:** The Maple Mono Project Authors (subframe7536)
- **Source:** https://github.com/subframe7536/maple-font
- **License:** SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
