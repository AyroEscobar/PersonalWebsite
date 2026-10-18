# Credits

Every asset this site ships, with its author, source and licence. The footer and the kit (`/kit`) name the figure and the fonts on every page, in both themes.

## 3D figure

- `src/assets/figure/man.glb`: "Male base" by Артур Мигранов, https://poly.pizza/m/eWGDnQ0jzmH
- Licence: Creative Commons Attribution 3.0 Unported (CC BY 3.0), https://creativecommons.org/licenses/by/3.0/
- Changes for this site are listed in `src/assets/figure/LICENSE.txt` (welded, scaled, simplified, rigged and compressed; the pose and the push are solved at runtime). It is drawn in the site's own unlit vase inks: black figure on the clay in the light theme, red figure on the black gloss in the dark one.
- Credit as shown in the footer: "3D figure: Male base by Артур Мигранов, CC BY 3.0."

## Fonts

Self-hosted woff2 files from fontsource, Latin subset, in `src/assets/fonts/`, each with its licence text beside it. All three are under the SIL Open Font License 1.1 (https://openfontlicense.org/).

| Face | Files | Authors | Source | Licence text |
|---|---|---|---|---|
| Cinzel (variable, wght 400 to 900) | `cinzel-latin-wght-normal.woff2` (@fontsource-variable/cinzel 5.3.0) | Natanael Gama, The Cinzel Project Authors | https://github.com/NDISCOVER/Cinzel | `OFL-Cinzel.txt` |
| EB Garamond (variable upright, wght 400 to 800; static 400 italic) | `eb-garamond-latin-wght-normal.woff2` (@fontsource-variable/eb-garamond 5.3.0), `eb-garamond-latin-400-italic.woff2` (@fontsource/eb-garamond 5.3.0) | Georg Duffner, Octavio Pardo | https://github.com/octaviopardo/EBGaramond12 | `OFL-EBGaramond.txt` |
| Marcellus SC | `marcellus-sc-latin-400-normal.woff2` (@fontsource/marcellus-sc 5.3.0) | Brian J. Bonislawsky, Astigmatic (AOETI), Reserved Font Name "Marcellus" | https://fonts.google.com/specimen/Marcellus+SC | `OFL-MarcellusSC.txt` |

Footer credit: "type: Cinzel, EB Garamond and Marcellus SC, SIL Open Font License."

## Code

- three.js 0.186.1, MIT, https://github.com/mrdoob/three.js/blob/dev/LICENSE (bundled into the lazy scene chunk only).
- React and React DOM 19, MIT, https://github.com/facebook/react/blob/main/LICENSE.
- Everything under `src/scene/` (the frieze, the vase inks, the curvature and noise helpers, the boulder, the figure's solver) is this site's own code.

## Art

No photograph, scan or traced image ships. The posters in `public/poster/`, `public/og.png`, `public/favicon.svg` and `public/apple-touch-icon.png` are rendered from the scene itself (`scripts/poster.mjs`, `scripts/og.mjs`) or drawn for this site. The meander, the tongue band and the ground line are CSS and inline SVG drawn for this site.

The picture the site quotes is the Attic black-figure neck amphora with Sisyphus, Munich 1494 (about 530 BC, Staatliche Antikensammlungen), used as reference only. Titian's and Franz von Stuck's paintings of Sisyphus were references for earlier directions only. None of them ships.
