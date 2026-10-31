using System;
using System.Reactive.Linq;
using Godot;
using Rzeka;
using Sanctuary.Blood.Input;
using Sanctuary.Blood.Startup;
using Sanctuary.Common.Reactive;
using Sanctuary.Forest.Autoloads;

namespace Sanctuary.Fairies.Player.Internal.CharacterController;

public partial class Player : FPSController3D
{
    static IRzeka rzeka => Ursprung.Rzeka;
    CollectibleDisposable Q { get; set; } = new();

    // Cached from InputModeState; the player only reads input in Freewalk.
    InputMode _mode = InputMode.Disabled;

    [Export] public string InputBackActionName { get; set; } = "move_backward";
    [Export] public string InputForwardActionName { get; set; } = "move_forward";
    [Export] public string InputLeftActionName { get; set; } = "move_left";
    [Export] public string InputRightActionName { get; set; } = "move_right";
    [Export] public string InputSprintActionName { get; set; } = "move_sprint";
    [Export] public string InputJumpActionName { get; set; } = "move_jump";
    [Export] public string InputCrouchActionName { get; set; } = "move_crouch";
    [Export] public string InputFlyModeActionName { get; set; } = "move_fly_mode";
    [Export] public Godot.Environment UnderwaterEnv { get; set; }

    // The grass trace emitter's particles. Optional: null if the player scene has no emitter.
    GpuParticles3D? _footprints;

    public override void _Ready()
    {
        Setup();
        _footprints = GetNodeOrNull<GpuParticles3D>("GrassTraceEmitter/Footprints");
        Emerged += OnControllerEmerged;
        Submerged += OnControllerSubemerged;

        Q += rzeka.Weave<InputModeState>(
            this,
            states =>
                states.Subscribe(
                    onNext: s => _mode = s.Current,
                    onError: err => rzeka.Whisper(err)
                )
        );

        // The player spawns during startup, so it is already listening when FilloryReady lands.
        Q += rzeka.Weave<FilloryReady>(
            this,
            ready =>
                ready
                    .Take(1)
                    .Subscribe(
                        onNext: r =>
                        {
                            var request = new InputModeRequested(InputMode.Freewalk);
                            Q += rzeka.Lease(
                                this,
                                request,
                                () => new InputModeReleased(request.LeaseId),
                                r
                            );
                        },
                        onError: err => rzeka.Whisper(err)
                    )
        );
    }

    public override void _ExitTree()
    {
        Q.Dispose();
    }

    public override void _PhysicsProcess(double delta)
    {
        if (_mode == InputMode.Freewalk)
        {
            if (Input.IsActionJustPressed(InputFlyModeActionName))
            {
                FlyAbility.SetActive(!FlyAbility.IsActived());
            }

            Vector2 InputAxis = Input.GetVector(InputBackActionName, InputForwardActionName, InputLeftActionName, InputRightActionName);
            bool InputJump = Input.IsActionJustPressed(InputJumpActionName);
            bool InputCrouch = Input.IsActionPressed(InputCrouchActionName);
            bool InputSprint = Input.IsActionPressed(InputSprintActionName);
            bool InputSwimDown = Input.IsActionPressed(InputCrouchActionName);
            bool InputSwimUp = Input.IsActionPressed(InputJumpActionName);

            Move((float)delta, InputAxis, InputJump, InputCrouch, InputSprint, InputSwimDown, InputSwimUp);
        }
        else
        {
            Move((float)delta);
        }

        // The trace map is painted top-down, so footprints left mid-air or while flying would
        // flatten the grass below. Checked after Move, which updates IsOnFloor.
        if (_footprints is not null)
        {
            _footprints.Emitting = IsOnFloor() && !IsFlyMode();
        }
    }

    public override void _Input(InputEvent @event)
    {
        // Mouse look, only in Freewalk.
        if (@event is InputEventMouseMotion eventMouseMotion && _mode == InputMode.Freewalk)
        {
            RotateHead(eventMouseMotion.Relative);
        }
    }

    private void OnControllerEmerged()
    {
        camera.Environment = null;
    }

    private void OnControllerSubemerged()
    {
        camera.Environment = UnderwaterEnv;
    }
}
