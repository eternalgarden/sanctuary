/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Microsoft.Extensions.DependencyInjection;

namespace Sanctuary.Sandbox.Injection;

/// <summary>
/// Root node of a scene that owns a <see cref="Scope"/>. Zenject: a MonoInstaller on a
/// GameObjectContext. Holds [Export] references to its own scene's nodes and registers
/// them, along with its plain classes, in <see cref="Install"/>.
///
/// Installed one of two ways:
/// - by a <see cref="SceneFactory{TFacade}"/>, which builds the scope before the node
///   enters the tree and starts it right after;
/// - placed in the editor, it installs itself in _EnterTree from the nearest installer
///   above it (or from nothing, as a root) and starts it in _Ready.
///
/// Subclasses overriding _EnterTree, _Ready or _ExitTree must call the base method.
/// Do not reparent an installer: leaving the tree disposes its scope.
/// </summary>
public abstract partial class Installer : Node
{
    static readonly IServiceProvider Nothing = new ServiceCollection().BuildServiceProvider();

    bool _selfInstalled;

    public Scope? Scope { get; private set; }

    /// <summary>
    /// For scenes that need per-instance registrations only a factory provides. Running
    /// such a scene on its own then fails with a message saying so, rather than with
    /// whatever its first missing service happens to be.
    /// </summary>
    protected virtual bool SpawnOnly => false;

    protected abstract void Install(IServiceCollection services, IServiceProvider parent);

    /// <param name="extra">Per-instance registrations, e.g. the note a scroll shows.</param>
    public void InstallFrom(IServiceProvider parent, Action<IServiceCollection>? extra = null)
    {
        if (Scope is not null)
            throw new InvalidOperationException($"Installer '{Name}' is already installed.");

        var services = new ServiceCollection();
        Install(services, parent);
        extra?.Invoke(services);
        Scope = new Scope(services);
    }

    // Godot enters a parent before its children, so the scope is ready before any node
    // below looks for it.
    public override void _EnterTree()
    {
        if (Scope is not null)
            return;

        if (SpawnOnly)
            throw new InvalidOperationException(
                $"Installer '{Name}' only works when spawned through a SceneFactory. "
                    + "Run the scene that spawns it instead of this one."
            );

        IServiceProvider parent = Nothing;
        if (GetParent().FindInstaller() is { } above)
        {
            parent =
                above.Scope?.Services
                ?? throw new InvalidOperationException(
                    $"Installer '{Name}' found '{above.Name}' above it, but that one is not installed."
                );
        }

        InstallFrom(parent);
        _selfInstalled = true;
    }

    public override void _Ready()
    {
        // Godot readies children before their parent, so every node below is ready here.
        // A spawned installer skips this: its SceneFactory starts the scope after AddChild.
        if (_selfInstalled)
            Scope!.Start();
    }

    public override void _ExitTree()
    {
        Scope?.Dispose();
        Scope = null;
        _selfInstalled = false;
    }
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
