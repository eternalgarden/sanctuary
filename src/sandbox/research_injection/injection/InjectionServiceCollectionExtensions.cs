/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Microsoft.Extensions.DependencyInjection;

namespace Sanctuary.Sandbox.Injection;

/// <summary>
/// The few registrations Microsoft's container lacks compared to what Source used from
/// Zenject. Everything else is the built-in vocabulary: AddSingleton&lt;T&gt;() for
/// Bind().AsSingle(), AddSingleton(instance) for BindInstance, AddKeyedSingleton with
/// [FromKeyedServices] for WithId.
/// </summary>
public static class InjectionServiceCollectionExtensions
{
    /// <summary>A singleton started by <see cref="Scope.Start"/>. Zenject: Bind().AsSingle().NonLazy() on an IInitializable.</summary>
    public static IServiceCollection AddInitializable<T>(this IServiceCollection services)
        where T : class, IInitializable
    {
        services.AddSingleton<T>();
        services.AddSingleton(new InitializeEntry(typeof(T)));
        return services;
    }

    /// <summary>
    /// One singleton reachable as itself and as each of its interfaces, started by
    /// <see cref="Scope.Start"/> when it is an <see cref="IInitializable"/>.
    /// Zenject: BindInterfacesAndSelfTo&lt;T&gt;().AsSingle().
    /// </summary>
    /// <remarks>
    /// The container calls Dispose once per registration that exposes the object, so a
    /// disposable registered this way is disposed more than once. IDisposable's contract
    /// requires repeated calls to be harmless; rzeka's CollectibleDisposable already is.
    /// </remarks>
    public static IServiceCollection AddSelfAndInterfaces<T>(this IServiceCollection services)
        where T : class
    {
        services.AddSingleton<T>();

        foreach (Type contract in typeof(T).GetInterfaces())
        {
            if (contract == typeof(IDisposable) || contract == typeof(IAsyncDisposable))
                continue;
            if (contract == typeof(IInitializable))
                continue;

            services.AddSingleton(contract, provider => provider.GetRequiredService<T>());
        }

        if (typeof(IInitializable).IsAssignableFrom(typeof(T)))
            services.AddSingleton(new InitializeEntry(typeof(T)));

        return services;
    }

    /// <summary>
    /// Brings a service in from the parent scope. Resolved now and registered as an
    /// instance, so this scope never disposes what the parent owns.
    /// </summary>
    public static IServiceCollection Import<T>(this IServiceCollection services, IServiceProvider parent)
        where T : class
    {
        services.AddSingleton(parent.GetRequiredService<T>());
        return services;
    }
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
