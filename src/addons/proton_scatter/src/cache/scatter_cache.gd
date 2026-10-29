@tool
@icon("../../icons/cache.svg")
class_name ProtonScatterCache
extends Node

# ProtonScatterCacheNode
#
# Saves the transforms created by ProtonScatter nodes in an external resource
# and restore them when loading the scene.
#
# Use this node when you don't want to wait for scatter nodes to fully rebuild
# at start.
# You can also enable "Show output in tree" to get the same effect, but the
# cache makes it much more VCS friendly, and doesn't clutter your scene tree.

const DEFAULT_CACHE_FOLDER: String = "res://addons/proton_scatter/cache/"

const ProtonScatterTransformList: GDScript = preload("../common/transform_list.gd")


signal cache_restored
signal cache_load_threaded_finished


@export_file_path("*.res", "*.tres") var cache_file: String = "":
	set(val):
		cache_file = val
		if is_inside_tree():
			update_configuration_warnings()


## Determines whether the cache should be automatically updated when the scene is saved.
## If this is set to off, you will need to manually use the Update Cache button to ensure the
## cache is up-to-date.
@export var auto_rebuild_cache_when_saving: bool = true

@export_group("Debug", "dbg_")

## This parameter is primarily intended for debugging purposes, as saving/loading
## large cache files on the main thread will cause the editor to become unresponsive.
@export var dbg_disable_thread: bool = false

# The resource where transforms are actually stored
var _local_cache: ProtonScatterCacheResource
var _scene_root: Node
var _scatter_nodes: Dictionary # Key: ProtonScatter, Value: cached version
var _local_cache_changed: bool = false
var _save_thread: Thread = Thread.new()


