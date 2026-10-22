/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Sandbox.Injection;

/// <summary>
/// The one thing a scene may do to its own root: end it. Every <see cref="Installer"/>
/// registers one in its scope, so gameplay can end its scene without knowing the installer.
/// </summary>
/// <remarks>
/// Meant for scenes whose end is built in (a one-shot effect, a dragon flying off). A scene
/// someone holds a <see cref="Spawned{TFacade}"/> handle to should publish matter instead,
/// and let that owner dispose the handle.
/// </remarks>
public sealed class SceneLifetime(Installer root)
{
    // Freeing the root ends the scene: its installer leaves the tree and disposes the scope.
    // Safe to call again, or after the root was already freed along with its parent.
    public void End()
    {
        if (GodotObject.IsInstanceValid(root) && !root.IsQueuedForDeletion())
            root.QueueFree();
    }
}

/* created at 2026-10-22, Thu, 15:47 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
