# Neo DI — working notes

> Temporary. Collects what shaped Neo's dependency injection while it lives in
> `sandbox/research_injection`. Fold the lasting parts into `docs/` when the module graduates
> to `fillory/common/injection` (`Sanctuary.Common.Injection`), then delete this.
>
> For porting Source code, the operational companion is
> `docs/sanctuary/development/zenject_migration.md` ("you see X, write Y").

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

There is no class called "container": the word means the **provider**.

| Microsoft type | What it is | Zenject |
|---|---|---|
| `ServiceDescriptor` | One registration: type, lifetime, how to build it (type, instance or factory) | One `Bind…()` statement |
| `IServiceCollection` / `ServiceCollection` | The list of registrations, still editable | A `DiContainer` while binding |
| `IServiceProvider` / `ServiceProvider` | **The container**: built from the collection, frozen; creates, caches, disposes | A `DiContainer` while resolving |
| a **service** | Anything registered: class, interface or instance. Not "something big" | Any binding |

Zenject's `DiContainer` is one object you first bind into, then resolve from; Microsoft splits
those phases into two types. In Neo, **one `Scope` wraps exactly one provider**, so "the
scroll's container" and "the scroll's scope" mean the same thing. Not to be confused with
Microsoft's own `IServiceScope` (from `CreateScope()`), which we don't use: it shares one
provider's registrations, while our `Scope` is a provider of its own.

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
   - **Disposal is automatic.** Nobody calls `Dispose()` on services or registers them for
     disposal: whenever the container builds an object, it checks for `IDisposable` /
     `IAsyncDisposable` itself and remembers it. Implementing `IDisposable` is all a class
     does to be cleaned up when its scope ends (e.g. `ScrollHeartbeat` dropping its rzeka
     subscription). It is also why the container never frees a Godot node: nodes are
     `IDisposable` too, but they are handed in, not built.
   - Unlike Zenject, which only disposed what was **bound** as `IDisposable` (the reason for
     `BindInterfacesAndSelfTo` in Source); here the object's own interfaces are what count,
     whatever it was registered as.
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
     The demo's heartbeat, step by step:
     1. `AddInterfaces<ScrollHeartbeat>()` adds two registrations: `ScrollHeartbeat` under a
        hidden key (type: the container builds it) and `IHeartbeat` (a forward, a factory
        returning that same object). `AddSelfAndInterfaces` behaves the same, unkeyed.
     2. `Scope.Start()` resolves the hidden registration through its `InitializeEntry`: the
        object is built and added to the disposal list. Call #1.
     3. The facade `DemoScroll(IHeartbeat heartbeat)` resolves the forward: its factory returns
        the existing object, and factory results count as created, so it is added again. Call #2.
     A forward nobody resolves adds nothing, and `AddInitializable<T>()` registers only `T`,
     which is why the spark disposes once.
   - Disposable transients are held until the provider dies. Avoid them.
7. **Keyed services** (.NET 8). `AddKeyedSingleton(key, …)` + `[FromKeyedServices(key)]` on a
   constructor parameter. Replaces `WithId`; enum keys read best.
   - Keyed and unkeyed registrations are separate: a plain `Node3D` parameter does not find a
     keyed `Node3D`. Without keys, two registrations of one type collapse: the last one wins.
   - Demo: `DemoScrollInstaller` registers its two meshes under `ScrollSide.Front`/`.Back`,
     and `ScrollFaces` takes both with `[FromKeyedServices(…)]`.
8. **Validation.** `ValidateOnBuild` checks every constructor is satisfiable while building, so a
   missing `Import` fails with the type named. It cannot see inside factory lambdas.
   `ValidateScopes` catches singletons capturing scoped services.

## The Neo layer (`injection/`)

