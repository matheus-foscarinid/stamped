# 3D globe view

The current map data is Natural Earth 110m: about 10.6k points, ~14 KB gz per projection.

| Option | Added JS (gz) | Data (gz) | Effort |
|---|---|---|---|
| Hand-written orthographic projection on the 2D canvas | ~3-4 KB | ~16.6 KB lon/lat at 0.05° | 3-4 days |
| Same, with d3 `geoOrthographic` + `geoPath` | 7.6 KB (measured) | same | 1.5-2 days |
| Custom WebGL + earcut | ~5-7 KB | 35-60 KB of triangles | 6-8 days |
| three.js | 185 KB | same as WebGL | 3-4 days |
| globe.gl | 559 KB | GeoJSON | 1-2 days |
| MapLibre globe | 287 KB | vector tiles | 2-3 days |
| cobe | 5.9 KB | built in | can't fill countries or pick them |

## Recommendation

Draw the globe on the existing canvas with a small hand-written orthographic projection. Fall back to d3's projection if clipping at the horizon gets hard.

- Page grows from ~41.8 to ~45 KB. A `globe-110m.bin` with lon/lat is fetched only when someone switches to the globe, like the other projection files today.
- Rotating 10.6k points takes under 1 ms a frame. Filling the countries costs about the same as the flat map.
- Picking reuses `isPointInPath`, so there's no new hit-testing code.
- Hardest part: clipping big shapes at the horizon (Antarctica, Russia, Canada). Split them into ~30° tiles at build time, fill from the tiles and draw borders from the original rings.
- Drag rotates the globe with inertia, which turns off under reduced motion. Drop the pixel ratio to 1.5 while dragging.
- Tiny countries get a dot and a tap target near their centre.
- WebGL is only worth it if canvas can't hold 60 FPS. It would need its own script file, which `check:dist` blocks today.

The FPS figures are estimates, not measured on real phones.
