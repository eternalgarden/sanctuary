/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Sandbox.InjectionDemo;

/// <summary>The one object a spawned scroll shows to the outside. Zenject: the Scroll facade.</summary>
// Takes the heartbeat by its interface, the only way it is registered (AddInterfaces).
// Resolving that forward is what makes the container dispose the heartbeat a second time.
// Despawning is not its business: whoever spawned it holds the Spawned handle.
public sealed class DemoScroll(IHeartbeat heartbeat)
{
    public NoteId Note => heartbeat.Note;
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
