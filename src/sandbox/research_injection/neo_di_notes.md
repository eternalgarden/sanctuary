# Neo DI — working notes

> Temporary. Collects what shaped Neo's dependency injection while it lives in
> `sandbox/research_injection`. Fold the lasting parts into `docs/` when the module graduates
> to `fillory/common/injection` (`Sanctuary.Common.Injection`), then delete this.

## Decisions so far

- **Container:** `Microsoft.Extensions.DependencyInjection`, extended by a thin layer of our own.
- **Not AutoInject (Chickensoft):** its Introspection source generator puts `[Meta]` and a
  `_Notification` override into every node script. That enmeshment would be hard to phase out,
  and it only solves the smaller half of what Source needed (see the survey).
- **No source generators, no field injection.** Plain classes take constructor parameters;
  nodes are registered into scopes by installers. Only a few nodes ever call `Resolve<T>()`.
- **Guard rail (once NetArchTest is in):** only installers and the injection module may
  reference `Microsoft.Extensions.DependencyInjection`. Swapping the container later would
  then touch installers only.

## What Source used from Zenject (survey of `Assets/Fillory`)

167 files touch Zenject. What they actually rely on:

| Feature | Count | Used for |
|---|---|---|
| Constructor injection of plain classes (`FromNew`/`AsSingle`) | ~114 bindings | The dominant pattern. `IRzeka` was constructor-injected in 105 files, bound once in `WellspringInstaller` |
| `IInitializable` / `IDisposable` on container-built classes | 82 / 114 | Start/stop phases; `NonLazy()` (58) forced creation |
| `BindInstance` / `FromInstance` | 35 / 68 | Installers registering their prefab's `[SerializeField]` components |
| `WithId` / `[Inject(Id=…)]` | 39 / 70 | Telling same-typed instances apart: front/back mesh, main/scroll camera, player transforms |
| Per-instance subcontainers (`BindFactory` + `ByNewContextPrefab`) | 2 | Scroll and postal dragon |
| Method subcontainers (`FromSubContainerResolve().ByMethod`) | 3 | Private browser for Realm, ScrollEditor, GBob |
| `[Inject]` on MonoBehaviours | 26 files | The minority |
| `ITickable`, factories, `BindExecutionOrder` | 6, 3, 2 | Rare |
| Signals, memory pools, `CopyIntoAllSubContainers` | 0 | Unused |

`Initialize()` was never called by Source's own code (two manual exceptions in
`TheWellspring` and `WelcomingScreenProvider`). Zenject's `MonoKernel.Start()` →
`InitializableManager.Initialize()` sorted by `BindExecutionOrder` and called them, per context.

### Two kinds of "injection"

- **The container creates the object** (constructor injection): dependencies pushed in at
  birth, the class has no trace of DI. Most of Source, and the goal for Neo.
- **Someone else created it** (Unity/Godot instancing a scene): dependencies arrive late,
  either the container reaches in (Zenject `[Inject]` fields) or the object reaches out
  (walk up the tree, AutoInject style; closer to a scoped service locator). Kept rare in Neo.

### Initialize: two different things

- On **nodes** it is the constructor substitute: Godot calls the parameterless constructor and
  sets `[Export]`s afterwards, same as Unity. Use `_Ready` or an explicit setup method.
- On **plain classes** it is a timing tool: the constructor only stores dependencies,
  `Initialize()` starts acting (subscribe to rzeka, touch nodes) once the whole scope exists and
  its nodes are in the tree.

| | Plain classes | Nodes |
|---|---|---|
| Constructor | Store dependencies only | Nothing (parameterless) |
| Start acting | `Initialize()`, called by the scope | `_Ready` / explicit setup |
| Clean up | `Dispose()`, called when the scope is disposed | `_ExitTree` |

## Microsoft DI concepts to know

1. **Two phases.** `IServiceCollection` is a mutable recipe; `BuildServiceProvider()` freezes it
   into an `IServiceProvider`. Nothing can be added after building, which is why every scroll
   gets a new container instead of extra bindings in its parent's.
