/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using Rzeka;

namespace Sanctuary.Blood.Input;

public class InputModeReleased : Matter
{
    public Guid LeaseId { get; }

    public InputModeReleased(Guid leaseId) => LeaseId = leaseId;
}

/* created at 2026-10-25, Sun, 17:14 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