| Part | Role | Zenject counterpart |
|---|---|---|
| `IInitializable` | Start-acting phase for plain classes | `IInitializable` |
| `Scope` | One validated container; `Start()` initializes in registration order; `Dispose()` | Context + kernel |
| `AddInitializable<T>()` | Singleton started by the scope | `Bind().AsSingle().NonLazy()` |
| `AddInterfaces<T>()` | One singleton reachable only as its interfaces; the concrete type sits under a hidden key, so asking for it fails validation | `BindInterfacesTo<T>()` |
| `AddSelfAndInterfaces<T>()` | Same, plus the concrete type; only when others need it concretely | `BindInterfacesAndSelfTo<T>()` |
| `Import<T>(parent)` | Bring a parent's service in as an instance | Subcontainer seeing its parent |
| `Installer` (node) | Scene root owning a scope; `[Export]`s its nodes and registers them | `MonoInstaller` + `GameObjectContext` |
| `SceneFactory<TFacade>` | Instantiate → build scope → `AddChild` → `Start` → `Spawned` handle | `BindFactory` + `ByNewContextPrefab` |
| `Spawned<TFacade>` | The creator's handle: `Facade` to talk to, `Dispose()` to despawn | Destroying the context's GameObject |
| `SceneLifetime` | Registered in every scope by `Installer`; `End()` frees the scene's root, nothing else | `Destroy(gameObject)` from inside |
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

### Which registration: interfaces, self, or neither

Source has 100 `BindInterfacesAndSelfTo` and 1 `BindInterfacesTo`; "AndSelf" was habit, and
most were only there so Zenject's kernel saw `IInitializable` / `IDisposable` / `ITickable`.
In Neo those need no registration (initialization has its own entry, disposal is automatic),
so the 100 split three ways:

1. **Only for lifecycle interfaces** → `AddInitializable<T>()` or plain `AddSingleton<T>()`.
   Probably most of them (e.g. `ScrollReplanter : IInitializable, IDisposable`).
2. **Others depend on its interfaces** → `AddInterfaces<T>()`, the default. The concrete type
   is registered under a key only the injection layer knows, so a constructor asking for it
   fails `ValidateOnBuild`: "depend on the interface" is enforced, not just suggested.
   `AddInterfaces` throws on a class with no interfaces left to forward, pointing at case 1.
3. **Others really need the concrete class too** (rare) → `AddSelfAndInterfaces<T>()`.

Both 2 and 3 dispose once per resolved registration: the hidden or self one plus each forward.

### What gets built, and when

Nothing is built when a scope is built. A service is built on its first resolve, and resolves
start only at these entry points:

1. `Scope.Start()` resolves every initializable.
2. `SceneFactory` resolves the facade.
3. `Import<T>(parent)` resolves in the **parent** scope while a child installs, building the
   service there (and its constructor chain) if nothing had yet.
4. Rarely, a node's `Resolve<T>()`.

From there it cascades through constructor parameters: building a service resolves everything
its constructor takes. Keep direct `GetRequiredService` calls inside the injection layer, so
this list stays complete.

So ask of every class: does it **act on its own**, or **wait to be used**?

- Acts on its own (subscribes to rzeka, starts a timer, spawns): nobody asks for it, so it
  must be an entry point → `AddInitializable`, or `AddInterfaces` on an `IInitializable`.
  Demo: `DemoSpawner`, `ScrollHeartbeat`, `ScrollFaces`, `SparkFuse`.
- Used by others (facade, helper, repository): plain `AddSingleton`, built when the first
  class needing it is. Demo: `DemoScroll` (built by the factory resolving the facade) and
  `SceneFactory<DemoScroll>` (built because `DemoSpawner`'s constructor takes it).
- **The trap:** a class that acts on its own registered as plain `AddSingleton`. If nothing
  depends on it, it is never built: no error, it just never runs. Zenject's `NonLazy()` (58
  uses in Source) was this job; in Neo it is `AddInitializable`.

Does every scope need an initializable? It needs at least one entry point:

- Spawned scopes always have the facade. A scroll with no initializables still gets its
  facade and whatever the facade's constructor pulls in.
