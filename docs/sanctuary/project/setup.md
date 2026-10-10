# setting up

- clone the repository
- `cd` into repository
- run `dotnet restore`
- run the `moon/tools/fetch_godot_cef.sh` script
	- this will download godot-cef binaries (for browser-rendered UI) which are very heavy and make no sense to be tracked by the project itself

# updating

> *Updating any NET nuget package to a newer version*. (including rzeka)
- `dotnet package update <package_names>`


> *Updating godot_cef*
- edit the `moon/tools/fetch_godot_cef.sh` script first
- set the target version in variable `VERSION="v1.15.3"`
- run `gh api repos/dsh0416/godot-cef/releases/tags/<VERSION> -q '.assets[].digest'` and put the new SHA in the the script
- run the script with `--force` flag