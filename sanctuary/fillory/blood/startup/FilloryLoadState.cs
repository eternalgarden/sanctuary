
/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Rzeka;

namespace Sanctuary.Blood.Startup;

[HasState]
public class FilloryLoadState : Matter
{
    public FilloryLoadInfo LoadInfo { get; }

    public FilloryLoadState(FilloryLoadInfo loadInfo) => LoadInfo = loadInfo;
}

/// <summary>
/// The field-bag carried by the matter. It is a <c>record</c> (not a class)
/// specifically so milestones can advance it with the concise
/// <c>prev with { X = true }</c> copy. The matter above must stay a class,
/// because a record cannot derive from the plain-class <c>Matter</c> base.
/// </summary>
public record FilloryLoadInfo
{
    public bool MainSceneLoaded { get; init; }
    public bool PlayerSpawned { get; init; }

    // The "definition of done" for this minimal load: both milestones are in.
    public bool IsLoadComplete => MainSceneLoaded && PlayerSpawned;
}

/* created at 2026-07-28, Tue, 00:33 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
