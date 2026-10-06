/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Shaders;

/// <summary>
/// A spreading Lorenz butterfly: thousands of particles born in one tiny ball, integrated
/// through the Lorenz system on the GPU, drifting apart until they trace both wings.
/// Builds its own process material and draw mesh; tune it through the exports below.
/// The inherited particle settings still apply: Amount (particle count), Lifetime (length
/// of one spread cycle) and Explosiveness (1 = all born together, 0 = a continuous stream).
/// </summary>
// [Tool] makes the script also run inside the editor, so the butterfly previews live in the
// 3D viewport and reacts to inspector changes.
[Tool]
public partial class LorenzButterfly : GpuParticles3D
{
    const string ProcessShaderPath = "res://moon/shaders/lorentian_butterfly/lorenz_butterfly_process.gdshader";
    const string DrawShaderPath = "res://moon/shaders/lorentian_butterfly/lorenz_butterfly_draw.gdshader";
    const string TrailShaderPath = "res://moon/shaders/lorentian_butterfly/lorenz_butterfly_trail.gdshader";

    // Half-extent of the attractor in Lorenz units, with margin. Used for the culling box.
    const float AttractorHalfExtent = 32f;

    ShaderMaterial? _process;
    ShaderMaterial? _draw;
    QuadMesh? _quad;
    ShaderMaterial? _trailDraw;
    RibbonTrailMesh? _ribbon;
    GradientTexture1D? _ramp;

    // [ExportGroup] only folds the following exports under a heading in the inspector.
    [ExportGroup("Lorenz system")]
    [Export] public float Sigma { get => _sigma; set { _sigma = value; PushProcess("sigma", value); } }
    [Export] public float Rho { get => _rho; set { _rho = value; PushProcess("rho", value); } }
    [Export] public float Beta { get => _beta; set { _beta = value; PushProcess("beta", value); } }

    [ExportGroup("Motion")]
    /// <summary>Attractor time units per real second.</summary>
    [Export(PropertyHint.Range, "0,5,0.01")]
    public float TimeScale { get => _timeScale; set { _timeScale = value; PushProcess("time_scale", value); } }

    /// <summary>Largest single RK4 step. Smaller is smoother and more expensive.</summary>
    [Export(PropertyHint.Range, "0.0005,0.02,0.0005")]
    public float MaxStep { get => _maxStep; set { _maxStep = value; PushProcess("max_step", value); } }

    [ExportGroup("Seeding")]
    /// <summary>Where every particle is born, in Lorenz coordinates (z is up).</summary>
    [Export] public Vector3 SeedPoint { get => _seedPoint; set { _seedPoint = value; PushProcess("seed_point", value); RestartIfReady(); } }

    /// <summary>Radius of the birth ball. Smaller means the cloud holds together longer.</summary>
    [Export(PropertyHint.Range, "0.00001,1,0.00001,exp")]
    public float SeedRadius { get => _seedRadius; set { _seedRadius = value; PushProcess("seed_radius", value); RestartIfReady(); } }

    [ExportGroup("Look")]
    /// <summary>Metres per Lorenz unit. The attractor is about 50 units across.</summary>
    [Export(PropertyHint.Range, "0.001,1,0.001,or_greater")]
    public float WorldScale { get => _worldScale; set { _worldScale = value; PushProcess("world_scale", value); UpdateVisibilityBox(); } }

    /// <summary>Diameter of each dot, in metres.</summary>
    [Export(PropertyHint.Range, "0.001,0.2,0.001")]
    public float PointSize { get => _pointSize; set { _pointSize = value; if (_quad is not null) _quad.Size = new Vector2(value, value); } }

    /// <summary>HDR multiplier; above 1 feeds the Environment's glow.</summary>
    [Export(PropertyHint.Range, "0,16,0.05")]
    public float Energy { get => _energy; set { _energy = value; _draw?.SetShaderParameter("energy", value); } }

