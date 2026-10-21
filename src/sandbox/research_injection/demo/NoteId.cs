/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Sandbox.InjectionDemo;

// Source bound a bare Guid into each scroll's container. A named record says what the
// Guid means, and Microsoft's container only takes reference types as instances anyway.
public sealed record NoteId(Guid Value)
{
    public override string ToString() => Value.ToString()[..8];
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
