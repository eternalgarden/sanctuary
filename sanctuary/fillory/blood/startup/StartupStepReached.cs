
/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Rzeka;

namespace Sanctuary.Blood.Startup;

public class StartupStepReached : Matter
{
    public StartupStep StartupStep { get; }
    public bool WasSuccessful { get; }
    public string Reason { get; }

    public StartupStepReached(StartupStep startupStep, bool wasSuccessful, string reason = null)
    {
        StartupStep = startupStep;
        WasSuccessful = wasSuccessful;
        Reason = reason;
    }
}

/* created at 2026-08-15, Sat, 09:48 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
