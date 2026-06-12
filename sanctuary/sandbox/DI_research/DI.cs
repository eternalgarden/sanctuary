using System;
using Godot;
using Microsoft.Extensions.DependencyInjection;
using Rzeka;

public partial class DI : Node
{
    public static DI Instance { get; private set; }
    private IServiceProvider _provider;

    public override void _Ready()
    {
        Instance = this;
        var services = new ServiceCollection();

        var spring = new Spring();
        services.AddSingleton<IRzeka>(_ => spring.Create("sanctuary"));

        _provider = services.BuildServiceProvider();
    }

    public T Resolve<T>() where T : notnull =>
        _provider.GetRequiredService<T>();
}
