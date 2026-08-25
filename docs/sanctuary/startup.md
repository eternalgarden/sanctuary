
> This document describes how the sanctuary startup / initial load process works like.

- in godot everything begins with autoloads #confirm so they are loaded first before any other scene 
- then the starting scene is loaded – `Fillory.tscn`
	- **the order of nodes in fillory is very important**
	- because godot initializes those nodes in that order
- fillory's *last node* is the "*startup*" node
	- this node and its children will orchestrate the entire startup process
	- they load last because all the other weight-lifting components (like `SceneLoader` or `NoteDataFairy`) must be loaded and ready to process spells by that time
	- startup node self-disposes on completion

## godot's node load order

> See Godot notes on [Node](https://docs.godotengine.org/en/stable/classes/class_node.html#node).

From the docs:

- `EnterTree` 
	- from parent to the child 
- `Ready`
	- from child to parent

> 📐 Important! For the nodes that are attached to the same parent, their order follows the top->down order you have set for them in the editor.
> 
> This is worth noting especially when coming from Unity, where there were none guarantees abount the initialization order and when `Awake` and `Start` are getting called.
> 
> You can print node tree with `GetTreeStringPretty()`

Assume a scene tree:

```bash
 ┖╴root
    ┠╴node_1
    ┃  ┠╴node_1_1
    ┃  ┃  ┠╴node_1_1_1
    ┃  ┃  ┖╴node_1_1_2
    ┃  ┖╴node_1_2
    ┠╴node_2
    ┃  ┖╴node_2_1
    ┠╴node_4 # note node_4 is placed in editor above _3
    ┖╴node_3
```

For such tree you will get the following order of calls on `EnterTree` and `Ready`:

```bash
root entered tree! # root enters tree first
node_1 entered tree!
node_1_1 entered tree!
node_1_1_1 entered tree!
node_1_1_2 entered tree!
node_1_2 entered tree!
node_2 entered tree!
node_2_1 entered tree!
node_4 entered tree! # note node_4 before node_3
node_3 entered tree!
# all entered tree by now, ready notifications begin
node_1_1_1 ready!
node_1_1_2 ready!
node_1_1 ready!
node_1_2 ready!
node_1 ready!
node_2_1 ready!
node_2 ready!
node_4 ready! # note node_4 before node_3
node_3 ready!
root ready! # root readies last
```
## questions

- original startup process functioned like a *distributed reducer* over one god-record `[HasState] FilloryLoadState`
	- multiple looms reduced that state based on their conditions – now after rzeka rework this is impossible, because now only one source of a stateful matter is accepted.
