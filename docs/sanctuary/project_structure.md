# todo

- [ ] enforce rules with NetArchTest 

# filesystem

- addons
	- godot addons
- earth
	- *all external game art assets*:
		- levels (entire 3d scenes)
		- models (3d assets/packs)
		- sounds
		- textures
- fillory
	- *project programming and game wiring*
	- see [[#fillory]] below
- moon
	- assets (*first-party shared assets*)
		- levels
		- models
		- sounds
		- textures
	- shaders
	- tools
		- *python/bash scripts etc*.
	- vfx
		- notes:
			- textures: *don't put any vfx-related textures here, if they come from outside they need attribution and be placed in earth, otherwise if they were made for sanctuary then they go to `moon/assets/textures/vfx/...`*
			- scripts: you can put trivial C# scripts within those effects in `Sanctuary.Vfx.X` namespace, but as soon as they need access to `rzeka` they become a forest or a fairy and need to be moved to `fillory/`
		- example contents:
			- flickering_light
				- will contain godot-specific particle systems and scenes
			- ball_of_fire
- sandbox
	- *your research goes here, it is exampt from NatArchTest*
	- after you complete your work remove it from sandbox.
	- use `Sanctuary.Sandbox` namespace

# fillory

## directory structure

- common `Sanctuary.Common`
	- *references **no one*** 
	- example contents:
		- serializers `Sanctuary.Common.Serializers`
		- extensions `Sanctuary.Common.Extensions`
		- math `Sanctuary.Common.Math`
		- utility `Sanctuary.Common.Utility`
- editor `Sanctuary.Editor`
- forest `Sanctuary.Forest` (see [[#component structure]])
	- **allowed to reference**: `common, fairies and matter, never each other`
	- a forest is many independent things sharing a single environment, each component is a tree, they communicate through a shared root system which takes its nutrients from water, this is `rzeka`* 
	- example contents:
		- portals `Sanctuary.Forest.Portals
		- inventory `Sanctuary.Forest.Inventory`
		- post_processing `Sanctuary.Forest.PostProcessing`
		- welcoming_screen `Sanctuary.Forest.WelcomingScreen`
- fairies `Sanctuary.Fairies`
	- **allowed to reference**: `common, matter and other fairies' public interfaces - acyclically`. never `forest, never anyones .Internal`*
	- **fairy or forest?** 
		- rule of thumb: **exposes an interface? fairy spotted.**
		- a module is a `fairy` if it must expose a synchronously-queried interface that other modules depend on in runtime. 
		- an example is very densely accessed information like player position or raycasting because it would totally pollute rzeka otherwise.
		- this means a fairy is the only being that *can bypass rzeka*.
	- example contents:
		- data `Sanctuary.Fairies.Data`
			- exposing: `ILibraryFairy 
		- input `Sanctuary.Fairies.Input`
			- exposing: `IMovementInputFairy`
		- interaction `Sanctuary.Fairies.Interaction`
			- exposing: `IRaycasterFairy`
		- player `Sanctuary.Fairies.Player`
			- exposing: `IPlayerLocatorFairy`
- blood `Sanctuary.Blood`
	- subdirectories are flattened, rzeka's *matter* is the bloodsystem of the entire organism, hence *blood*
	- examples:
		- portals `Sanctuary.Blood.Portals`
		- data `Sanctuary.Blood.Data`
		- player `Sanctuary.Blood.Player`

## component structure

### 📜 Forest structure

- portals `Sanctuary.Forest.Portals
	- all scripts go here
		- you can put them in whatever subfolders make sense for you.
		- but!
		- if you have a temptation to add `internal/` subdirectory or use `Sanctuary.Forest.Portals.Internal` you should already spot some 🔥, because **every single forest is fully "internal"**, it only communicates with others through rzeka. only fairies bypass rzeka.
			- this rule might be only broken by `Common` in rare cases when something there becomes complicated enough to hide its own implementation.
	- `game/`
		- special, optional folder for all godot `game assets` related to this forest - scenes, materials etc., no actual art assets!

### 🧚🏻‍♀️ Fairy structure 

> On example of a *Player* fairy.

- player `Sanctuary.Fairies.Player`
	1. `public interfaces and enums used in those interfaces`
	2. `internal/` 
		- subdirectory (`Sanctuary.Fairies.Player.Internal`)
		- actual implementation of data fairy
	3. `game/`
		- like in forest


