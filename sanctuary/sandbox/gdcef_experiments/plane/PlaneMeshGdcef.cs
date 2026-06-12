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

public partial class PlaneMeshGdcef : Node3D
{
    StandardMaterial3D _material;
    TextureRect _view;

    public override void _EnterTree() { }

    public override void _Ready()
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
        float aspect = 1.6f; // the scroll mesh is specifically made for this aspect
        _view.Size = new Vector2(1080, Mathf.RoundToInt(1080 * aspect)); // (1080, 1728) 1080 is arbitrary
        _view.Position = new Vector2(-10000, -10000);
        AddChild(_view);
    }

    public override void _Process(double delta)
    {
        if (_view.Texture is Texture2D tex && _material.AlbedoTexture != tex)
            _material.AlbedoTexture = tex;
    }

    public override void _ExitTree() { }
}

/* created at 2026-06-12, Fri, 17:56 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
