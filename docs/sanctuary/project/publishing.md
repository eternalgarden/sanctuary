
# itch.io

> Daily use publishing commands.

```bash

# current sanctuary channels are:
# linux
# windows
# mac
butler push ~/path/to/new/build/ eternalgarden/sanctuary:linux --userversion 1.9.2.lakedragon

```

> [Butler](https://itch.io/docs/butler/) explanation.

- command structure:
	- `butler push directory user/game:channel --userversion 1.8.0.coreprincess`
		- `.zip` can be used instead of a dir
		- 🌟 **but it is preferrable to use a directory**
		- because it allows butlers patching system to work efficiently
		- only changed files are uploaded then
		- the name of the targetted directory here *does NOT matter*
	- user: `eternalgarden`
	- game: `sanctuary`
	- channel: *slot you're uploading it to*, for example: 
		- `windows-beta`, `osx-bonus`, `linux-universal`, or `soundtrack`
		- channel names will *determine the initial set of tags of a slot*, but you can always fix them later
		- currently using only: `linux/windows/mac`
- `butler push ~/path/to/build/sanctuary/ eternalgarden/sanctuary:linux --userversion 1.9.2.lakedragon`
	- [ ] make a tiny script to automate this, simply insert linux/windows/mac on a droplist 1/2/3, ask for a version, ask for target directory with path filling, preview command before sending, potentially in future extend with beta channels
		- but this will reopen the problem of having a mac developer 100$/year signature since only itch app handles this for us automatically

## custom launcher

- We could actually build a custom Sanctuary launcher using itch / butler's auto update system under the hood!
- https://itch.io/docs/butler/launcher-integration.html
- for typescript: https://github.com/itchio/node-butlerd
