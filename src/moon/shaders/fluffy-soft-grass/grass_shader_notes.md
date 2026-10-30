# Fluffy soft grass: learning the BruteForce grass shader, then writing our own in Godot

Started 2026-10-26. The goal is to **understand** how the BruteForce grass shader for Unity
achieves its look, then write a Godot version from that understanding. This is not a code port.

- Our shader: `shaders/fluffy_soft_grass.gdshader`
- Spawner: `scripts/GrassShells.cs`; shared wind: `moon/shaders/wind/wind.gdshaderinc`
- Test scene: `scene/fluffy_soft_grass.tscn`, `Level` (the `.blend`, Editable Children) with a
  `grass_shells` spawner under each grass mesh
- Reference project (read-only, Unity):
  `/home/merry/repositories/Unity/learn-grass-shader/Assets/BruteForce-GrassShader`

## What we love about it

1. **It feels like walking on the softest carpet.**
2. **It leaves traces behind you** that slowly fill back in.

Everything else (rim light, mowing, rain, terrain variants) is secondary to those two.

## Licensing: write our own, don't copy

Every BruteForce shader file starts with `Copyright 2021 BRUTE FORCE, all rights reserved`. It is
a paid Unity Asset Store asset, and Neo ships a GPL licence. So:

- Do **not** copy its shader code, scripts, or textures into Neo.
- Its *techniques* (shell texturing, render-texture interaction) are common knowledge and fine
  to reimplement.
- Read it to understand, then write the Godot version ourselves. When a step needs a
  reference, point at the Unity file and line, but don't paste it.

## How BruteForce works

### The core: shell texturing

The ground mesh is drawn **many times** (up to 17 "stacks"), each copy pushed a bit further
up along the surface normal, like a stack of transparent sheets. Each sheet samples a grass
pattern noise and **discards** every pixel whose value is below that sheet's height. Stacked
together, the surviving dots read as blades.

- Full version: `Shaders/Standard/BFGrass.shader` builds the sheets in a **geometry shader**
  (stack loop around line 331).
- Mobile/Lite: `Scripts/BF_MeshExtrusion.cs` copies the mesh into stacked layers ahead of time
  and stores each layer's height in the vertex colour (`i.color.r` in `BFGrassMobile.shader`).

### Why it feels like a soft carpet

- Many sheets, packed close, short overall height → dense, fine pile.
- Fine, high-frequency grass pattern noise → thousands of tiny blades.
- Dark roots, light tips → cheap fake depth that reads as plush.
- Large-scale colour noise → it never looks tiled.
- Gentle wind that moves only the upper sheets → tips ripple like brushed velvet.

### How the traces work

No simulation and no memory: the trace is **particles that fade**.

1. The player emits particles (lifetime 3 s) on a layer only a hidden camera sees
   (`Prefab/Standard/ParticleEffects/PEPlayer.prefab`).
2. A top-down orthographic camera (`Prefab/CameraEffect/CameraEffect.prefab`, 50 × 50 m, 20 m
   above the player) renders only those particles into a texture.
   `Scripts/BF_SetInteractiveShaderEffects.cs` makes it follow the player and publishes the
   texture, camera position and size globally.
3. The grass shader reads that texture at its own world position; where bright, blades
   flatten and darken (`ripples`, around line 245 of `BFGrassMobile.shader`). As the
   particles fade, the grass springs back. Particle lifetime = how long traces last.

### Distance fading, and what Mobile drops

- Full: the geometry shader lowers the stack count with distance (16 → 26 m).
- Mobile: fades only in the pixel shader, so distant sheets still cost pixels.
- Mobile also drops rim light, light intensity, near-camera smoosh and "ultra grass".
  That, not the pre-built layers, is why it looks worse.

## Porting to Godot

**Godot has no geometry shaders**: a shader can move vertices but never create new ones, so
something outside the shader must supply the N copies.

| Unity | Godot |
|---|---|
| geometry shader making N shells | `MultiMeshInstance3D` drawing the ground N times, layer from `INSTANCE_ID` (what we do) |
| per-triangle stack count by distance | vertex shader collapses far sheets to zero size, so they produce no pixels |
| particle system on its own layer | `GPUParticles3D` following the player, on a separate visual layer |
| top-down ortho camera to a texture | `SubViewport` with an orthographic `Camera3D`, `cull_mask` = only that layer |
| `Shader.SetGlobalTexture` / `SetGlobalVector` | global shader uniforms (Project Settings → Shader Globals) |
| `clip()` | `discard` |

