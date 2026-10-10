/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

namespace Sanctuary.Forest.Scroll.GdcefBridge;

[GlobalClass]
public partial class ScrollDisplaySettings : Resource
{
    [Export(PropertyHint.Range, "0.5,1,0.01")]
    public float FillFraction { get; set; } = 0.9f;

    [Export(PropertyHint.Range, "-1,1,0.01")]
    public float HorizontalOffset { get; set; } = 0f;
}

/* created at 2026-10-09, Fri, 23:14 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
