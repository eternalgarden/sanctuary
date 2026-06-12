/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System.Collections.Generic;
using Godot;

namespace Sanctuary.Common.Extensions;

public static class NodeExtensions
{
    /// <summary>
    /// Recursively finds all descendant nodes of type T.
    /// </summary>
    /// <param name="parent">The node to start searching from.</param>
    /// <typeparam name="T">The type of node to find.</typeparam>
    /// <returns>A list of all found nodes.</returns>
    public static List<T> GetAllNodesOfType<T>(this Node parent)
        where T : Node
    {
        var nodes = new List<T>();
        for (int i = 0; i < parent.GetChildCount(); i++)
        {
            Node child = parent.GetChild(i);
            if (child is T typedChild)
            {
                nodes.Add(typedChild);
            }
            // Recursively search this child's descendants
            nodes.AddRange(child.GetAllNodesOfType<T>());
        }
        return nodes;
    }
}

/* created at 2026-06-12, Fri, 18:36 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
