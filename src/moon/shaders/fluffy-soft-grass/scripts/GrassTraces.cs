/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Shaders;

public partial class GrassTraces : SubViewport
{
    Camera3D? camera;

    public override void _EnterTree()
    {
        camera = GetChild<Camera3D>(0);
        Print(camera.Name);
        RenderingServer.GlobalShaderParameterSet("trace_map", GetTexture());
    }

    public override void _Ready() { }

    public override void _Process(double delta)
    {
        if (camera is null) return;
        Vector3 pos = camera.GlobalPosition;
        RenderingServer.GlobalShaderParameterSet("trace_center", new Vector2(pos.X, pos.Z));
        RenderingServer.GlobalShaderParameterSet("trace_size", camera.Size);
    }

    public override void _ExitTree() { }
}

/* created at 2026-10-29, Thu, 17:43 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
