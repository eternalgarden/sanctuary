# Zenject → Neo DI: migration primer

> For porting Source code (Unity + Zenject) into Neo (Godot + Microsoft DI with a thin layer of
> our own). Operational: "you see X in Source, write Y in Neo". The *why* behind each choice
> lives in `src/sandbox/research_injection/neo_di_notes.md`.
>
> **Location:** the layer currently lives in `src/sandbox/research_injection/injection/`
> (`Sanctuary.Sandbox.Injection`), with a runnable demo beside it. It will graduate to
> `fillory/common/injection` (`Sanctuary.Common.Injection`); update the paths here when it does.

## The model in six lines

1. Every scene that needs injection has an **`Installer`** as its root node, owning one
   **`Scope`** = one Microsoft `ServiceProvider` (the "container").
2. Plain classes take their dependencies through **constructors**. No `[Inject]`, no fields.
3. Nodes are made by Godot, so installers **register** them (`[Export]` → `AddSingleton(node)`).
4. Nothing is built until resolved. **Classes that act on their own** are entry points
   (`AddInitializable`); everything else is built when something needs it.
5. Disposal is **automatic** for everything the container built; `Dispose()` must be idempotent.
6. Spawned scenes come from a **`SceneFactory`**; the creator keeps the **`Spawned`** handle
   and owns the scene's end.

## Translation table

### Installers and contexts

