/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System.Net;
using System.Net.Sockets;
using Sanctuary.Common.Extensions;

namespace Sanctuary.Forest.Scroll.GdcefBridge;

public partial class PlaneMeshGdcef : Node3D
{
    StandardMaterial3D? _material;
    Texture2D? _browser;
    // TODO the UI url resolution below moves into a dedicated, DI'd url resolver once more
    // browser views than the note get migrated; this class should only receive the url.

    // The UI is built by ui/ (npm run build) into res://moon/browser/dist, which is not
    // tracked in git. In debug runs a live `npm run dev` in ui/ takes precedence, so UI
    // edits show up without a rebuild.
    const string BuiltUi = "res://moon/browser/dist/";
    const int UiDevServerPort = 9001;

    const string NotePage = "components/note/note.html";

    // Fills the note with lorem ipsum and unlocks editing, since nothing on the Godot side
    // sends note data yet.
    const string NoteDebugFragment = "#debug#editable";

    public void Initialize(Vector2I size)
    {
        // TODO replace with DI
        MeshInstance3D mesh = this.GetAllNodesOfType<MeshInstance3D>()[0];

        _browser = ClassDB.Instantiate("CefTexture2D").As<Texture2D>();
        _browser.Set("enable_accelerated_osr", false);
        _browser.Set("texture_size", size);
        _browser.Set("url", ResolveUiRoot() + NotePage + NoteDebugFragment);
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

    static string ResolveUiRoot()
    {
        if (OS.IsDebugBuild() && IsUiDevServerUp())
        {
            GD.Print($"🌐 UI dev server found, loading the note from port {UiDevServerPort}");
            return $"http://127.0.0.1:{UiDevServerPort}/";
        }

        // Still hand out the url, so the scroll shows gdcef's 404 page rather than
        // failing somewhere further away.
        if (!Godot.FileAccess.FileExists(BuiltUi + NotePage))
            GD.PushError(
                $"🌐 Browser UI is not built, {BuiltUi + NotePage} is missing. "
                    + "Run `npm run build` in ui/, or `npm run dev` for a debug run."
            );

        return BuiltUi;
    }

    // A closed localhost port refuses at once, so this only waits when something is
    // listening but slow to accept.
    static bool IsUiDevServerUp()
    {
        using TcpClient client = new();
        try
        {
            return client.ConnectAsync(IPAddress.Loopback, UiDevServerPort).Wait(100);
        }
        catch (Exception e) when (e is AggregateException or SocketException)
        {
            return false;
        }
    }

    public override void _ExitTree()
    {
        // The material outlives this node (shared .tres), so it would otherwise keep the
        // browser alive and rendering after the scroll is gone.
        if (_material is not null)
            _material.AlbedoTexture = null;
        _browser?.Call("shutdown");
        _browser = null;
    }
}

/* created at 2026-06-12, Fri, 17:56 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
