/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using System.Collections.Immutable;
using System.Linq;
using System.Reactive.Linq;
using Godot;
using Rzeka;
using Sanctuary.Blood.Input;
using Sanctuary.Forest.Autoloads;

namespace Sanctuary.Forest.InputArbiter;

// Decides who owns input. Requesters lease a mode (see RzekaLease), the highest-priority
// mode with a live lease wins, and the result is published as InputModeState. It never
// sees a key press: components read input themselves and obey the current mode.
public partial class InputArbiter : Node
{
    static IRzeka rzeka => Ursprung.Rzeka;
    CollectibleDisposable Q { get; set; } = new();

    // Highest first. This list is the whole policy.
    static readonly InputMode[] Priority =
    [
        InputMode.UI,
        InputMode.Scrolls,
        InputMode.Freewalk,
        InputMode.Disabled,
    ];

    // _EnterTree, not _Ready: it runs top-down before any _Ready, so the arbiter is listening
    // before anyone below it in Fillory can lease.
    public override void _EnterTree()
    {
        // Load-bearing order: seed before the reducer registers. Plucking [HasState] matter
        // that a Loom already owns throws.
        rzeka.Pluck(this, InputModeState.Initial);

        // Reducer – single writer of InputModeState.
        //
        // Outputs are stamped with their trigger only. Auto-stamping would record the previous
        // state, and every state holding its predecessor keeps the whole session's history alive.
        Q += rzeka.Loom<InputModeState, InputModeState>(
            this,
            state =>
                Observable.Merge(
                    rzeka
                        .Scry<InputModeRequested>()
                        .WithLatestFrom(
                            state,
                            (requested, s) =>
                                Next(s, s.Leases.SetItem(requested.LeaseId, requested.Mode))
                                    .WithCircumstances(requested)
                        ),
                    rzeka
                        .Scry<InputModeReleased>()
                        .WithLatestFrom(state, (released, s) => (released, s))
                        // Releasing an unknown id (already released, or never leased) changes nothing.
                        .Where(x => x.s.Leases.ContainsKey(x.released.LeaseId))
                        .Select(x =>
                            Next(x.s, x.s.Leases.Remove(x.released.LeaseId))
                                .WithCircumstances(x.released)
                        )
                )
        );
    }

    public override void _ExitTree()
    {
        Q.Dispose();
    }

    static InputModeState Next(InputModeState s, ImmutableDictionary<Guid, InputMode> leases)
    {
        InputMode current = Priority.FirstOrDefault(leases.ContainsValue, InputMode.Disabled);

        // Previous is the mode before the last *mode* change, so a lease that doesn't move
        // Current leaves it alone.
        InputMode previous = current == s.Current ? s.Previous : s.Current;

        return new InputModeState(current, previous, leases);
    }
}

/* created at 2026-10-25, Sun, 17:20 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
