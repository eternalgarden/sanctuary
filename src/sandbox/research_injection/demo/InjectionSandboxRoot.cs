/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Microsoft.Extensions.DependencyInjection;
using Sanctuary.Forest.Autoloads;
using Sanctuary.Common.Injection;

namespace Sanctuary.Sandbox.InjectionDemo;

/// <summary>
/// Stands in for the future root scope in Ursprung: placed in the editor with no installer
/// above, so it installs itself from nothing.
/// </summary>
public partial class InjectionSandboxRoot : Installer
{
    [Export]
    PackedScene ScrollScene { get; set; }

    [Export]
    Node ScrollsParent { get; set; }

    [Export]
    PackedScene SparkScene { get; set; }

    [Export]
    Node SparksParent { get; set; }

    protected override void Install(IServiceCollection services, IServiceProvider parent)
    {
        // Ursprung owns the river; registered as an instance, so this scope never disposes it.
        services.AddSingleton(Ursprung.Rzeka);

        services.AddSingleton(provider =>
            new SceneFactory<DemoScroll>(ScrollScene, ScrollsParent, provider)
        );
        services.AddSingleton(provider =>
            new SceneFactory<SparkFuse>(SparkScene, SparksParent, provider)
        );
        services.AddInitializable<DemoSpawner>();
    }

    // Quitting from inside lets the tree exit normally, so the closing disposals print.
    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventKey { Pressed: true, Keycode: Key.Escape })
            GetTree().Quit();
    }

    public override void _ExitTree()
    {
        base._ExitTree();
        GD.Print("🌳 root scope disposed");
    }
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