    /// <summary>Colour by speed, slow on the left, fast on the right. Empty uses a built-in night ramp.</summary>
    [Export] public Gradient? ColorRamp { get => _colorRamp; set { _colorRamp = value; if (_ramp is not null) _ramp.Gradient = value ?? DefaultRamp(); } }

    /// <summary>Speed that maps to the right end of the ramp.</summary>
    [Export(PropertyHint.Range, "1,400,1")]
    public float RampSpeed { get => _rampSpeed; set { _rampSpeed = value; PushProcess("ramp_speed", value); } }

    /// <summary>Seconds of fade-in at birth and fade-out before the cycle restarts.</summary>
    [Export(PropertyHint.Range, "0,10,0.1")]
    public float FadeTime { get => _fadeTime; set { _fadeTime = value; PushProcess("fade_time", value); } }

    [ExportGroup("Trails")]
    /// <summary>Draw a fading ribbon behind every particle instead of a dot.</summary>
    [Export] public bool Trails { get => _trails; set { _trails = value; ApplyTrails(); } }

    /// <summary>How many seconds of path each ribbon covers.</summary>
    [Export(PropertyHint.Range, "0.02,2,0.01")]
    public float TrailLength { get => _trailLength; set { _trailLength = value; ApplyTrails(); } }

    /// <summary>Ribbon width at the particle, in metres. It tapers to nothing at the tail.</summary>
    [Export(PropertyHint.Range, "0.001,0.1,0.001")]
    public float TrailWidth { get => _trailWidth; set { _trailWidth = value; if (_ribbon is not null) _ribbon.Size = value; } }

    /// <summary>Bend points along each ribbon. More follows curves better and costs more vertices.</summary>
    [Export(PropertyHint.Range, "2,32,1")]
    public int TrailSections { get => _trailSections; set { _trailSections = value; if (_ribbon is not null) _ribbon.Sections = value; } }

    /// <summary>HDR multiplier for ribbons. They cover far more pixels than dots, so they need less.</summary>
    [Export(PropertyHint.Range, "0,16,0.05")]
    public float TrailEnergy { get => _trailEnergy; set { _trailEnergy = value; _trailDraw?.SetShaderParameter("energy", value); } }

    float _sigma = 10f;
    float _rho = 28f;
    float _beta = 8f / 3f;
    float _timeScale = 0.8f;
    float _maxStep = 0.004f;
    Vector3 _seedPoint = new(1f, 1f, 1f);
    float _seedRadius = 0.01f;
    float _worldScale = 0.05f;
    float _pointSize = 0.015f;
    float _energy = 2f;
    Gradient? _colorRamp;
    float _rampSpeed = 180f;
    float _fadeTime = 1.5f;
    bool _trails = true;
    float _trailLength = 0.25f;
    float _trailWidth = 0.004f;
    int _trailSections = 8;
    float _trailEnergy = 0.12f;

    public LorenzButterfly()
    {
        // Defaults for the inherited GPUParticles3D settings. Godot constructs the node first
        // and then applies whatever the scene file saved, so inspector edits still win.
        Amount = 20000;
        Lifetime = 40.0;
        Explosiveness = 1f;
        // FixedFps 0 runs the particle simulation every rendered frame instead of at a fixed
        // rate with interpolation; the shader sizes its RK4 substeps from DELTA anyway.
        FixedFps = 0;
    }

    public override void _Ready()
    {
        // Particle positions are written in the node's local space (see the shader's
        // start()), so this must stay on.
        LocalCoords = true;

        _process = new ShaderMaterial { Shader = GD.Load<Shader>(ProcessShaderPath) };
        _ramp = new GradientTexture1D { Gradient = _colorRamp ?? DefaultRamp(), Width = 256 };
        _draw = new ShaderMaterial { Shader = GD.Load<Shader>(DrawShaderPath) };
        _quad = new QuadMesh { Size = new Vector2(_pointSize, _pointSize), Material = _draw };
        _trailDraw = new ShaderMaterial { Shader = GD.Load<Shader>(TrailShaderPath) };
        // Cross shape is two ribbons at right angles, so a trail never turns edge-on to the
        // camera and vanishes. The curve tapers the width from full at the particle to zero.
        _ribbon = new RibbonTrailMesh
        {
            Shape = RibbonTrailMesh.ShapeEnum.Cross,
            Size = _trailWidth,
            Sections = _trailSections,
            SectionSegments = 2,
            Curve = TaperCurve(),
            Material = _trailDraw,
        };

        // ProcessMaterial is what simulates the particles (our particles shader);
        // DrawPass1 is the mesh drawn once per particle (dot quad or trail ribbon).
        ProcessMaterial = _process;
        DrawPasses = 1;

        PushAll();
        ApplyTrails();
        UpdateVisibilityBox();
        Restart();
    }

