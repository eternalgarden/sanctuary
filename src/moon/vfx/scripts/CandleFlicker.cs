using Godot;

namespace Sanctuary.Vfx;
public partial class CandleFlicker : OmniLight3D
{
    [Export] public float BaseEnergy = 1.0f;
    [Export] public float EnergyVariation = 0.3f;  // how far will base energy shift
    [Export] public float FlickerSpeed = 3.0f;      // how fast the noise time advances
    [Export] public float PositionDrift = 0.03f;    // metres of horizontal wobble

    [Export] public Color _color1 = new(1.00f, 0.52f, 0.12f);
    [Export] public Color _color2 = new(1.00f, 0.70f, 0.25f);

    // FastNoiseLite is Godot's built-in smooth-noise generator (Perlin / Simplex family).
    // Using four separate instances - each with a different random seed
    private FastNoiseLite _noiseEnergy = new();
    private FastNoiseLite _noiseX      = new();
    private FastNoiseLite _noiseZ      = new();
    private FastNoiseLite _noiseColor  = new();

    private Vector3 _origin;
    private float   _time;

    public override void _Ready()
    {
        _origin = Position;

        // GD.Randi() is Godot's global random uint. Cast to int so seeds differ each run.
        _noiseEnergy.Seed = (int)GD.Randi();
        _noiseX.Seed      = (int)GD.Randi();
        _noiseZ.Seed      = (int)GD.Randi();
        _noiseColor.Seed  = (int)GD.Randi();

        // Slightly different values so the axes never drift in perfect sync.
        _noiseEnergy.Frequency = 1.0f;
        _noiseX.Frequency      = 0.85f;
        _noiseZ.Frequency      = 0.95f;
        _noiseColor.Frequency  = 0.5f;  // colour shifts more lazily than brightness
    }
    
    public override void _Process(double delta)
    {
        _time += (float)delta * FlickerSpeed;

        // GetNoise1D samples the noise curve at a 1-D position, returning a float in [-1, 1].
        // Advancing _time each frame walks along that curve 4 smooth, continuous variation.

        // Brightness, inhrerited from Light3D
        LightEnergy = BaseEnergy + _noiseEnergy.GetNoise1D(_time) * EnergyVariation;

        // Position drift (horizontal only - candle flame sways sideways, not vertically)
        float xDrift = _noiseX.GetNoise1D(_time) * PositionDrift;
        float zDrift = _noiseZ.GetNoise1D(_time) * PositionDrift;
        Position = _origin + new Vector3(xDrift, 0f, zDrift);

        float t = (_noiseColor.GetNoise1D(_time) + 1f) * 0.5f; // Remap noise [-1,1] to [0,1] for Color.Lerp.
        LightColor = _color1.Lerp(_color2, t);
    }
}
