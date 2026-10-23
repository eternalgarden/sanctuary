/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Microsoft.Extensions.DependencyInjection;

namespace Sanctuary.Sandbox.Injection;

/// <summary>
/// Spawns a scene whose root is an <see cref="Installer"/>, giving it its own scope under
/// <paramref name="parent"/>, and hands back a <see cref="Spawned{TFacade}"/>: its facade
/// plus the means to despawn it. Zenject: BindFactory with
/// FromSubContainerResolve().ByNewContextPrefab().UnderTransform().
/// </summary>
public sealed class SceneFactory<TFacade>(PackedScene scene, Node parentNode, IServiceProvider parent)
    where TFacade : notnull
{
    /// <param name="extra">Per-instance registrations, e.g. the note a scroll shows.</param>
    public Spawned<TFacade> Create(Action<IServiceCollection>? extra = null)
    {
        var installer = scene.Instantiate<Installer>();

        try
        {
            // Built before AddChild, so nodes looking up their scope in _EnterTree/_Ready
            // already find it.
            installer.InstallFrom(parent, extra);
        }
        catch
        {
            installer.Free();
            throw;
        }

        parentNode.AddChild(installer);

        // After AddChild, so starting can rely on the nodes being in the tree.
        installer.Scope!.Start();

        IServiceProvider services = installer.Scope.Services;
        return new Spawned<TFacade>(
            services.GetRequiredService<TFacade>(),
            services.GetRequiredService<SceneLifetime>()
        );
    }
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
