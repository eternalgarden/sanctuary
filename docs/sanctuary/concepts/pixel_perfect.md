Some considerations must be taken in the current setup for the note browser ui rendered on a 3D plane mesh to display pixel-perfect.

- Texture sampling on the material that displays the browser texture must be set to `Nearest` (disabled mipmapping)
- `TAA` antialiasing must be disabled at least at that moment