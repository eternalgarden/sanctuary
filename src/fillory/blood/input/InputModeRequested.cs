/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using Rzeka;

namespace Sanctuary.Blood.Input;

// Take it through RzekaLease rather than plucking it by hand:
//
//   var request = new InputModeRequested(InputMode.Freewalk);
//   Q += Rzeka.Lease(this, request, () => new InputModeReleased(request.LeaseId));
public class InputModeRequested : Matter
{
    // Survives WithCircumstances (it clones), so the id read before stamping still matches.
    public Guid LeaseId { get; } = Guid.NewGuid();
    public InputMode Mode { get; }

    public InputModeRequested(InputMode mode) => Mode = mode;
}

/* created at 2026-10-25, Sun, 17:14 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
