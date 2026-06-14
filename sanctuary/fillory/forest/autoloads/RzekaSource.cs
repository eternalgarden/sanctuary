/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System.Reactive.Concurrency;
using System.Threading;
using Godot;
using Rzeka;
// TODO: Add dev-only clause
using Rzeka.Dev;

namespace Sanctuary.Forest.Autoloads;

public partial class RzekaSource : Node
{
    public static IRzeka Rzeka { get; private set; }

    CollectibleDisposable Q { get; set; } = new();

    public override void _EnterTree()
    {
        SynchronizationContext.SetSynchronizationContext(new GodotMainThreadContext());
        var mainThread = new SynchronizationContextScheduler(SynchronizationContext.Current);

        Spring spring = new();

        // TODO: Add debug-build-only clause
        Q += spring.EnableDevServer();

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
