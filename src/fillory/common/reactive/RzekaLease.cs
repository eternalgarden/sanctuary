/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using Rzeka;

namespace Sanctuary.Common.Reactive;

public static class RzekaLeaseExtensions
{
    // A claim held as an IDisposable: plucks `requested` now, and the matter built by
    // `released` when let go. Put it in Q and the claim can't outlive its owner.
    //
    // Pass `because` when matter caused the request (a lease taken in a Weave). Leave it out
    // when nothing in the river did (taken in _Ready) - that is an honest root emission.
    public static RzekaLease<TReleased> Lease<TRequested, TReleased>(
        this IRzeka rzeka,
        object who,
        TRequested requested,
        Func<TReleased> released,
        params IMatter?[] because
    )
        where TRequested : IMatter
        where TReleased : IMatter
    {
        rzeka.Pluck(who, requested.WithCircumstances(because));
        return new RzekaLease<TReleased>(rzeka, who, released);
    }
}

public sealed class RzekaLease<TReleased> : IDisposable
    where TReleased : IMatter
{
    readonly IRzeka _rzeka;
    readonly object _who;
    readonly Func<TReleased> _released;
    bool _isReleased;

    internal RzekaLease(IRzeka rzeka, object who, Func<TReleased> released)
    {
        _rzeka = rzeka;
        _who = who;
        _released = released;
    }

    // Idempotent, so an early Release and the later Dispose from Q don't release twice.
    // Never stamp the request onto its release: it didn't cause it.
    public void Release(params IMatter?[] because)
    {
        if (_isReleased)
            return;

        _isReleased = true;
        _rzeka.Pluck(_who, _released().WithCircumstances(because));
    }

    // The Q path: released because the owner went away, so there's no cause to stamp.
    public void Dispose() => Release();
}

/* created at 2026-10-25, Sun, 17:14 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
