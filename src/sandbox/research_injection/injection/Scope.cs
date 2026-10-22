/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Microsoft.Extensions.DependencyInjection;

namespace Sanctuary.Sandbox.Injection;

/// <summary>
/// One built container plus the lifecycle Zenject's kernel used to run implicitly:
/// <see cref="Start"/> initializes every <see cref="IInitializable"/> registered through
/// the injection helpers, <see cref="Dispose"/> disposes everything the container created.
/// Instances it was handed (imports, nodes) are never disposed by it.
/// </summary>
public sealed class Scope(IServiceCollection services) : IDisposable
{
    // A missing registration or a forgotten Import fails here, while the scope is built,
    // naming the type, instead of on first use somewhere deep in gameplay.
    static readonly ServiceProviderOptions Validated = new()
    {
        ValidateOnBuild = true,
        ValidateScopes = true,
    };

    // The container is built here, when the Scope is constructed. It reads the registrations
    // once; later changes to the collection are ignored, so this is where they freeze.
    // Validation runs now, but no service is created yet: each is built on first resolve.
    // A resolve starts at Start() (the initializables), a SceneFactory (the facade) or,
    // rarely, a node's Resolve<T>() (avoid). It then cascades through constructor parameters:
    // building a service resolves everything its constructor takes, primary or not.
    readonly ServiceProvider _provider = services.BuildServiceProvider(Validated);

    bool _started;

    public IServiceProvider Services => _provider;

    public void Start()
    {
        if (_started)
            throw new InvalidOperationException("This scope has already been started.");
        _started = true;

        // GetServices returns registrations in the order they were made.
        foreach (InitializeEntry entry in _provider.GetServices<InitializeEntry>())
            entry.Resolve(_provider).Initialize();
    }

    // How we get here: the scene whose root is an Installer leaves the tree, usually through
    // Spawned.Dispose() or SceneLifetime.End() (both QueueFree the root), but freeing a parent
    // or quitting does it too. The installer's _ExitTree then disposes this scope, which
    // disposes the provider.
    //
    // This is where the magic happens: every service this provider built that implements
    // IDisposable gets its Dispose call, newest first. This is how Microsoft's DI works,
    // not part of our layer. Caveats:
    // - Only what this provider built (including factory results). Instances handed to it
    //   via AddSingleton(obj), e.g. a node you got through [Export], are not disposed.
    // - Only what was actually resolved: singletons are built on first resolve, so one
    //   nobody asked for was never built and gets nothing.
    // - Once per resolved registration, so something registered with
    //   AddInterfaces or AddSelfAndInterfaces and resolved through more than one of them
    //   gets multiple calls.
    public void Dispose() => _provider.Dispose();
}

/// <summary>
/// Marks a registration for <see cref="Scope.Start"/>. Holds how to resolve it rather than
/// its type, because AddInterfaces hides its concrete type under a key that resolving by
/// type cannot see.
/// </summary>
/// <remarks>
/// Kept as its own registration rather than registering the instance again as
/// IInitializable, which would add yet another disposal of the same object.
/// </remarks>
sealed record InitializeEntry(Func<IServiceProvider, IInitializable> Resolve);

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