## Performance

- Triangles are cheap; **pixels** are the cost: each grass pixel near the camera can be
  processed up to N times. Cost ≈ grass screen coverage × number of sheets.
- Forward+ does a depth pre-pass that cutout materials take part in; verify with the profiler.
- The trace system is cheap (a few hundred particles into a small texture).
- Distance fade via vertex collapse is the main lever.

## What we've learned (steps 1–3, 2026-10-27)

### Step 1: one sheet
A plane that `discard`s pixels whose noise is below a cutoff. The pattern is our own
`NoiseTexture2D` (Cellular, **Cell Value**: one random value per cell, so every cell is one blade).

### Step 2: many sheets
- **Instancing:** one draw call stamps the same mesh N times. The vertex shader runs per vertex
  *per instance*, and `INSTANCE_ID` (int, 0…N-1) is the only thing that differs between copies.
- `layer = float(INSTANCE_ID) / float(max(instance_count - 1, 1))`: the "floor number" as 0–1.
  Divide by `count - 1` so the top sheet is exactly 1. Convert to float first (int division!).
- `VERTEX += NORMAL * layer * pile_height`: `pile_height` is in metres (1 Godot unit = 1 m);
  along `NORMAL` so it works on slopes.
- `layer` reaches the fragment shader as a `varying flat float`: identical at every corner of a
  sheet, so there is nothing to interpolate.
- Compare like with like: noise is 0–1, so compare it with the 0–1 layer, never with metres.
  (Unity: `clip(alpha - i.color.r)`, `BFGrassMobile.shader:288`.)
- Scene plumbing: a fresh MultiMesh's transforms are all zero (needs identity transforms in
  `buffer`); the shader moves vertices outside the AABB (`extra_cull_margin = 1.0`).

### Step 3: shaping and colour
- **Dark roots:** `ALBEDO = mix(bottom_grass_color, top_color, pow(layer, curve))`. Two colours,
  not a darkness factor, so roots can differ in hue. On [0, 1] a higher power gives a lower
  curve = more of the root colour = darker, brightening only near the tips.
- **Tapered blades:** a second Cellular texture with return type **Distance**: the horizontal
  distance to the cell's point, i.e. the blade's spine (0 at the centre). It must use the
  **same seed, frequency, size and seamless** setting as the height texture, or the cells
  don't line up. Discard where `blade > mix(1.0, tip_width, pow(height_in_blade, blade_curve))`.
- **Taper per blade, not per pile:** `height_in_blade = layer / max(blade_top, 1e-4)`, or short
  blades never get past their thick part. Distance is normalised over the whole texture, so
  cell edges sit around 0.4–0.6 and `tip_width` above ~0.5 trims little.
- **Density without holes:** `blade_top = (noise - density_cutoff) / (1 - density_cutoff)`; the
  bottom sheet (`layer == 0`) never discards, so it is a solid floor in the root colour (soil).
- **Colour variation:** low-frequency seamless Perlin sampled in **world space**,
  `(MODEL_MATRIX * vec4(VERTEX, 1.0)).xz` in a non-flat varying, so patches are continuous and
  the same size across meshes. The 4th component 1.0 means "a point" (offset applies); 0.0
  would mean "a direction".
- **GLSL pitfalls hit:** `(VERTEX, 1.0)` without `vec4` is the comma operator (just `1.0`);
  `?:` binds looser than `||`; `mix(a, b, t)` argument order (stack was upside down once); an
  unassigned `hint_default_white` texture reads as 1.0; dividing by 0 gives inf/NaN silently.
- **Workflow:** the editor shows unsaved values; save before asking for a review of the
  `.tscn`. Edit the shader in one place only (nvim or Godot), not both.

## What we've learned (spawner and wind, 2026-10-28/29)

### The spawner: `scripts/GrassShells.cs`
- A `[Tool]` `MultiMeshInstance3D` placed as the **child of any `MeshInstance3D`**: one spawner
  per mesh. It copies the parent's mesh into a MultiMesh with identity transforms. Several
  spawners under one mesh stack the same grass on top of itself.
- `instance uniform` in the shader + `SetInstanceShaderParameter` on the **node** (not the
  material) gives per-node values: `instance_count`, `pile_height`. Textures can't be instance
  uniforms (max 16 per shader), and the material can't set them. Rule of thumb: the material is
  the *kind* of grass, instance uniforms are what changes *where it's placed*. `tiling` went
  back to the material, because neighbouring meshes must share it to line up.
