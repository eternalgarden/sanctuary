/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using System.Collections.Immutable;
using Rzeka;

namespace Sanctuary.Blood.Input;

// Written only by the input forest. Every change to the lease set emits, even when Current
// stays the same; consumers that only care about the mode add DistinctUntilChanged(s => s.Current).
[HasState]
public class InputModeState : Matter
{
    public InputMode Current { get; }
    public InputMode Previous { get; }

    // Live leases by id. Deciding which one wins is policy, so it lives in the input forest.
    public ImmutableDictionary<Guid, InputMode> Leases { get; }

    public InputModeState(
        InputMode current,
        InputMode previous,
        ImmutableDictionary<Guid, InputMode> leases
    )
    {
        Current = current;
        Previous = previous;
        Leases = leases;
    }

    public static InputModeState Initial =>
        new(InputMode.Disabled, InputMode.Disabled, ImmutableDictionary<Guid, InputMode>.Empty);
}

/* created at 2026-10-25, Sun, 17:14 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
