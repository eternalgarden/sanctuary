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
        {
            // A cast, not `as`: a wrong registration fails naming both types.
            var initializable = (IInitializable)_provider.GetRequiredService(entry.Type);
            initializable.Initialize();
        }
    }

    public void Dispose() => _provider.Dispose();
}

/// <summary>Marks a registered type for <see cref="Scope.Start"/>.</summary>
/// <remarks>
/// Kept as its own registration rather than registering the instance again as
/// IInitializable, which would add yet another disposal of the same object.
/// </remarks>
sealed record InitializeEntry(Type Type);

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