2. **Three registration forms.** Type (`AddSingleton<T>()`, container constructs), instance
   (`AddSingleton(obj)`, you construct), factory (`AddSingleton(sp => …)`, your lambda constructs).
3. **Lifetimes.** `Singleton` (one per container, created lazily on first resolve), `Transient`
   (new each time), `Scoped` (one per `CreateScope()`). Microsoft's scopes share registrations
   and suit web requests; they are **not** our `Scope`, which is a whole container. We use
   singletons almost exclusively.
4. **Constructors only.** The greediest satisfiable constructor wins, ties throw. No `[Inject]`,
   no field or property injection.
5. **Resolving.** `GetRequiredService<T>()` (throws, use this), `GetService<T>()` (null),
   `GetServices<T>()` (all, in registration order). For a single resolve the last registration wins.
6. **Ownership.** Disposing a provider disposes what it **created** (type and factory
   registrations), newest first, and never what it was **handed** (instances).
   - It does not walk the frozen collection: it keeps a list of every disposable it builds
     and disposes that list. Singletons are built on first resolve, so a registration nothing
     ever resolved was never built and is never disposed.
   - Newest first, because later objects may depend on earlier ones.
   - A service that implements only `IAsyncDisposable` makes the synchronous `Dispose()` throw.
     Give such classes a plain `IDisposable` too.
   - Factory results count as created: `AddSingleton(_ => parent.Get…)` would dispose the
     parent's object. Hence `Import` resolves eagerly and registers an instance.
   - Forwarded registrations dispose again: one `Dispose` per resolved registration exposing the
     object. `IDisposable` requires repeated calls to be harmless; `CollectibleDisposable` is.
   - Disposable transients are held until the provider dies. Avoid them.
7. **Keyed services** (.NET 8). `AddKeyedSingleton(key, …)` + `[FromKeyedServices(key)]` on a
   constructor parameter. Replaces `WithId`; enum keys read best.
8. **Validation.** `ValidateOnBuild` checks every constructor is satisfiable while building, so a
   missing `Import` fails with the type named. It cannot see inside factory lambdas.
   `ValidateScopes` catches singletons capturing scoped services.

## The Neo layer (`injection/`)

| Part | Role | Zenject counterpart |
|---|---|---|
| `IInitializable` | Start-acting phase for plain classes | `IInitializable` |
| `Scope` | One validated container; `Start()` initializes in registration order; `Dispose()` | Context + kernel |
| `AddInitializable<T>()` | Singleton started by the scope | `Bind().AsSingle().NonLazy()` |
| `AddSelfAndInterfaces<T>()` | One singleton reachable as itself and its interfaces | `BindInterfacesAndSelfTo<T>()` |
| `Import<T>(parent)` | Bring a parent's service in as an instance | Subcontainer seeing its parent |
| `Installer` (node) | Scene root owning a scope; `[Export]`s its nodes and registers them | `MonoInstaller` + `GameObjectContext` |
| `SceneFactory<TFacade>` | Instantiate → build scope → `AddChild` → `Start` → facade | `BindFactory` + `ByNewContextPrefab` |
| `Resolve<T>()` / `FindInstaller()` | Nearest-installer lookup for the rare node that needs it | `[Inject]` on MonoBehaviours |

Built in, no helper needed: `AddSingleton<T>()` (`AsSingle`), `AddSingleton(instance)`
(`BindInstance`), keyed services (`WithId`).

