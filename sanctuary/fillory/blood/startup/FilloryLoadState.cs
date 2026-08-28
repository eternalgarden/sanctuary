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

public record StepStatus(StepState State, string Reason = null)
{
    public static readonly StepStatus Pending = new(StepState.Pending);
}

public enum StartupStep
{
    StartingScene,
    UserControllerLoad,
}

// Notice Aborted is never written, it is only derived.
public enum StepState
{
    Pending,
    Cleared,
    Failed,
    Aborted,
}

public record FilloryLoadInfo
{
    ///   ___ ___ __ __             __
    ///  |   Y   |__|  .-----.-----|  |_.-----.-----.-----.-----.
    ///  |.      |  |  |  -__|__ --|   _|  _  |     |  -__|__ --|
    ///  |. \_/  |__|__|_____|_____|____|_____|__|__|_____|_____|
    ///  |:  |   |
    ///  |::.|:. |
    ///  `--- ---'
    /// Well clock for logs and saves. Do not subtract these two because it
    /// it can jump on a timezone change, who knows people might use sanctuary
    /// on long bus rides lol.
    public DateTimeOffset StartedAt { get; init; } = DateTimeOffset.Now;

    /// Godot's monotonic (only moving forward, neat for intervals) clock,
    /// miliseconds since engine's boot
    public ulong StartedAtMesc { get; init; } = Time.GetTicksMsec();

    ///  ☔ Don't forget too add them to the IEnumerable Steps below aswell.
    // these two are pending phase out
    // public StepState StartingSceneLoaded { get; init; } = StepState.Pending;
    // public StepState PlayerSpawned { get; init; } = StepState.Pending;
    //

    //       _   .-')      ('-.         .-') _                      ('-.    .-')    .-') _
    //  ( '.( OO )_   ( OO ).-.    ( OO ) )                   _(  OO)  ( OO ). (  OO) )
    //   ,--.   ,--.) / . --. /,--./ ,--,' ,-.-')    ,------.(,------.(_)---\_)/     '._
    //   |   `.'   |  | \-.  \ |   \ |  |\ |  |OO)('-| _.---' |  .---'/    _ | |'--...__)
    //   |         |.-'-'  |  ||    \|  | )|  |  \(OO|(_\     |  |    \  :` `. '--.  .--'
    //   |  |'.'|  | \| |_.'  ||  .     |/ |  |(_//  |  '--. (|  '--.  '..`''.)   |  |
    //   |  |   |  |  |  .-.  ||  |\    | ,|  |_.'\_)|  .--'  |  .--' .-._)   \   |  |
    //   |  |   |  |  |  | |  ||  | \   |(_|  |     \|  |_)   |  `---.\       /   |  |
    //   `--'   `--'  `--' `--'`--'  `--'  `--'      `--'     `------' `-----'    `--'
    /*
     * In case need arises for a conditional startup process sequence.
     * So: conditional manifest, never conditional gate.
     *
     * The seeding currently goes through one line, Enum.GetValues<StartupStep>().
     *
     * Replacing it with a computed set is a one-line change on the day you get your
     * first optional step. There is nothing to prepare for and nothing to design around.
     * Cost of deferring: one line. That settles it.
     *
     * One distinction worth keeping straight: Adding more static named gates as steps
     * acquire ordering relationships is not what you are asking about and is entirely normal.
     * CanSpawnPlayer today, maybe CanRestoreSession later.
     *
     * Those are fixed prerequisites named in one place, which is the pattern working as intended.
     * Add them freely as needed.
     *
     * What to refuse is a gate whose logic branches on runtime configuration.
     * If you ever find yourself writing CanSpawnPlayer => IsFirstRun ? ... : ...,
     * that is the manifest asking to be conditional instead.
     */
    IReadOnlyDictionary<StartupStep, StepStatus> Steps { get; init; } =
        Enum.GetValues<StartupStep>().ToDictionary(s => s, _ => StepStatus.Pending);

    public FilloryLoadInfo WithStep(StartupStep step, StepState state, string reason) =>
        this with
        {
            Steps = new Dictionary<StartupStep, StepStatus>(Steps) { [step] = new(state, reason) },
        };

    //                     ('-.     .-') _     ('-.    .-')
    //                ( OO ).-.(  OO) )  _(  OO)  ( OO ).
    //    ,----.      / . --. //     '._(,------.(_)---\_)
    //   '  .-./-')   | \-.  \ |'--...__)|  .---'/    _ |
    //   |  |_( O- ).-'-'  |  |'--.  .--'|  |    \  :` `.
    //   |  | .--, \ \| |_.'  |   |  |  (|  '--.  '..`''.)
    //  (|  | '. (_/  |  .-.  |   |  |   |  .--' .-._)   \
    //   |  '--'  |   |  | |  |   |  |   |  `---.\       /
    //    `------'    `--' `--'   `--'   `------' `-----'
    //
    public bool CanSceneSpawn => true;
    public bool CanPlayerSpawn => Steps[StartupStep.StartingScene].State == StepState.Cleared;
    public bool IsLoadComplete => Steps.Values.All(status => status.State is StepState.Cleared);
    public bool IsLoadFailed => Steps.Values.Any(status => status.State is StepState.Failed);

    public TimeSpan Elapsed => TimeSpan.FromMilliseconds(Time.GetTicksMsec() - StartedAtMesc);

    // public IEnumerable<(string Name, StepState state)> Steps =>
    //     new[]
    //     {
    //         (nameof(StartingSceneLoaded), StartingSceneLoaded),
    //         (nameof(PlayerSpawned), PlayerSpawned),
    //     };

    public StepStatus EffectiveState(StartupStep s) =>
        Steps[s].State == StepState.Pending && IsLoadFailed
            ? Steps[s] with
            {
                State = StepState.Aborted,
            }
            : Steps[s];

    public IEnumerable<(StartupStep step, StepStatus state)> Progress =>
        Steps.Keys.Select(x => (x, EffectiveState(x)));
    // public IEnumerable<string> ClearedSince(FilloryLoadInfo previous) =>
    //     Steps
    //         .Where(s => s.Done)
    //         .Select(s => s.Name)
    //         .Except(previous.Steps.Where(s => s.Done).Select(s => s.Name));
}

/* created at 2026-07-28, Tue, 00:33 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