func _ready() -> void:
	set_process(false)
	if not is_inside_tree():
		return

	_scene_root = _get_local_scene_root(self)

	# Check if cache_file is empty, indicating the default case
	if cache_file.is_empty():
		if Engine.is_editor_hint():
			# Ensure the cache folder exists
			_ensure_cache_folder_exists()
		else:
			printerr("ProtonScatter error: You loaded a ScatterCache node with an empty cache file attribute.
								ProtonScatter cannot set a default value outside of the editor.
								Please open the scene in the editor and set a default value.")
			return

		# Neo patch: the cache sits next to its scene as <scene>.scatter_cache.res, a name
		# .gitignore matches (caches are rebuilt from the scene, see restore_cache)
		var scene_path: String = _scene_root.get_scene_file_path()
		if scene_path.is_empty():
			cache_file = DEFAULT_CACHE_FOLDER.path_join(str(randi()) + ".scatter_cache.res")
		else:
			cache_file = scene_path.get_basename() + ".scatter_cache.res"
		return

	restore_cache()


## Process will only run when there is something to load in a thread, otherwise it's disabled.
func _process(_delta: float) -> void:
	match ResourceLoader.load_threaded_get_status(cache_file):
		ResourceLoader.ThreadLoadStatus.THREAD_LOAD_IN_PROGRESS:
			return
		ResourceLoader.ThreadLoadStatus.THREAD_LOAD_INVALID_RESOURCE, \
		ResourceLoader.ThreadLoadStatus.THREAD_LOAD_FAILED, \
		ResourceLoader.ThreadLoadStatus.THREAD_LOAD_LOADED:
			set_process(false)
			cache_load_threaded_finished.emit()


func _get_configuration_warnings() -> PackedStringArray:
	var warnings: PackedStringArray = PackedStringArray()
	if cache_file.is_empty():
		warnings.push_back("No path set for the cache file. Select where to store the cache in the inspector.")

	if not can_process():
		warnings.push_back("Process mode is disabled. Threaded loading will not work.")

	return warnings


func _notification(what: int) -> void:
	if what == NOTIFICATION_EDITOR_PRE_SAVE and auto_rebuild_cache_when_saving:
		update_cache()


func clear_cache() -> void:
	_scatter_nodes.clear()
	_local_cache.clear()

	if dbg_disable_thread:
		save_cache()
	else:
		if !_save_thread.is_alive():
			if _save_thread.is_started():
				_save_thread.wait_to_finish()
			_save_thread.start(save_cache)


func update_cache() -> void:
	if cache_file.is_empty():
		printerr("Cache file path is empty.")
		return

	_purge_outdated_nodes()
	_discover_scatter_nodes(_scene_root)

	if not _local_cache:
		_local_cache = ProtonScatterCacheResource.new()

	for s: ProtonScatter in _scatter_nodes:
		# Ignore this node if its cache is already up to date
		var cached_version: int = _scatter_nodes[s]
		if s.build_version == cached_version:
			continue

		# If transforms are not available, try to rebuild once.
		if not s.transforms:
			s.rebuild.call_deferred()
			await s.build_completed

		if not s.transforms:
			continue # Move on to the next if still no results.

		# Store the transforms in the cache.
		_local_cache.store(_scene_root.get_path_to(s), s.transforms.list)
		_scatter_nodes[s] = s.build_version
		_local_cache_changed = true

	# Only save the cache on disk if there's something new to save
	if not _local_cache_changed:
		return

	if dbg_disable_thread:
		save_cache()
	else:
		if !_save_thread.is_alive():
			if _save_thread.is_started():
				_save_thread.wait_to_finish()
			_save_thread.start(save_cache)

	_local_cache_changed = false


func restore_cache() -> void:
	# Neo patch: cache files are git-ignored, so a fresh clone has none; rebuild the scatters
	# instead of leaving them empty (and in the editor, write the cache again)
	if not ResourceLoader.exists(cache_file):
		print("ProtonScatter: no cache at ", cache_file, ", rebuilding the scatters")
		_scatter_nodes.clear()
		_discover_scatter_nodes(_scene_root)
		await _rebuild_in_dependency_order(_get_cached_scatter_nodes())
		return

	if is_inside_tree():
		if dbg_disable_thread:
			_load_cache()
		else:
			await _load_cache_threaded()
	else:
		_local_cache = load(cache_file)

	_scatter_nodes.clear()
	_discover_scatter_nodes(_scene_root)

	if not _local_cache:
		printerr("Could not load cache: ", cache_file)
		await _rebuild_in_dependency_order(_get_cached_scatter_nodes()) # Neo patch
		return

	var missing: Array[ProtonScatter] = [] # Neo patch: scatters the cache has no entry for

	for s: ProtonScatter in _scatter_nodes:
		if s.force_rebuild_on_load:
			continue # Ignore the cache if the scatter node is about to rebuild anyway.

		if not _local_cache.data.has(String(_scene_root.get_path_to(s))):
			missing.push_back(s)
			continue

		# Send the cached transforms to the scatter node.
		var transforms: ProtonScatterTransformList = ProtonScatterTransformList.new()
		transforms.list = _local_cache.get_transforms(_scene_root.get_path_to(s))
		s._perform_sanity_check()
		s._on_transforms_ready(transforms)
		s.build_version = 0
		_scatter_nodes[s] = 0

	cache_restored.emit()

	if not missing.is_empty():
		await _rebuild_in_dependency_order(missing)


## Neo patch: rebuilds every scatter this cache stores and saves a fresh cache
## (used by res://moon/tools/rebuild_scatter_caches.gd).
func rebuild_all() -> void:
	_scatter_nodes.clear()
	_discover_scatter_nodes(_scene_root)
	_local_cache = ProtonScatterCacheResource.new()
	await _rebuild_in_dependency_order(_get_cached_scatter_nodes())


# Neo patch: the scatters that load from the cache instead of rebuilding on their own
func _get_cached_scatter_nodes() -> Array[ProtonScatter]:
	var nodes: Array[ProtonScatter] = []
	for s: ProtonScatter in _scatter_nodes:
		if not s.force_rebuild_on_load:
			nodes.push_back(s)
	return nodes


# Neo patch: rebuild one scatter at a time, each after its scatter_parent (trees before
# undergrowth), since the scatter_parent signal chain is not connected at scene load
func _rebuild_in_dependency_order(nodes: Array[ProtonScatter]) -> void:
	if nodes.is_empty():
		return

	# let every scatter finish _ready and the colliders reach the physics space first
	await get_tree().process_frame
	await get_tree().physics_frame
	await get_tree().physics_frame

	var pending: Array[ProtonScatter] = nodes.duplicate()
	while not pending.is_empty():
		var next: ProtonScatter = pending[0]
		for s: ProtonScatter in pending:
			var parent: Node = null
			if not s.scatter_parent.is_empty():
				parent = s.get_node_or_null(s.scatter_parent)
			if parent not in pending:
				next = s
				break
		pending.erase(next)
		await _rebuild_and_wait(next)

	if Engine.is_editor_hint():
		update_cache()


func _rebuild_and_wait(s: ProtonScatter) -> void:
	var done: Array[bool] = [false]
	var on_done := func() -> void: done[0] = true
	s.build_completed.connect(on_done, CONNECT_ONE_SHOT)
	s.rebuild()

	# a scatter with no items or shapes aborts without build_completed, so don't wait forever
	var start: int = Time.get_ticks_msec()
	while not done[0] and Time.get_ticks_msec() - start < 30000:
		await get_tree().process_frame

	if s.build_completed.is_connected(on_done):
		s.build_completed.disconnect(on_done)


func enable_for_all_nodes() -> void:
	_purge_outdated_nodes()
	_discover_scatter_nodes(_scene_root)
	for s: ProtonScatter in _scatter_nodes:
		s.force_rebuild_on_load = false


# If the node comes from an instantiated scene, returns the root of that
# instance. Returns the tree root node otherwise.
func _get_local_scene_root(node: Node) -> Node:
	if not node.scene_file_path.is_empty():
		return node

	var parent: Node = node.get_parent()
	if not parent:
		return node

	return _get_local_scene_root(parent)


func _discover_scatter_nodes(node: Node) -> void:
	if node is ProtonScatter and not _scatter_nodes.has(node):
		_scatter_nodes[node] = -1

	for c: Node in node.get_children():
		_discover_scatter_nodes(c)


func _purge_outdated_nodes() -> void:
	var nodes_to_remove: Array[ProtonScatter] = []
	for node: ProtonScatter in _scatter_nodes:
		if not is_instance_valid(node):
			nodes_to_remove.push_back(node)
			_local_cache.erase(_scene_root.get_path_to(node))
			_local_cache_changed = true

	for node: ProtonScatter in nodes_to_remove:
		_scatter_nodes.erase(node)


func _ensure_cache_folder_exists() -> void:
	if not DirAccess.dir_exists_absolute(DEFAULT_CACHE_FOLDER):
		DirAccess.make_dir_recursive_absolute(DEFAULT_CACHE_FOLDER)


func _load_cache() -> void:
	_local_cache = ResourceLoader.load(cache_file)


func _load_cache_threaded() -> void:
	if cache_file.is_empty():
		printerr("Cache file path is empty.")
		return
	ResourceLoader.load_threaded_request(cache_file)
	set_process(true)
	await cache_load_threaded_finished
	_local_cache = ResourceLoader.load_threaded_get(cache_file)


func save_cache() -> void:
	var err: Error = ResourceSaver.save(_local_cache, ResourceUID.ensure_path(cache_file))
	if err != OK:
		printerr("ProtonScatter error: Failed to save the cache file. Code: ", err)


func _exit_tree() -> void:
	if _save_thread.is_started():
		_save_thread.wait_to_finish()
