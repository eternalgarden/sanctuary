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
    // Key only this class knows: AddInterfaces registers its concrete type under it, so no
    // constructor outside the injection layer can ask for that type.
    static readonly object Hidden = new();

    /// <summary>A singleton started by <see cref="Scope.Start"/>. Zenject: Bind().AsSingle().NonLazy() on an IInitializable.</summary>
    public static IServiceCollection AddInitializable<T>(this IServiceCollection services)
        where T : class, IInitializable
    {
        services.AddSingleton<T>();
        services.AddSingleton(new InitializeEntry(provider => provider.GetRequiredService<T>()));
        return services;
    }

    /// <summary>
    /// One singleton reachable only as each of its interfaces, started by
    /// <see cref="Scope.Start"/> when it is an <see cref="IInitializable"/>. Asking for the
    /// concrete type fails validation. The default when others depend on a class's interfaces.
    /// Zenject: BindInterfacesTo&lt;T&gt;().AsSingle().
    /// </summary>
    /// <remarks>
    /// The container calls Dispose once per registration that exposes the object (the hidden
    /// one and each forward resolved), so a disposable registered this way is disposed more
    /// than once. IDisposable's contract requires repeated calls to be harmless; rzeka's
    /// CollectibleDisposable already is.
    /// </remarks>
    public static IServiceCollection AddInterfaces<T>(this IServiceCollection services)
        where T : class
    {
        if (!Contracts<T>().Any())
            throw new InvalidOperationException(
                $"{typeof(T).Name} has no interfaces to register it as. "
                    + $"Use AddInitializable<{typeof(T).Name}>() or AddSingleton<{typeof(T).Name}>()."
            );

        services.AddKeyedSingleton<T>(Hidden);
        AddForwards(services, provider => provider.GetRequiredKeyedService<T>(Hidden));
        return services;
    }

    /// <summary>
    /// One singleton reachable as itself and as each of its interfaces, started by
    /// <see cref="Scope.Start"/> when it is an <see cref="IInitializable"/>. Only for classes
    /// others really need concretely (e.g. a facade); otherwise prefer AddInterfaces.
    /// Zenject: BindInterfacesAndSelfTo&lt;T&gt;().AsSingle().
    /// </summary>
    /// <remarks>Disposed more than once, as with <see cref="AddInterfaces{T}"/>.</remarks>
    public static IServiceCollection AddSelfAndInterfaces<T>(this IServiceCollection services)
        where T : class
    {
        services.AddSingleton<T>();
        AddForwards(services, provider => provider.GetRequiredService<T>());
        return services;
    }

    // Registers each interface of T as a forward to the one instance `resolve` returns, and
    // the instance for Start() when it is IInitializable.
    static void AddForwards<T>(IServiceCollection services, Func<IServiceProvider, T> resolve)
        where T : class
    {
        foreach (Type contract in Contracts<T>())
            services.AddSingleton(contract, resolve);

        if (typeof(IInitializable).IsAssignableFrom(typeof(T)))
            services.AddSingleton(
                new InitializeEntry(provider => (IInitializable)resolve(provider))
            );
    }

    // The interfaces worth forwarding: lifecycle ones are handled without a registration
    // (disposal is automatic, initialization has its own entry).
    static IEnumerable<Type> Contracts<T>() =>
        typeof(T)
            .GetInterfaces()
            .Where(contract =>
                contract != typeof(IDisposable)
                && contract != typeof(IAsyncDisposable)
                && contract != typeof(IInitializable)
            );

    /// <summary>
    /// Brings a service in from the parent scope. Resolved now and registered as an
    /// instance, so this scope never disposes what the parent owns.
    /// </summary>
    public static IServiceCollection Import<T>(
        this IServiceCollection services,
        IServiceProvider parent
    )
        where T : class
    {
        services.AddSingleton(parent.GetRequiredService<T>());
        return services;
    }
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
