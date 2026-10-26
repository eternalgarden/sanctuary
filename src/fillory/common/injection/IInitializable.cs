/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Common.Injection;

/// <summary>
/// The "start acting" phase of a container-built class. The constructor only stores
/// dependencies; subscribing to the river or touching nodes happens here, once the whole
/// scope is built and its nodes are in the tree. Called by <see cref="Scope.Start"/>,
/// in registration order.
/// </summary>
public interface IInitializable
{
    void Initialize();
}

/* created at 2026-10-21, Wed, 20:27 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
