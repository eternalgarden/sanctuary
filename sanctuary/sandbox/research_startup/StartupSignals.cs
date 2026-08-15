/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using Rzeka;

namespace Sanctuary.Sandbox.Startup;

// In real fillory each of these lives one-per-file under Sanctuary.Blood.
// Grouped here only to keep the sandbox demo easy to read.
//
// Naming is past tense: "X happened, and as a result Y also happened."

/// <summary>The orchestrator asks for the main scene to be brought in.</summary>
public class MainSceneLoadRequested : Matter { }

/// <summary>A subsystem reports the main scene is loaded and live in the tree.</summary>
public class MainSceneReady : Matter { }

/// <summary>A subsystem reports the player exists and is live in the tree.</summary>
public class PlayerSpawned : Matter { }

/// <summary>Startup finished; the game is playable. Anyone may react to this.</summary>
public class GameStarted : Matter { }

/* created at 2026-07-28, Tue, 00:33 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
