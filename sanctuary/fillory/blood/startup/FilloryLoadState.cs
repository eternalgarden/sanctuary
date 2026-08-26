/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using System.Collections.Generic;
using System.Linq;
using Godot;
using Rzeka;

namespace Sanctuary.Blood.Startup;

[HasState]
public class FilloryLoadState : Matter
{
    public FilloryLoadInfo LoadInfo { get; }

    public FilloryLoadState(FilloryLoadInfo loadInfo) => LoadInfo = loadInfo;
}

public enum StepState { Pending, Cleared, Failed }

public record FilloryLoadInfo
{
    /// Well clock for logs and saves. Do not subtract these two because it
    /// it can jump on a timezone change, who knows people might use sanctuary
    /// on long bus rides lol.
    public DateTimeOffset StartedAt { get; init; } = DateTimeOffset.Now;

    /// Godot's monotonic (only moving forward, neat for intervals) clock,
    /// miliseconds since engine's boot
    public ulong StartedAtMesc { get; init; } = Time.GetTicksMsec();

    ///   ___ ___ __ __             __
    ///  |   Y   |__|  .-----.-----|  |_.-----.-----.-----.-----.
    ///  |.      |  |  |  -__|__ --|   _|  _  |     |  -__|__ --|
    ///  |. \_/  |__|__|_____|_____|____|_____|__|__|_____|_____|
    ///  |:  |   |
    ///  |::.|:. |
    ///  `--- ---'
    ///  ☔ Don't forget too add them to the IEnumerable Steps below aswell.
    public StepState StartingSceneLoaded { get; init; } = StepState.Pending;
    public StepState PlayerSpawned { get; init; } = StepState.Pending;

    // The "definition of done" for this minimal load: both milestones are in.
    public bool IsLoadComplete => Steps.All(step => step.state is StepState.Cleared);
    public bool IsLoadFailed => Steps.Any(step => step.state is StepState.Failed);

    public TimeSpan Elapsed => TimeSpan.FromMilliseconds(Time.GetTicksMsec() - StartedAtMesc);

    public IEnumerable<(string Name, StepState state)> Steps =>
        new[]
        {
            (nameof(StartingSceneLoaded), StartingSceneLoaded),
            (nameof(PlayerSpawned), PlayerSpawned),
        };

    public IEnumerable<string> ClearedSince(FilloryLoadInfo previous) =>
        Steps
            .Where(s => s.Done)
            .Select(s => s.Name)
            .Except(previous.Steps.Where(s => s.Done).Select(s => s.Name));
}

/* created at 2026-07-28, Tue, 00:33 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
