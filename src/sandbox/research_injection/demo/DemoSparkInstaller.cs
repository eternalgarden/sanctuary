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
/// Root of demo_spark.tscn. Only installs: the decision to end the scene lives in
/// <see cref="SparkFuse"/>, not here.
/// </summary>
public partial class DemoSparkInstaller : Installer
{
    [Export]
    Godot.Timer Fuse { get; set; }

    protected override void Install(IServiceCollection services, IServiceProvider parent)
    {
        services.AddSingleton(Fuse);
        services.AddInitializable<SparkFuse>();
    }
}

/* created at 2026-10-22, Thu, 15:47 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
