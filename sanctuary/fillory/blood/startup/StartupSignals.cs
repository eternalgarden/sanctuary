/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Rzeka;

namespace Sanctuary.Blood.Startup;

public class StartupProcessReady : Matter { }

public abstract class StartupStepMatter : Matter
{
    public bool WasSuccessful { get; }
    public string Reason { get; }

    public StartupStepMatter(bool wasSuccessful, string reason)
    {
        WasSuccessful = wasSuccessful;
        Reason = reason;
    }
}

public class StartingSceneLoaded : StartupStepMatter
{
    public StartingSceneLoaded(bool wasSuccessful, string reason = null)
        : base(wasSuccessful, reason) { }
}

public class StartingPlayerControllerLoaded : StartupStepMatter
{
    public StartingPlayerControllerLoaded(bool wasSuccessful, string reason = null)
        : base(wasSuccessful, reason) { }
}

/* created at 2026-08-15, Sat, 09:48 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
