/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using Godot;

namespace Sanctuary.Sandbox;

public sealed class ScrollCameraMover
{
    readonly Camera3D _worldCamera;
    readonly Camera3D _focusCamera;
    readonly Node _host; // Todo: we need this for createtween, later replace with di
    Tween _activeTween;

    public ScrollCameraMover(Camera3D world, Camera3D focus, Node host)
    {
        _worldCamera = world;
        _focusCamera = focus;
        _host = host;
    }

    public void BlendToNote(Transform3D target, ScrollFramingSettings s)
    {
        KillActive();

        // Overlap focus cameray perfectly on top of the world camera.
        _focusCamera.GlobalTransform = _worldCamera.GlobalTransform;
        _focusCamera.Fov = _worldCamera.Fov;
        _focusCamera.Near = _worldCamera.Near;
        _focusCamera.Far = _worldCamera.Far;
        _focusCamera.MakeCurrent();

        Blend(_focusCamera.GlobalTransform, target, s.BlendInSeconds, s, onDone: null);
    }

    public void BlendBackToPlayer(ScrollFramingSettings s)
    {
        KillActive();
        Blend(
            _focusCamera.GlobalTransform,
            _worldCamera.GlobalTransform,
            s.BlendOutSeconds,
            s,
            onDone: _worldCamera.MakeCurrent
        );
    }

    void KillActive()
    {
        if (GodotObject.IsInstanceValid(_activeTween))
            _activeTween.Kill();
        _activeTween = null;
    }

    void Blend(Transform3D from, Transform3D to, float seconds, ScrollFramingSettings s, Action onDone)
    {
        _activeTween = _host.CreateTween();
        _activeTween.SetTrans(s.Transition).SetEase(s.Ease);

        // InterpolateWith does position lerp + rotation slerp in one call, so the
        // camera arcs cleanly instead of skewing the way a componentwise basis tween
        // would.
        _activeTween.TweenMethod(
            Callable.From<float>(t => _focusCamera.GlobalTransform = from.InterpolateWith(to, t)),
            0.0f,
            1.0f,
            seconds
        );

        if (onDone != null)
            _activeTween.TweenCallback(Callable.From(onDone));
    }
}

/* created at 2026-06-14, Sun, 12:47 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
