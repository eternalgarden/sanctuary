/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Sandbox.InjectionDemo;

/// <summary>The one object a spawned scroll shows to the outside. Zenject: the Scroll facade.</summary>
// Takes the heartbeat by its interface on purpose: resolving the forwarded registration is
// what makes the container dispose the heartbeat a second time.
public sealed class DemoScroll(IHeartbeat heartbeat, DemoScrollInstaller root)
{
    public NoteId Note => heartbeat.Note;

    // Freeing the root ends the scroll: its installer leaves the tree and disposes the scope.
    public void Despawn() => root.QueueFree();
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
