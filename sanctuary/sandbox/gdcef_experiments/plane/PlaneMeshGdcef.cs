/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using Godot;
using Sanctuary.Common.Extensions;

namespace Sanctuary.Sandbox;

// Important pixel-perfect setup notes:
// 1. Set texture sampling to Nearest (disable mipmapping)
// 2. Disable TAA, at least at the moment when you want to switch to pix-perf
public partial class PlaneMeshGdcef : Node3D
{
    StandardMaterial3D _material;
    TextureRect _view;

    // Create the browser already sized to `size` (the pixel-perfect resolution the
    // focused note will occupy on screen). The caller (the controller) computes this
    // and calls Initialize from ITS _Ready — which runs after this child's _Ready, so
    // we deliberately do NOT create the browser in _Ready.
    //
    // The browser is built at its final size on purpose: resizing a live software-OSR
    // CefTexture (setting _view.Size after it is in the tree) tears down and recreates
    // its X surface and crashes with an XServer BadWindow fault. So there is no
    // SetResolution — if the screen resolution changes, the whole view must be REBUILT
    // (free this _view and call Initialize again with the new size), never resized.
    public void Initialize(Vector2I size)
    {
        MeshInstance3D mesh = this.GetAllNodesOfType<MeshInstance3D>()[0];

        GodotObject browser = ClassDB.Instantiate("CefTexture").AsGodotObject();
        browser.Set("enable_accelerated_osr", false);
        browser.Set(
            "url",
            "https://sketchfab.com/3d-models/manul-63904e8b8e0042ffa678ec6c929d063b"
        );
        _material = mesh.GetActiveMaterial(0) as StandardMaterial3D;
        _view = browser as TextureRect;
        _view.Size = size; // pixel-perfect: set ONCE, before AddChild, never resized live
        _view.Position = new Vector2(-10000, -10000);
        AddChild(_view);
    }

    public override void _Process(double delta)
    {
        if (_view is not null && _view.Texture is Texture2D tex && _material.AlbedoTexture != tex)
            _material.AlbedoTexture = tex;
    }

    public override void _ExitTree() { }
}

/* created at 2026-06-12, Fri, 17:56 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
