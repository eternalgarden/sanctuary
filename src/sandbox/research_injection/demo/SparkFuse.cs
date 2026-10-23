/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Sanctuary.Sandbox.Injection;

namespace Sanctuary.Sandbox.InjectionDemo;

/// <summary>
/// A fire-and-forget scene's own ending: nobody keeps the spark's handle, so it decides when
/// it is over and ends its scene through <see cref="SceneLifetime"/>, never through its installer.
/// </summary>
public sealed class SparkFuse(Godot.Timer fuse, SceneLifetime lifetime) : IInitializable, IDisposable
{
    public void Initialize()
    {
        // No unsubscribing in Dispose: the timer belongs to the same scene and is freed with it.
        fuse.Timeout += lifetime.End;
        fuse.Start();
        GD.Print($"🎆 spark lit, burns out on its own in {fuse.WaitTime}s");
    }

    public void Dispose() => GD.Print("🎆 spark burned out, its scope is gone");
}

/* created at 2026-10-22, Thu, 15:47 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
