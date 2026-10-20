/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using Rzeka;

namespace Sanctuary.Blood.SceneLoader;

// Side-channel progress for a threaded scene load. Emitted repeatedly while a
// LoadSceneRequest is in flight, so a loading screen (not necessarily the
// requester) can drive a progress bar. Correlate by RequestId, or show ScenePath.
public class SceneLoadProgress : Matter
{
    public Guid RequestId { get; }
    public string ScenePath { get; }
    public float Fraction { get; } // 0..1

    public SceneLoadProgress(Guid requestId, string scenePath, float fraction)
    {
        RequestId = requestId;
        ScenePath = scenePath;
        Fraction = fraction;
    }
}

/* created at 2026-07-29, Wed, 15:38 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
