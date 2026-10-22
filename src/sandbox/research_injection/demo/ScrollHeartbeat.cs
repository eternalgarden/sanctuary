/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Sanctuary.Blood.Startup;
using Sanctuary.Sandbox.Injection;

namespace Sanctuary.Sandbox.InjectionDemo;

public interface IHeartbeat
{
    NoteId Note { get; }
}

/// <summary>
/// A plain class living in one scroll's scope: the imported river plus that scroll's note,
/// both constructor-injected. Registered with AddSelfAndInterfaces, so its Dispose calls
/// show the container disposing it once per registration.
/// </summary>
public sealed class ScrollHeartbeat(IRzeka rzeka, NoteId note)
    : IHeartbeat,
        IInitializable,
        IDisposable
{
    CollectibleDisposable Q { get; set; } = new();
    int _disposeCalls;

    public NoteId Note => note;

    public void Initialize()
    {
        GD.Print($"🌱 [{note}] heartbeat initialized, river #{rzeka.GetHashCode()}");

        // A spell owned by this scroll only. In Eris it should go Forgotten when this
        // scroll is freed, while the other scroll's stays.
        Q += rzeka.Weave<FilloryLoadState>(
            this,
            spell =>
                spell.Subscribe(
                    onNext: _ => GD.Print($"💓 [{note}] saw Fillory's load state"),
                    onError: err => rzeka.Whisper(err)
                )
        );
    }

    public void Dispose()
    {
        _disposeCalls++;
        GD.Print($"🍂 [{note}] heartbeat Dispose call #{_disposeCalls}");
        Q.Dispose();
    }
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