| Source (Zenject) | Neo |
|---|---|
| `MonoInstaller` + `GameObjectContext` on a prefab | `Installer` subclass as the scene's root script |
| `SceneContext` / `ProjectContext` | Root installer (later: Ursprung's root scope) |
| `InstallBindings()` | `Install(IServiceCollection services, IServiceProvider parent)` |
| Subcontainer seeing its parent's bindings | Nothing is inherited: `services.Import<T>(parent)` each thing, listed at the top of `Install` |
| `[Inject] Guid _note;` on a prefab's installer (per-instance data) | `factory.Create(s => s.AddSingleton(new NoteId(guid)))` + `SpawnOnly => true` |
| `DiContainer` injected anywhere | Never. Only the injection layer touches the provider |

### Bindings

| Source (Zenject) | Neo |
|---|---|
| `Bind<T>().FromNew().AsSingle()` | `AddSingleton<T>()` |
| `Bind<I>().To<T>().AsSingle()` | `AddSingleton<I, T>()` |
| `BindInterfacesAndSelfTo<T>().AsSingle()` | Look at **why** ("AndSelf" was mostly habit, 100 uses vs 1 `BindInterfacesTo`): only lifecycle interfaces (`IInitializable`, `IDisposable`, `ITickable`) → `AddInitializable<T>()` / `AddSingleton<T>()`. Others depend on its interfaces → `AddInterfaces<T>()`. Others need the concrete class too → `AddSelfAndInterfaces<T>()` (rare) |
| `BindInterfacesTo<T>().AsSingle()` | `AddInterfaces<T>()`: only the interfaces are resolvable; asking for `T` fails validation |
| `… .NonLazy()` on an `IInitializable` | `AddInitializable<T>()`, or `AddInterfaces<T>()` when others depend on its interfaces (both add the start-up entry) |
| `… .NonLazy()` on a class that is **not** `IInitializable` | Make it one: move its start-up out of the constructor into `Initialize()`. Eager-but-not-initializable is deliberately unsupported |
| `BindInstance(x)` / `FromInstance(x)` | `AddSingleton(x)` |
| `BindInterfacesAndSelfTo<T>().FromInstance(node)` | `AddSingleton(node)`, plus `AddSingleton<I>(node)` per interface something asks for |
| `Bind<T>().WithId(ID)…` + `[Inject(Id = ID)] T x` | `AddKeyedSingleton(Key.X, …)` + `[FromKeyedServices(Key.X)] T x`, with an **enum** key |
| `BindInstance(20f).WithId(SPEED)` (value + id) | A named record: `AddSingleton(new MovementSpeed(20f))`. Instances must be reference types anyway |
| `… .WithArguments(x)` | A factory lambda `AddSingleton(sp => new T(sp.GetRequiredService<A>(), x))`, or wrap `x` in a record and keep a type registration |
| `Bind<Transform>().FromComponentOnRoot()` | `[Export]` the node and register it. Don't register the installer itself for gameplay |
| `FromNewComponentOn(go)` | Add the node to the scene in the editor, `[Export]` it, register it |
| `AsTransient()` | `AddTransient<T>()`, but avoid it for disposables: the provider holds every one until it dies |
| `BindExecutionOrder<T>(n)` | Registration order. `Start()` initializes in the order registered |
| `WhenInjectedInto<T>()` | Unsupported. Use keys, or give the consumer its own scope |
| Signals, memory pools, `CopyIntoAllSubContainers` | Unused in Source; nothing to port |

### Factories and subcontainers

| Source (Zenject) | Neo |
|---|---|
| `BindFactory<Guid, Scroll, Scroll.Factory>().FromSubContainerResolve().ByNewContextPrefab<ScrollMonoInstaller>(prefab).UnderTransform(parent)` | `AddSingleton(sp => new SceneFactory<Scroll>(ScrollScene, ScrollsParent, sp))` |
| `class Factory : PlaceholderFactory<Guid, Scroll>` nested in the facade | Delete it. `SceneFactory<TFacade>` is generic; per-instance data goes in `Create(extra)` |
| `scrollFactory.Create(guid)` returning the facade | `Spawned<Scroll> s = scrolls.Create(x => x.AddSingleton(new NoteId(guid)))`; keep `s`, use `s.Facade` |
| `FromSubContainerResolve().ByMethod(Install)` (Realm, ScrollEditor browser, GBob) | Not designed yet. Likely a child scene with its own `Installer`. Decide on the first real case and add a recipe here |

### Lifecycle interfaces

| Source (Zenject) | Neo |
|---|---|
| `Zenject.IInitializable` | `Sanctuary…Injection.IInitializable` (same shape: `void Initialize()`) |
| `IDisposable` (bound via `BindInterfaces…`) | `IDisposable`, disposed automatically whatever it was registered as. Must be idempotent |
| `ITickable` / `ILateTickable` / `IFixedTickable` | A node's `_Process` / `_PhysicsProcess`. The plain class takes that node, or the node raises a C# event the class subscribes to in `Initialize()` |
| `[Inject]` method/field on a MonoBehaviour | See recipe C |
| `Object.Destroy(gameObject)` from inside a context | See recipe E |

## Behaviour differences that silently bite

1. **Lazy by default.** A class that acts on its own but is registered with plain
   `AddSingleton` is never built if nothing depends on it. No error; it just never runs. Every
   `.NonLazy()` in Source needs an entry point in Neo.
2. **Disposal follows the object, not the binding.** Zenject disposed only what was bound as
   `IDisposable`; Microsoft disposes everything it built that implements it. And never what it
   was handed: registered nodes and imports are not disposed by the scope.
3. **Multiple `Dispose()` calls.** One per resolved registration exposing the object, so
   `AddInterfaces` / `AddSelfAndInterfaces` can dispose twice. Rzeka subscriptions in `CollectibleDisposable Q`
   are fine; other cleanup goes behind `if (_disposed) return; _disposed = true;`.
4. **No parent fallback.** A child scope sees nothing from its parent unless imported.
   `ValidateOnBuild` names the missing type the moment the scope is built.
5. **Duplicates don't throw.** Zenject threw on ambiguous single resolves; Microsoft takes the
   **last** registration. Two unkeyed registrations of one type silently collapse into one.
6. **Keyed and unkeyed are separate.** A plain `Node3D` parameter never finds a keyed `Node3D`.
7. **No value-type instances.** `AddSingleton(20f)` does not compile. Wrap values in records,
   which also replaces most `WithId` on primitives.
8. **One constructor.** Microsoft picks the greediest satisfiable constructor and throws on
   ties; there is no `[Inject]` to choose one. Keep exactly one public constructor.
9. **Initialize timing.** Zenject's kernel initialized on `Start()`, after every `Awake`. Neo
   starts a scope after its nodes are in the tree and ready (`_Ready` for placed installers,
   right after `AddChild` for spawned ones), so `Initialize()` may touch nodes.

## Recipes

### A. Plain class with constructor injection (most of Source)

Usually nothing changes in the class except namespaces and Unity types. Port the binding,
deciding what the `BindInterfacesAndSelfTo` was for:

```csharp
// Source
Container.BindInterfacesAndSelfTo<ScrollReplanter>().FromNew().AsSingle().NonLazy();

// Neo: ScrollReplanter : IInitializable, IDisposable — only lifecycle interfaces
services.AddInitializable<ScrollReplanter>();

// Neo: a class others use through an interface (e.g. Heartbeat : IHeartbeat, IInitializable)
services.AddInterfaces<Heartbeat>();               // resolvable only as IHeartbeat
```

If the constructor does work (subscribes, touches nodes), move that into `Initialize()`; the
constructor only stores dependencies.

### B. Prefab subcontainer → spawned scene

Source: `ScrollSpawnerInstaller` binds the factory, `ScrollMonoInstaller` binds the prefab's
contents with `[Inject] Guid _note`, ids for front/back meshes, and the `Scroll` facade.

```csharp
// spawner's scope (ScrollSpawnerInstaller → its Neo installer)
services.AddSingleton(sp => new SceneFactory<Scroll>(ScrollScene, ScrollsParent, sp));
services.AddInitializable<ScrollSpawner>();     // : IDisposable only; its start-up moves into Initialize()

// scroll.tscn root (ScrollMonoInstaller → ScrollInstaller)
public partial class ScrollInstaller : Installer
{
    [Export] MeshInstance3D FrontMesh { get; set; }
    [Export] MeshInstance3D BackMesh { get; set; }

    protected override bool SpawnOnly => true;       // NoteId only comes from the factory

    protected override void Install(IServiceCollection services, IServiceProvider parent)
    {
        services.Import<IRzeka>(parent);              // everything from outside, listed here

        services.AddKeyedSingleton(ScrollSide.Front, FrontMesh);   // was WithId(FRONT_…)
        services.AddKeyedSingleton(ScrollSide.Back, BackMesh);

        services.AddInitializable<ScrollReplanter>();
        services.AddSingleton<Scroll>();              // the facade
    }
}

// ScrollSpawner (was: ScrollFactory.Create(guid))
Spawned<Scroll> scroll = scrolls.Create(s => s.AddSingleton(new NoteId(guid)));
```

The raw `Guid` becomes `NoteId`: per-instance values always get a named record.

Demo: `demo/DemoScrollInstaller.cs`, `demo/DemoSpawner.cs`.

### C. MonoBehaviour with `[Inject]`

Source (`ActorPositioner`): a component placed in the scene, `[Inject] Init(IRzeka rzeka)`,
called from a timeline. In order of preference:

1. **Split it.** The node keeps the engine-facing part (exports, signals, the method the
   timeline calls) and raises a C# event. A plain class takes the node and `IRzeka`, subscribes
   in `Initialize()`, does the logic. The installer registers the node and
   `AddInitializable<ActorPositioning>()`.
2. **Pass it in from a plain class** that already has the dependency and the node:
   `node.Setup(rzeka)` in its `Initialize()`. Fine for small nodes.
3. **Last resort:** `this.Resolve<IRzeka>()` in the node's `_Ready` (nearest installer above).
   Keep these rare; they are service-locator calls.

Demo of 3: `demo/DemoScrollBadge.cs`.

### D. Ids on values

Source (`SplineLoopInstaller`):

```csharp
Container.BindInstance(_characterMovementSpeed).WithId(FriendsGlobals.CHARACTER_MOVEMENT_SPEED_ID);
// consumer: [Inject(Id = FriendsGlobals.CHARACTER_MOVEMENT_SPEED_ID)] float movementSpeed
```

Neo:

```csharp
public sealed record CharacterMovementSpeed(float Value);

services.AddSingleton(new CharacterMovementSpeed(MovementSpeed));   // MovementSpeed is an [Export]
// consumer: SplineLooper(CharacterMovementSpeed speed, …)
```

Use keys for several **nodes/objects of one type** (front/back mesh, two cameras); use records
for **values**.

### E. A context destroying itself

Source: `ScrollDestroyState` calls `Object.Destroy(gameObject)`, and `ScrollSpawner` sometimes
discards the scroll `Create` returned. In Neo, decide who owns the end:

- **Someone holds the `Spawned` handle** (e.g. the scroll forest keeps them by `NoteId`): the
  scene never ends itself. It publishes matter (`ScrollDestroyRequested(NoteId)`), and the owner
  disposes the handle and does its bookkeeping.
- **Nobody holds it** (fire and forget): a plain class in the scene's scope takes
  `SceneLifetime` and calls `End()`. Never inject the installer for this.
- A node frees only itself or what it created; never its ancestors or siblings.

Demo: `demo/SparkFuse.cs` (ends itself), `DemoSpawner` (owner disposes the handle).

## Checklist per ported system

- [ ] Installer is the scene's root script; `Install` starts with every `Import<T>(parent)`.
- [ ] Spawn-only scenes set `SpawnOnly => true`.
- [ ] Every `.NonLazy()` became an entry point; no start-up work left in constructors.
- [ ] Every `BindInterfacesAndSelfTo` was triaged: lifecycle only → `AddInitializable`/`AddSingleton`,
      interfaces → `AddInterfaces`, concrete too → `AddSelfAndInterfaces`.
- [ ] Each class has one public constructor; no `[Inject]`, no `DiContainer`.
- [ ] Nodes are `[Export]`ed and registered; `Resolve<T>()` only where recipe C allows.
- [ ] `WithId` → enum keys (objects) or records (values); no bare `Guid`/`float`/`string`.
- [ ] No duplicate unkeyed registrations of one type.
- [ ] Every `Dispose()` is idempotent; rzeka subscriptions live in `Q`.
- [ ] Spawned scenes have a clear owner (handle) or end themselves via `SceneLifetime`.
- [ ] Tickables became `_Process` on a node.
- [ ] Forest/fairy boundaries still hold (see `docs/sanctuary/project/project_structure.md`):
      a forest's scope imports only `IRzeka` and fairy interfaces from its parent.
