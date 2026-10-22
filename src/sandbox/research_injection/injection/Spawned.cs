/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Sandbox.Injection;

/// <summary>
/// A scene spawned by a <see cref="SceneFactory{TFacade}"/>, held by whoever spawned it.
/// The facade is what gameplay talks to; despawning stays with the owner of this handle,
/// so the facade never needs to know about its installer.
/// </summary>
public sealed class Spawned<TFacade>(TFacade facade, SceneLifetime lifetime) : IDisposable
    where TFacade : notnull
{
    public TFacade Facade => facade;

    // The same way a scene ends from inside, so there is only one. Safe to call again, or
    // after the scene already ended itself.
    public void Dispose() => lifetime.End();
}

/* created at 2026-10-22, Thu, 15:06 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
