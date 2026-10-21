import averyBigHugUrl from "../../assets/images/averybighug.jpeg"

const loremIpsumHtml = `
<h2>FUSION ENERGY</h2>
<h1>Without fusion, there would be no life on Earth.</h1>
<h3>15,000,000 °C</h3>
<h4>LWhat we see as light and feel as warmth is the result of a fusion reaction in the core of our Sun: hydrogen nuclei collide, fuse into heavier helium atoms and release tremendous amounts of energy in the process.</h4>
<p class="arch">Over billions of years, the gravitational forces at play in the universe have caused the hydrogen clouds of the early universe to gather into massive stellar bodies. In the extreme density and temperature of the stars, including our Sun, fusion occurs.</p>
<p>Over billions of years, the gravitational forces <a href="https://loremipsum.io/generator/?n=5&t=p">lorem ipsum</a> at play in the universe have caused the hydrogen clouds of the early universe to gather into massive stellar bodies. In the extreme density and temperature of the stars, including our Sun, fusion occurs.Over billions of years, the gravitational forces at play in the universe have caused the hydrogen clouds of the early universe to gather into massive stellar bodies. In the extreme density and temperature of the stars, including our Sun, fusion occurs.Over billions of years, the gravitational forces at play in the universe have caused the hydrogen clouds of the early universe to gather into massive stellar bodies. In the extreme density and temperature of the stars, including our Sun, fusion occurs.</p>
<blockquote>
    <p class="arch">oAtoms never rest: the hotter they are, the faster they move. In the Sun's core where temperatures reach 15,000,000 °C, hydrogen atoms are in a constant state of agitation. As they collide at very high speeds, the natural electrostatic repulsion that exists between the positive charges of their nuclei is overcome and the atoms fuse. The fusion of light hydrogen atoms produces a heavier element, helium.</p>
</blockquote>
<p>Duis aute <mark>irure dolor in reprehen</mark>derit in <strong>voluptate velit esse cillum</strong> dolore eu fugiatco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
<p><a target="_blank" rel="noopener noreferrer nofollow" href="https://en.wikipedia.org/wiki/Project_Cybersyn">Project_Cybersyn&nbsp;an&nbsp;example&nbsp;link</a></p>
<p>And a numbered list.</p>
<ol>
    <li>
        <p>list</p>
    </li>
    <li>
        <p>second</p>
    </li>
    <li>
        <p>third</p>
    </li>
</ol>
<p>And this will be a bullet list.</p>
<ul>
    <li>
        <p>a dream</p>
    </li>
    <li>
        <p>within</p>
    </li>
    <li>
        <p>a dream</p>
    </li>
</ul>
<h4>Kotek lapsotek ipsum dolor sit amet, consectetur a dipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud ex<em>ercitation ullamco laboris</em></h4>
<img data-type="media" data-media-src="${averyBigHugUrl}" data-media-state="ready" alt="debug image: averybighug" />
`

// note.ts uses loremipsum.html.toString() to get the HTML string.
// We use a plain object instead of a FAST ViewTemplate because FAST bindings
// are replaced with comment markers when .html is stringified, so ${averyBigHugUrl}
// would not survive the round-trip.
export const loremipsum = {
    html: {
        toString: () => loremIpsumHtml,
    },
}