- Root and editor-placed scopes have no facade, so in practice they need an initializable,
  or nothing in them is built unless a child imports it or a node resolves it.
- A scope registering only nodes needs none: instances already exist.
- A service only there to be imported by children (a shared registry) need not be
  initializable; the first child's `Import` builds it. If it must exist from the start
  (e.g. it listens to rzeka), make it initializable.

### Instance, type or factory: who made the object decides

- **Instance** (`AddSingleton(obj)`): someone else already made it.
  - Nodes: Godot created them by instancing the scene. Installers register their `[Export]`ed
    nodes.
  - Things from outside the scope: `Ursprung.Rzeka` in the root, `Import<T>(parent)` elsewhere.
  - Per-instance values: `new NoteId(guid)` through the factory's `extra`.
  - Exported resources and settings: a `PackedScene`, a config resource.
- **Type** (`AddSingleton<T>()`, `AddInterfaces<T>()`, `AddInitializable<T>()`): plain
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
- The creator owns what it spawned, through its `Spawned` handle. Facades never despawn
  themselves or know their installer; a scroll wanting to close publishes rzeka matter
  (e.g. `ScrollCloseRequested(NoteId)`) and the handle's owner disposes it.
- A scope dies with its installer node: `QueueFree` → `_ExitTree` → `Scope.Dispose()`.
  Children exit before parents, so child scopes are gone before the scope they import from.

### Ending a scene from inside: `SceneLifetime`

The installer only installs, even when its scene ends itself: no gameplay, no listening to
signals. The decision lives where it is made, usually a plain class in the scope, and reaches
the root through `SceneLifetime`, which can do exactly one thing. `Spawned.Dispose()` calls the
same `End()`, so a scene ends one way whether from outside or inside.

```csharp
// demo/SparkFuse.cs: nobody keeps the spark's handle, so it ends itself
public sealed class SparkFuse(Timer fuse, SceneLifetime lifetime) : IInitializable, IDisposable
{
    public void Initialize()
    {
        fuse.Timeout += lifetime.End;   // the timer dies with the scene, no unsubscribing needed
        fuse.Start();
    }
    …
}

// spawner: fire and forget, the handle is dropped on purpose
sparks.Create();
```

When to use which:

- **Nobody holds it** (one-shot effects, a dragon that delivers and flies off): it ends itself
  through `SceneLifetime`.
- **An owner holds its `Spawned` handle** (scrolls): it never ends itself. It publishes matter
  (`ScrollCloseRequested(NoteId)`), and the owner disposes the handle, doing its bookkeeping.
- **No scope at all** (plain one-shot scenes): no injection involved; the root script calls
  `QueueFree()`, or a child's signal is connected to the root's `queue_free` in the editor.
- A node frees only itself or what it created. Never its ancestors (the old `DemoScroll`
  holding its installer) or its siblings.

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
        services.AddKeyedSingleton(ScrollMesh.Front, _frontMesh);
        services.AddKeyedSingleton(ScrollMesh.Back, _backMesh);
        services.AddInitializable<ScrollReplanter>();    // only IInitializable, IDisposable
        services.AddSingleton<Scroll>();                 // the facade
    }
}

// spawning, triggered by rzeka matter inside the forest, which keeps the handle
Spawned<Scroll> scroll = factory.Create(s => s.AddSingleton(new NoteId(guid)));

// despawning, e.g. on ScrollCloseRequested for that note
scroll.Dispose();
```

## Conventions

- One constructor per container-built class; constructors only store dependencies.
- `Dispose()` must be safe to call more than once (the `IDisposable` contract; forwards make it
  happen, see Ownership). Rzeka subscriptions live in `CollectibleDisposable Q`, whose
  `Dispose()` already is. Any other cleanup goes behind a guard:
  `if (_disposed) return; _disposed = true;`. Never put once-only side effects (publishing
  matter, counters, freeing nodes without `IsInstanceValid`) outside that guard.
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
