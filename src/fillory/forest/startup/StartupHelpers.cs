/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Rzeka;
using Sanctuary.Blood.Startup;

namespace Sanctuary.Forest.Startup;
public static class StartupHelpers
{
    public static StartupStepReached Cleared(StartupStep step, params Matter[] circumstances) =>
        new StartupStepReached(step, true).WithCircumstances(circumstances);

    public static StartupStepReached Failed(StartupStep step, string reason, params Matter[] circumstances) =>
        new StartupStepReached(step, false, reason).WithCircumstances(circumstances);
}

/* created at 2026-08-28, Fri, 14:55 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