- The parent stops drawing (`Layers = 0`), or it z-fights with the floor sheet. The original
  layers are kept in an exported `VisualLayers` (so they survive a scene reload) and restored
  in `_ExitTree`.
- A property **setter** applies a change immediately (`PileHeight` → shader + `ExtraCullMargin`).
  Exported values are assigned during scene load, so anything touching the parent needs
  `IsNodeReady()`. `ExtraCullMargin` = pile height, because the shader moves vertices outside
  the mesh's bounding box.
- **C# `[Tool]` reload trap:** after a rebuild the editor can silently keep running the old DLL.
  Check Output for assembly reload errors; reload the scene, or restart Godot if needed.
- `.blend` import: suffix hints like `-col` need no space before them; Editable Children allows
  adding nodes under imported meshes without extracting.

### Wind: `moon/shaders/wind/wind.gdshaderinc`
- **Shared wind** needs more than the same noise: the same world-space sampling, scale,
  direction, speed and clock (`TIME` is shared). So the values are **global shader uniforms**
  (Project Settings → Shader Globals) and the formula is one function in a **shader include**,
  so every shader computes it identically. `vec2 wind_offset(vec2 world_xz, float impact)`;
  each shader picks its own weight: `layer * layer` for grass, later `COLOR.r` for painted meshes.
- An include is pasted in by the compiler: top-level stuff only (uniforms, functions), no
  `shader_type`; `#ifndef` guard; the including shader must not redeclare its globals.
- Scroll the noise (`- direction * TIME * speed`) so gusts travel; a global `sin(TIME)` only
  makes the whole field swing in lockstep. `wind_map * wind_map` gives calm pauses and sharp
  gusts that lean one way.