    // _ValidateProperty lets a script adjust how any property (inherited ones included)
    // shows up in the inspector and the scene file. The materials, mesh and culling box are
    // rebuilt by _Ready, so drop them from saving and make them read-only in the inspector.
    public override void _ValidateProperty(Godot.Collections.Dictionary property)
    {
        var name = property["name"].AsStringName();
        if (name != PropertyName.ProcessMaterial && name != PropertyName.DrawPass1 && name != PropertyName.VisibilityAabb
            && name != PropertyName.TrailEnabled && name != PropertyName.TrailLifetime)
            return;

        var usage = (PropertyUsageFlags)property["usage"].AsInt64();
        property["usage"] = (long)((usage & ~PropertyUsageFlags.Storage) | PropertyUsageFlags.ReadOnly);
    }

    void PushAll()
    {
        PushProcess("sigma", _sigma);
        PushProcess("rho", _rho);
        PushProcess("beta", _beta);
        PushProcess("time_scale", _timeScale);
        PushProcess("max_step", _maxStep);
        PushProcess("seed_point", _seedPoint);
        PushProcess("seed_radius", _seedRadius);
        PushProcess("world_scale", _worldScale);
        PushProcess("color_ramp", _ramp!);
        PushProcess("ramp_speed", _rampSpeed);
        PushProcess("fade_time", _fadeTime);
        _draw!.SetShaderParameter("energy", _energy);
        _trailDraw!.SetShaderParameter("energy", _trailEnergy);
    }

    // The inherited TrailEnabled / TrailLifetime are driven from here (and hidden from saving
    // in _ValidateProperty), because turning trails on also needs the draw mesh swapped.
    void ApplyTrails()
    {
        if (_quad is null)
            return;

        TrailEnabled = _trails;
        TrailLifetime = _trailLength;
        DrawPass1 = _trails ? _ribbon : _quad;
    }

    // Setters fire while the scene is still loading, before _Ready has built the materials;
    // those early values are picked up by PushAll instead.
    void PushProcess(StringName uniform, Variant value) => _process?.SetShaderParameter(uniform, value);

    void RestartIfReady()
    {
        if (_process is not null)
            Restart();
    }

    // Godot culls a GPUParticles3D by VisibilityAabb, not by where the particles actually
    // are (the CPU never sees GPU positions). Size it to the whole attractor.
    void UpdateVisibilityBox()
    {
        var half = AttractorHalfExtent * _worldScale;
        VisibilityAabb = new Aabb(new Vector3(-half, -half, -half), new Vector3(2f * half, 2f * half, 2f * half));
    }

    static Curve TaperCurve()
    {
        var curve = new Curve();
        curve.AddPoint(new Vector2(0f, 1f));
        curve.AddPoint(new Vector2(1f, 0f));
        return curve;
    }

    static Gradient DefaultRamp() => new()
    {
        // Two colours, blue (slow) to gold (fast). Blue fades into gold through a pale
        // moonlight white, with no pink or violet in between.
        Offsets = [0f, 0.4f, 1f],
        Colors =
        [
            new Color(0.22f, 0.38f, 0.78f),
            new Color(0.52f, 0.76f, 1.00f),
            new Color(1.00f, 0.85f, 0.55f),
        ],
    };
}

/* created at 2026-10-06, Tue, 14:45 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
