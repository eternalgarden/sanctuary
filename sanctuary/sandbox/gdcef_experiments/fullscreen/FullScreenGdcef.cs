/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Godot;

namespace Sanctuary.Sandbox;

public partial class FullScreenGdcef : Control
{
    GodotObject _browser;
    TextureRect _view;

    public override void _Ready()
    {
        // godot_cef is a GDExtension with no C# bindings - instantiate by name
        // via ClassDB and drive it dynamically (.Set for properties, .Call for
        // methods). CefTexture IS-A TextureRect, so it's a self-contained webview.
        _browser = ClassDB.Instantiate("CefTexture").AsGodotObject();

        // Accelerated (GPU/DMA-BUF) OSR does NOT present on this machine: it's a
        // hybrid AMD iGPU + NVIDIA dGPU laptop on X11, and the DMA-BUF surface is
        // rendered on NVIDIA but composited through the AMD-driven display, so
        // cross-GPU import silently fails - you get a valid Texture2DRD that paints
        // nothing. Software OSR uses a normal CPU texture and works. Only revisit
        // accelerated=true under single-GPU (PRIME offload) or Wayland.
        _browser.Set("enable_accelerated_osr", false);

        _browser.Set(
            "url",
            "https://sketchfab.com/3d-models/manul-63904e8b8e0042ffa678ec6c929d063b"
        );

        // Add it and let it fill the window. SetAnchorsAndOffsetsPreset (not the
        // plain SetAnchorsPreset) also zeroes the offsets, otherwise the node
        // stays 0×0 and nothing draws even though the texture is valid.
        _view = (TextureRect)_browser;
        AddChild(_view);
        SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect); // this fills window
        _view.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect); // view fills this
    }
}

/* created at 2026-06-12, Fri, 14:07 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
