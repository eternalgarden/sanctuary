/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System.Reactive.Concurrency;
#if DEBUG
using Rzeka.Dev;
#endif

namespace Sanctuary.Forest.Autoloads;

public partial class Ursprung : Node
{
    public static IRzeka Rzeka { get; private set; }

    CollectibleDisposable Q { get; set; } = new();

    public override void _EnterTree()
    {
        SynchronizationContext.SetSynchronizationContext(new GodotMainThreadContext());
        var mainThread = new SynchronizationContextScheduler(SynchronizationContext.Current);

        Spring spring = new();

#if DEBUG
        Q += spring.EnableDevServer();
#endif

        Rzeka = spring.Create(
            "Sanctuary",
            mainThread: mainThread,
            describeOwner: who => (who as Node)?.Name
        );

        GD.Print("🌊 Rzeka is operational!");
    }

    public override void _ExitTree()
    {
        Q.Dispose();
        Rzeka.Dispose();
    }

    // Posts callbacks to Godot's main thread via CallDeferred - backs the MainThread scheduler above.
    private sealed class GodotMainThreadContext : SynchronizationContext
    {
        public override void Post(SendOrPostCallback d, object state) =>
            Callable.From(() => d(state)).CallDeferred();
    }
}


/* created at 2026-06-14, Sun, 11:45 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
