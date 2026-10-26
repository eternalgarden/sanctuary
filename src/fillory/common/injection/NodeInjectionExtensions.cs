/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Microsoft.Extensions.DependencyInjection;

namespace Sanctuary.Common.Injection;

/// <summary>
/// The only injection code a node script should ever see, and it should stay rare: most
/// nodes are registered into a scope by their installer instead of resolving anything.
/// </summary>
public static class NodeInjectionExtensions
{
    /// <summary>The nearest installer at or above <paramref name="node"/>.</summary>
    public static Installer? FindInstaller(this Node? node)
    {
        for (; node is not null; node = node.GetParent())
        {
            if (node is Installer installer)
                return installer;
        }

        return null;
    }

    /// <summary>Resolves from the nearest installer's scope. Valid from _EnterTree on.</summary>
    public static T Resolve<T>(this Node node)
        where T : notnull
    {
        Installer installer =
            node.FindInstaller()
            ?? throw new InvalidOperationException($"No installer above '{node.Name}'.");

        Scope scope =
            installer.Scope
            ?? throw new InvalidOperationException(
                $"'{node.Name}' found installer '{installer.Name}', but it is not installed."
            );

        return scope.Services.GetRequiredService<T>();
    }
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
