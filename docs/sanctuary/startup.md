
> This document describes how the sanctuary startup / initial load process works like.

- in godot everything begins with autoloads #confirm so they are loaded first before any other scene 
- then the starting scene is loaded, in case of sanctuary it is `Fillory.tscn`
	- the order of nodes in fillory is very important, because godot initializes those nodes in that order