Deliberately left out: tickables (nodes have `_Process`), conditional bindings
(`WhenInjectedInto`, used once in Source), execution priorities (registration order covers
Source's two uses), fallback lookups into the parent scope, eager-but-not-initializable
registrations. Add one only when a real case needs it.

### How an installer gets installed

- **Spawned** by a `SceneFactory`: the scope is built **before** `AddChild` (so nodes looking it
  up in `_EnterTree`/`_Ready` find it), started **after** (so start-up sees nodes in the tree).
- **Placed in the editor**: installs itself in `_EnterTree` from the nearest installer above,
  or from nothing as a root, and starts in `_Ready`. Godot enters parents before children,
  so the scope exists before any child looks for it.
- **Spawn-only** scenes (`SpawnOnly => true`) need per-instance registrations only a factory
  gives, e.g. a scroll's `NoteId`. Running one on its own fails with a message saying so.

### Instance, type or factory: who made the object decides

- **Instance** (`AddSingleton(obj)`): someone else already made it.
  - Nodes: Godot created them by instancing the scene. Installers register their `[Export]`ed
    nodes and `this`.
  - Things from outside the scope: `Ursprung.Rzeka` in the root, `Import<T>(parent)` elsewhere.
  - Per-instance values: `new NoteId(guid)` through the factory's `extra`.
  - Exported resources and settings: a `PackedScene`, a config resource.
- **Type** (`AddSingleton<T>()`, `AddSelfAndInterfaces<T>()`, `AddInitializable<T>()`): plain
  classes. Never `AddSingleton(new ScrollHeartbeat(…))` in `Install`, which compiles but loses:
  1. disposal, because handed instances are never disposed, so subscriptions leak;
  2. initialization, because no `InitializeEntry` is added, so `Start()` skips it;
  3. validation and wiring: you pass the arguments by hand and `ValidateOnBuild` cannot check them.
- **Factory** (`AddSingleton(sp => new X(…))`): the in-between case, mixing container
  dependencies with something it cannot resolve by type, like the `SceneFactory` getting
  `ScrollScene` and `ScrollsParent`. The container owns and disposes what it returns. If the
  extra thing is a plain value, prefer wrapping it in a named record (like `NoteId`) and
  going back to a type registration.

### Ownership in one line each

- The container owns what it created: plain classes and their rzeka subscriptions.
- Godot owns the nodes (registered as instances, never disposed by the container).
- The parent owns imports (registered as instances).
- A scope dies with its installer node: `QueueFree` → `_ExitTree` → `Scope.Dispose()`.
  Children exit before parents, so child scopes are gone before the scope they import from.

### Spawning a scroll, end to end

```csharp
// forest scope
services.AddSingleton(sp => new SceneFactory<Scroll>(ScrollScene, ScrollsParent, sp));

// scroll.tscn root
public partial class ScrollInstaller : Installer
{
    protected override bool SpawnOnly => true;

    protected override void Install(IServiceCollection services, IServiceProvider parent)
    {
        services.Import<IRzeka>(parent);                 // everything from outside, listed here
        services.AddSingleton(this);
        services.AddKeyedSingleton(ScrollMesh.Front, _frontMesh);
        services.AddKeyedSingleton(ScrollMesh.Back, _backMesh);
        services.AddSelfAndInterfaces<ScrollReplanter>();
        services.AddSingleton<Scroll>();                 // the facade
    }
}

// spawning, triggered by rzeka matter inside the forest
Scroll scroll = factory.Create(s => s.AddSingleton(new NoteId(guid)));
```

## Conventions

- One constructor per container-built class; constructors only store dependencies.
- Per-instance values get a named record (`NoteId`), never a bare `Guid`/`string`/`float`.
  Microsoft's container also only takes reference types as instances.
- Fairies expose a public `Install(IServiceCollection)` at their root that registers their
  `internal/` implementations, so the root scope never touches anyone's `.Internal`.
- `IRzeka` becomes the root scope's first registration; the static `Ursprung.Rzeka` can stay
  during migration and go once nothing reads it.
- Subclasses of `Installer` call `base` when overriding `_EnterTree`, `_Ready` or `_ExitTree`.
- Never reparent an installer: leaving the tree disposes its scope.

## Open questions

- Should `Resolve<T>()` users be listed or test-guarded, to keep that path rare?
- Testing node scripts in isolation: plain classes are trivially testable through constructors;
  nodes have no special tooling (AutoInject's fakes were its one real advantage).
- Where the URL resolver for gdcef views lands (the TODO in `PlaneMeshGdcef`): likely a
  registration in the scroll forest's scope, consumed by the browser node through its installer.
