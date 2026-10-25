/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Blood.Input;

// Who owns input right now. The values' order means nothing: priority is an explicit list in
// the input forest. Add a mode only when the feature that needs it ports.
public enum InputMode
{
    Disabled,
    Freewalk,
    Scrolls,
    UI,
}

/* created at 2026-10-25, Sun, 17:14 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
