/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Sanctuary.Common.Extensions;

namespace Sanctuary.Forest.Scroll.GdcefBridge;

// Important pixel-perfect setup notes:
// 1. Set texture sampling to Nearest (disable mipmapping)
// 2. Disable TAA, at least at the moment when you want to switch to pix-perf
public partial class PlaneMeshGdcef : Node3D
{
    StandardMaterial3D? _material;
    Texture2D? _browser;
    string _url = "https://tiptap.dev/docs/editor/extensions/nodes/image";

    public void Initialize(Vector2I size)
    {
        MeshInstance3D mesh = this.GetAllNodesOfType<MeshInstance3D>()[0];

        _browser = ClassDB.Instantiate("CefTexture2D").As<Texture2D>();
        _browser.Set("enable_accelerated_osr", false);
        _browser.Set("texture_size", size);
        _browser.Set("url", _url);
        _material = (StandardMaterial3D)mesh.GetActiveMaterial(0);
        _material.AlbedoTexture = _browser;
    }

    // Forward already-mapped input to the CEF browser. These methods are intentionally
    // node-agnostic in gdcef: they read the event's Position and forward it AS-IS, so the
    // caller must pass an event whose Position is in BROWSER PIXELS, not screen space.
    // pixel_scale / device_scale are 1.0 because we pre-map (no linear screen->page scale
    // exists through 3D). focus_on_editable_field = true lets typing land in focused fields.
    public void ForwardMouseButton(InputEventMouseButton ev) =>
        _browser?.Call("forward_mouse_button_event", ev, 1.0f, 1.0f);

    public void ForwardMouseMotion(InputEventMouseMotion ev) =>
        _browser?.Call("forward_mouse_motion_event", ev, 1.0f, 1.0f);

    public void ForwardKey(InputEventKey ev) => _browser?.Call("forward_key_event", ev, false);

    public override void _ExitTree()
    {
        // The material outlives this node (shared .tres), so it would otherwise keep the
        // browser alive and rendering after the scroll is gone.
        if (_material is not null)
            _material.AlbedoTexture = null;
        _browser?.Call("shutdown");
        _browser = null;
    }

    public void PasteText(string text)
    {
        if (string.IsNullOrEmpty(text))
            return;

        // Json.Stringify yields a quoted, escaped string literal that is also valid JS.
        string js = $$"""
            (() => {
                const text = {{Json.Stringify(text)}};
                const target = document.activeElement ?? document.body;
                const data = new DataTransfer();
                data.setData('text/plain', text);
                const handled = !target.dispatchEvent(new ClipboardEvent('paste',
                    { clipboardData: data, bubbles: true, cancelable: true }));
                if (!handled)
                    document.execCommand('insertText', false, text);
            })();
            """;
        _browser?.Call("eval", js);
    }
}

/* created at 2026-06-12, Fri, 17:56 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
