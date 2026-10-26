/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Microsoft.Extensions.DependencyInjection;
using Sanctuary.Common.Injection;

namespace Sanctuary.Sandbox.InjectionDemo;

/// <summary>
/// Takes two services of the same type, told apart by key. Without keys both would be a
/// plain Node3D registration, and the last one registered would silently win for both.
/// </summary>
public sealed class ScrollFaces(
    NoteId note,
    [FromKeyedServices(ScrollSide.Front)] Node3D front,
    [FromKeyedServices(ScrollSide.Back)] Node3D back
) : IInitializable
{
    public void Initialize() => GD.Print($"🪞 [{note}] front is '{front.Name}', back is '{back.Name}'");
}

/* created at 2026-10-22, Thu, 16:48 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
