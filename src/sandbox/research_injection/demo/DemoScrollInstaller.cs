/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Microsoft.Extensions.DependencyInjection;
using Sanctuary.Sandbox.Injection;

namespace Sanctuary.Sandbox.InjectionDemo;

/// <summary>
/// Root of demo_scroll.tscn. Its NoteId arrives per instance from the factory, so this
/// scene is only meant to be spawned, never placed in the editor.
/// </summary>
public partial class DemoScrollInstaller : Installer
{
    [Export]
    Node3D FrontMesh { get; set; }

    [Export]
    Node3D BackMesh { get; set; }

    protected override bool SpawnOnly => true;

    protected override void Install(IServiceCollection services, IServiceProvider parent)
    {
        // Everything a scroll needs from outside, in one place.
        services.Import<IRzeka>(parent);

        // Same type twice, so each gets a key. Zenject: BindInstance(...).WithId(...).
        services.AddKeyedSingleton(ScrollSide.Front, FrontMesh);
        services.AddKeyedSingleton(ScrollSide.Back, BackMesh);

        // Only as IHeartbeat: nothing may depend on ScrollHeartbeat itself.
        services.AddInterfaces<ScrollHeartbeat>();
        services.AddInitializable<ScrollFaces>();
        services.AddSingleton<DemoScroll>();
    }
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
