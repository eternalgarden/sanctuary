# research_injection

Sketch of Neo's dependency injection: Microsoft.Extensions.DependencyInjection plus a thin
layer standing in for what Source used from Zenject. Meant to graduate into
`fillory/common/injection` (`Sanctuary.Common.Injection`).

- `injection/` — the module: `IInitializable`, `Scope`, registration helpers (`AddInitializable`,
  `AddSelfAndInterfaces`, `Import`), the `Installer` base node, `SceneFactory` with its `Spawned` handle,
  `SceneLifetime`, and the node lookup (`Resolve<T>`).
- `demo/` — a root installer spawning two scrolls, each with its own scope, then freeing one;
  and a fire-and-forget spark that ends its own scene.

## Running

Open `injection_sandbox.tscn`, run it (F6), then press Escape to quit (killing the window skips the closing lines). Expected output, with
`aaaa`/`bbbb` standing for the two generated note ids:

```
🏷️ [aaaa] badge found its own scroll's note
🌱 [aaaa] heartbeat initialized, river #N
🏷️ [bbbb] badge found its own scroll's note
🌱 [bbbb] heartbeat initialized, river #N      <- same river: Import shares the parent's
✂️ [aaaa] despawning, [bbbb] stays
🎆 spark lit, burns out on its own in 0.5s     <- its handle was dropped
🍂 [aaaa] heartbeat Dispose call #1            <- end of frame, only the freed scroll
🍂 [aaaa] heartbeat Dispose call #2            <- once per registration exposing it
🎆 spark burned out, its scope is gone         <- half a second later, ended from inside
   ... on pressing Escape:
🍂 [bbbb] heartbeat Dispose call #1
🍂 [bbbb] heartbeat Dispose call #2
🌳 root scope disposed                        <- after its children, and the river survives
```

With the Rzeka dev server, each heartbeat's Weave shows in Eris; the freed scroll's should
go Forgotten while the other's stays.
