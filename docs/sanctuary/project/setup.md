# setting up

## 1. init

- clone the repository
- `cd` into repository
- run `dotnet restore`

## 2. dependencies

- run the `moon/tools/fetch_godot_cef.sh` script
	- this will download godot-cef binaries (for browser-rendered UI) which are very heavy and make no sense to be tracked by the project itself

## 3. browser ui

- go to the `ui/` directory
- run `npm run build`
- development note:
	- use `npm run dev` instead while you are developing ui
	- this will give you live ui reload *while ingame*!
	- [ ] extract

## 4. godot editor settings

- indentation settings
	- the idea is you probably won't use godots text editor apart from some minor tweaks and to ensure it doesn't ruin files indentation on your save there
	- `Text Editor » Behavior`
		- `» Indent`
			- Type: `spaces`
			- Size: `4`
		- `» Files`
			- Turn off: `Convert Indent on Save`

# updating

> *Updating any NET nuget package to a newer version*. (including rzeka)
- `dotnet package update <package_names>`


> *Updating godot_cef*
- edit the `moon/tools/fetch_godot_cef.sh` script first
- set the target version in variable `VERSION="v1.15.3"`
- run `gh api repos/dsh0416/godot-cef/releases/tags/<VERSION> -q '.assets[].digest'` and put the new SHA in the the script
		- same as with `VERSION`
- run the script with `--force` flag