- **Wind in the fragment shader, not on vertices** (BruteForce's way, `BFGrass.shader:427`):
  shift the blade sampling coordinates by the wind. Vertex wind can only differ between
  vertices, so a low-poly ground slides in big rigid pieces. Add the offset in metres *before*
  `tiling`, and to **both** blade lookups (they must stay aligned); not to the colour lookup.
- `direction` belongs on the scroll and on the offset, never multiplied into the coordinate
  (that stretches the texture, and a 0 component collapses it into stripes).
- Shader globals pointing at an inline resource (`"::NoiseTexture2D_…"`) work in the editor
  but are empty in the running game; save the texture as a `.tres`.
- Godot's "seamless" noise moves the seam to the middle and blends a strip around it; raise
  the frequency (and set gust size with `wind_scale`) or widen the blend skirt.
- Painted meshes: Blender Color Attribute, and enable **Meshes → Colors** in the `.blend`
  import settings (off by default; `COLOR` then reads white everywhere).

## What we've learned (traces and ground, 2026-10-29/30)

### The trace map: `GrassTraces` in the test scene
- A shader can't remember anything between frames, so the memory lives in a **texture**: an
  orthographic `Camera3D` in a `SubViewport` looks straight down and sees only the trace
  particles (render layer 11, `grass_walk_traces`; the main camera must exclude it). An ortho
  camera has no perspective, so its image is a map of the ground, to scale.
- A `SubViewport` is not a 3D node, so its camera doesn't inherit a parent's transform; a
  `RemoteTransform3D` under the walker (10 m up, position only) moves it.
- SubViewport **Update Mode: Always** (the default only renders when shown on screen). Trace
  environment: custom black background, no ambient.
- **Particles:** `GPUParticles3D` with Local Coords off, gravity 0. The *process material* says
  what particles do (incl. colour over life); the *draw material* says how they look and must
  use **vertex colour as albedo**, unshaded, Alpha, or the colour never shows. Footprints are
  a flat `QuadMesh` (Orientation Face Y) with a radial `GradientTexture2D` (white centre →
  transparent rim): a soft disc, so the grass dips smoothly instead of a jagged cut.
- **Regrowth** = what the particles do over their life: fading makes the whole path rise
  together; a shrinking **scale curve** closes the path from the edges inward.
- `scripts/GrassTraces.cs` (on the SubViewport) publishes global uniforms:
  `trace_map` (set at runtime, a ViewportTexture can't live in Project Settings),
  `trace_center` (camera xz, every frame), `trace_size` (ortho size).
  It isn't `[Tool]`, so the grass only reacts in play mode.
- `scripts/CircleWalker.cs`: a test walker circling its start point.

### Reading it: `moon/shaders/traces/traces.gdshaderinc`
- World → map UV: `(world_xz - trace_center) / trace_size + 0.5` (metres from the centre, as a
  fraction of the map, shifted so the centre is 0.5). Camera rotated −90° around X: u = +x,
  v = +z, no flip.
- The map is a **moving window** around the walker: traces only exist inside it.
  `repeat_disable` (or copies appear every map width), `hint_default_black` (no map = no
  traces). Still open: return 0 outside 0–1, or edge pixels streak outward.
- **Flattening** = shorter blades: `max_layer *= 1.0 - trace`. (Using the trace in
  `current_height` only changed the taper; discarding where `trace > 0` mowed the grass.)

### Ground texture
- `ground_texture` (with `source_color`: colour images are sRGB, data noise isn't) sampled in
  world space; the floor and the lowest layers blend into the grass with
  `smoothstep(edge0, edge1, layer)`, so blades grow out of the soil.
- Branchless tricks (`when_gt` with `step`/`sign`) aren't worth it: compilers turn a simple
  `if`/`else` into a select anyway, `layer` is flat so its branches are uniform, and `discard`
  is a branch regardless. Use `mix`/`smoothstep` for soft results, `if` for hard decisions.

## TODO: next steps

### Leftovers from step 3
- [x] Move the blade textures to **world space** too (same trick as the colour), so the
      grass is continuous across any number of meshes.
- [ ] Smooth the **sawtooth edges** up close: more layers, a bigger texture, or a softer edge.
- [x] Maybe a separate `floor_color` or a ground texture for the bare floor.

### Grass on any mesh: done with the spawner
- [ ] `LayerCount` setter (guarded `BuildShells()`), and `GrassMaterial` too, instead of
      rebuilding on save.
- [ ] Grass on one material slot only (TODO comment in `GrassShells.cs`).

Uneven ground (hills, ramps) works, since sheets move along each vertex's `NORMAL`, but:
- Needs **smooth normals**; hard edges/flat shading make shells tear apart along edges.
  The spawner could compute smoothed normals for the grass.
- World **xz** sampling stretches on steep slopes and walls → **triplanar** sampling, or mesh UVs.
- Blades stand perpendicular to the surface; optionally blend the push between `NORMAL` and world up.
- Sharp convex edges spread shells apart, tight concave corners make them cross; a low
  `pile_height` hides both.

### Part 2: the traces (the part we love most)
- [x] **4. Trace particles:** a trail of invisible particles following the player, on its own
      visual layer, seen only by a hidden camera.
- [x] **5. Top-down `SubViewport`:** an orthographic camera looking straight down paints the
      particles into a texture, a map of "where someone has just walked", exposed as a global
      shader uniform with the camera position and size.
- [x] **6. Flattening:** the grass turns its world position into a UV on that map; where bright,
      blades get shorter. As particles fade or shrink, the grass slowly springs back.
- [ ] Trace polish: edge check in `trace_col`; a `trace_strength` uniform; darken (or
      deliberately lighten) the trail; bend blades away from the path; make the ground blend
      use the height within the blade if pressed blades shouldn't turn soil-coloured; bring
      the SubViewport back down from 2048 (512–1024 is enough with soft footprints).

### Part 3: bringing it to life
- [x] **7. Wind:** a slow wave rolls across the field and only the tips sway, like brushed velvet.
      Polish left (BruteForce `BFGrass.shader:427–479`): a 2-channel noise (As Normal Map)
      so directions swirl; layered fast/slow sines; gusts darken the colour and thin the
      blades so the wind is visible; a painted test mesh using `COLOR.r`.
- [ ] **8. Light:** rim light on the tips; see how it reacts to Neo's night lighting. Right now
      every sheet is lit the same because all normals point straight up.
- [ ] **9. Distance fade and performance:** far sheets collapse to zero size, so a whole valley
      costs about as much as a flat floor. Profile it.
- [ ] **10. Polish:** grass masks (grass only where painted, bare paths), near-camera smoosh,
      maybe mowing.

### Later, in Neo
- [x] A C# `[Tool]` spawner that takes any ground mesh and builds the MultiMesh in code,
      setting both the instance count and the shader's `instance_count` from one number
      (needed because Godot has no geometry shaders).
- [ ] A wind node that drives the wind globals at runtime
      (`RenderingServer.GlobalShaderParameterSet`) for gusts and storms.
- [ ] The trace emitter follows the player; wiring it through rzeka and the player fairy can
      wait until it works here.

## Way of working

The user writes the shader; Claude explains the idea, asks one or two questions, gives hints
and reviews. The Unity reference comes out only after a piece has been tried.
