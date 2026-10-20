/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using System.Reactive;
using System.Reactive.Linq;
using Godot;

namespace Sanctuary.Common.Reactive;

public static class FrameObservables
{
    public static IObservable<Unit> EveryProcessFrame(this Node who)
    {
        return Observable.Defer(() =>
        {
            // Remember that Godot's 'scene tree' is basically the game loop.
            // SceneTree < abstract MainLoop < Object
            // https://docs.godotengine.org/en/stable/tutorials/scripting/scene_tree.html#mainloop
            SceneTree tree = who.GetTree();
            return Observable.FromEvent(h => tree.ProcessFrame += h, h => tree.ProcessFrame -= h);
        });
    }

    public static IObservable<Unit> EveryPhysicsFrame(this Node who)
    {
        return Observable.Defer(() =>
        {
            SceneTree tree = who.GetTree();
            return Observable.FromEvent(h => tree.PhysicsFrame += h, h => tree.PhysicsFrame -= h);
        });
    }
}

/* created at 2026-08-14, Fri, 19:30 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
