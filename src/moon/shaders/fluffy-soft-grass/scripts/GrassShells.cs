/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Shaders;

[Tool]
public partial class GrassShells : MultiMeshInstance3D
{
    [Export]
    int LayerCount { get; set; } = 32;

    [Export(PropertyHint.Range, "0.05,0.6")]
    float PileHeight { get; set; } = 0.08f;

    [Export]
    ShaderMaterial? GrassMaterial { get; set; }

    [Export(PropertyHint.Layers3DRender)]
    uint VisualLayers { get; set; }

    MeshInstance3D? meshInstance;

    public override void _Ready()
    {
        meshInstance = GetParentOrNull<MeshInstance3D>();
        if (meshInstance is not null)
        {
            if (meshInstance.Layers > 0)
            {
                VisualLayers = meshInstance.Layers;
            }
        }
        BuildShells();
    }

    public override void _Notification(int what)
    {
        switch (what)
        {
            case (int)NotificationParented:
            case (int)NotificationEditorPostSave:
                UpdateConfigurationWarnings();
                BuildShells();
                break;
        }
    }

    public override void _ExitTree()
    {
        if (meshInstance is null)
            return;

        meshInstance.Layers = VisualLayers;
    }

    void BuildShells()
    {
        if (GetParentOrNull<Node>() is null || meshInstance is null || GrassMaterial is null)
            return;

        // TODO: Grass on only one material slot, not the whole mesh. Each Blender material
        // slot is a separate surface. Export a surface name (Mesh.SurfaceGetName survives slot
        // reordering), copy only that surface into a new ArrayMesh (SurfaceGetArrays +
        // AddSurfaceFromArrays) for the MultiMesh, and hide just that surface on the parent
        // with SetSurfaceOverrideMaterial instead of Layers = 0, which hides every surface.
        // Overriding it with GrassMaterial itself makes the parent the floor sheet, since a
        // non-instanced mesh is INSTANCE_ID 0.
        MultiMesh multiMesh = new()
        {
            TransformFormat = MultiMesh.TransformFormatEnum.Transform3D,
            Mesh = meshInstance.Mesh,
            InstanceCount = LayerCount,
        };

        for (int i = 0; i < LayerCount; i++)
        {
            multiMesh.SetInstanceTransform(i, Transform3D.Identity);
        }

        // Disabling all visible layers for this mesh because we replace it with fluff grass
        meshInstance.Layers = 0;

        SetInstanceShaderParameter("instance_count", LayerCount);
        SetInstanceShaderParameter("pile_height", PileHeight);
        MaterialOverride = GrassMaterial;
        ExtraCullMargin = PileHeight;

        Multimesh = multiMesh;
    }

    public override string[] _GetConfigurationWarnings()
    {
        MeshInstance3D? meshInstance = GetParentOrNull<MeshInstance3D>();

        List<string> complaints = [];
        if (GetParentOrNull<Node>() is null)
        {
            complaints.Add("GrassShells cannot be a root Node.");
        }

        if (meshInstance is null)
        {
            complaints.Add(
                $"Parent of GrassShells tool needs to be of type MeshInstance3D to operate."
            );
        }

        if (GrassMaterial is null)
        {
            complaints.Add("GrassMaterial is not set.");
        }

        return [.. complaints];
    }
}

/* created at 2026-10-28, Wed, 09:16 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
