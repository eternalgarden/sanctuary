@tool
extends EditorScript

## Rebuilds every ProtonScatter cache in the project.
##
## Cache files (*.scatter_cache.res) are git-ignored: a scene whose cache is missing rebuilds
## its scatters on load and, in the editor, writes the cache again (a Neo patch in
## addons/proton_scatter/src/cache/scatter_cache.gd). Run this to refresh all of them at once,
## e.g. after a fresh clone, after changing scatter assets, or before an export.
##
## Usage: open this file in the script editor, then File > Run (Ctrl+Shift+X).
## Each scene that has a ProtonScatterCache node is opened in turn and rebuilt; progress goes
## to the Output panel. Save any unsaved scenes first, as the editor switches between tabs.

const SCENE_ROOT := "res://"
const SKIPPED_DIRS := ["res://addons", "res://.godot"]


func _run() -> void:
	var scenes := PackedStringArray()
	_collect_scenes(SCENE_ROOT, scenes)
	if scenes.is_empty():
		print("Rebuild scatter caches: no scene has a ProtonScatterCache node")
		return

	# The editor keeps only the current scene in the tree, so the scenes have to be rebuilt one
	# after another. A node parented to the editor UI outlives this script and does the waiting.
	var runner := Runner.new()
	runner.scenes = scenes
	EditorInterface.get_base_control().add_child(runner)


func _collect_scenes(dir_path: String, out: PackedStringArray) -> void:
	if dir_path in SKIPPED_DIRS:
		return
	for file in DirAccess.get_files_at(dir_path):
		if file.get_extension() != "tscn":
			continue
		var path := dir_path.path_join(file)
		if FileAccess.get_file_as_string(path).contains("proton_scatter/src/cache/scatter_cache.gd"):
			out.push_back(path)
	for sub in DirAccess.get_directories_at(dir_path):
		_collect_scenes(dir_path.path_join(sub), out)


class Runner extends Node:
	var scenes: PackedStringArray

	func _ready() -> void:
		_rebuild_all.call_deferred()

	func _rebuild_all() -> void:
		var start_root := EditorInterface.get_edited_scene_root()
		var start_scene := start_root.scene_file_path if start_root else ""

		for scene_path in scenes:
			print("Rebuild scatter caches: ", scene_path)
			EditorInterface.open_scene_from_path(scene_path)
			# give a freshly opened scene time to restore its old cache before rebuilding over it
			await _wait_frames(30)

			var root := EditorInterface.get_edited_scene_root()
			if not root or root.scene_file_path != scene_path:
				push_warning("Rebuild scatter caches: could not open " + scene_path)
				continue

			for cache in root.find_children("*", "Node", true, false):
				if not cache is ProtonScatterCache:
					continue
				var started := int(Time.get_unix_time_from_system())
				await cache.rebuild_all()
				await _wait_for_save(cache.cache_file, started)

		if not start_scene.is_empty():
			EditorInterface.open_scene_from_path(start_scene)
		print("Rebuild scatter caches: done, %d scenes" % scenes.size())
		queue_free()

	func _wait_frames(count: int) -> void:
		for _i in count:
			await get_tree().process_frame

	# the cache saves on a thread; wait until the file on disk is newer than the rebuild
	func _wait_for_save(cache_file: String, started: int) -> void:
		var path := ResourceUID.ensure_path(cache_file)
		var deadline := Time.get_ticks_msec() + 60000
		while Time.get_ticks_msec() < deadline:
			if FileAccess.file_exists(path) and FileAccess.get_modified_time(path) >= started:
				print("  saved ", path)
				return
			await get_tree().process_frame
		push_warning("Rebuild scatter caches: no fresh cache written at " + path)
