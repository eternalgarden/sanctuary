/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Microsoft.Extensions.DependencyInjection;
using Sanctuary.Sandbox.Injection;

namespace Sanctuary.Sandbox.InjectionDemo;

/// <summary>Source's DragonSpawner pattern: a plain class that spawns once its scope starts.</summary>
public sealed class DemoSpawner(SceneFactory<DemoScroll> scrolls, SceneFactory<SparkFuse> sparks)
    : IInitializable
{
    public void Initialize()
    {
        Spawned<DemoScroll> first = Spawn();
        Spawned<DemoScroll> second = Spawn();

        // Only the first scroll's scope should be disposed at the end of this frame. The
        // second lives until the sandbox closes, and goes before the root scope does.
        GD.Print($"✂️ [{first.Facade.Note}] despawning, [{second.Facade.Note}] stays");
        first.Dispose();

        // Fire and forget: the handle is dropped on purpose, the spark ends itself.
        sparks.Create();
    }

    Spawned<DemoScroll> Spawn()
    {
        var note = new NoteId(Guid.NewGuid());
        return scrolls.Create(services => services.AddSingleton(note));
    }
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
