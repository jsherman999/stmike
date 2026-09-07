# Downtown St. Michael, Minnesota — 3D massing model

Created 2026-09-07. A geographically grounded, simplified model of the historic downtown core around Main Street and Central Avenue.

## Interactive viewer

Open `index.html` in a modern browser. Drag to rotate, pinch or scroll to zoom, and select a named view to focus on a landmark. The viewer embeds the map data and loads its pinned rendering libraries from public CDNs, so an internet connection is required.

GitHub Pages is intended to serve the repository's `main` branch from `/` at https://jsherman999.github.io/stmike/.

To regenerate the viewer after editing `build-model.js`, `downtown.geojson`, or `viewer-fragment.html`, run:

```sh
python3 build-viewer.py
```

The included `viewer-shell.html` supplies the standalone page's styling and controls. No ChatGPT session or API key is required to view or rebuild it.

## Files and use

- `downtown-st-michael.glb`: the finished glTF 2.0 binary model. Import with Blender's glTF 2.0 importer or another compatible 3D application. Individual buildings and surface objects remain separate for editing.
- `downtown.geojson`: embedded-source geographic data used to generate the meshes.
- `build-model.js`: the geometry generator; it is also used by the interactive conversation view.
- `export-model.cjs`: exports the model using Node.js and the included dependencies.
- `three.min.js`, `GLTFExporter.js`, `d3.min.js`: pinned runtime dependencies. Their upstream licenses are included.

To rebuild the 3D file, clone this repository, change into its directory, and run:

```sh
node export-model.cjs
```

The output is `downtown-st-michael.glb`. Node.js 18 or newer is required for its built-in Blob and TextEncoder support. No package installation or API key is required.

## Coverage and coordinate system

The model covers approximately **847 × 690 metres** and contains **188 building footprints**. It also contains 126 rendered road/path features, mapped parking, water, and selected green areas. This rectangle represents the historic downtown core, not the whole city or the newer Town Center complex to the east.

- Geographic bounding box: west **-93.6700**, south **45.2068**, east **-93.6592**, north **45.2130**.
- Model origin: longitude **-93.6646**, latitude **45.2099**.
- Units: metres. +X east, +Y up, -Z north.
- Projection: D3 geographic Mercator with scale corrected at the origin latitude. It provides a local metric approximation; it is not a surveyed coordinate reference system.
- Ground datum: Y=0; a 4 m thick display base extends below it. True ground elevation and slopes are not modeled.
- Edge treatment: buildings are included only when their entire mapped outline lies within the selected rectangle. Roads and surface polygons are clipped at the boundary.

## What is mapped and what is estimated

Building outlines and street centerlines come from OpenStreetMap. Data was downloaded on 2026-09-07. Map completeness and business labels depend on contributor updates; retrieval on that date does not imply each feature was surveyed then.

**No building has a height tag in the selected dataset. All heights in this model are estimates.** Nine buildings have mapped floor counts: their heights use 3.1 m per floor plus a 0.6 m roof allowance. The other 179 buildings use category or footprint-based assumptions:

| Building category | Assumed height |
| --- | --- |
| School | 7.5 m |
| Garage or shed | 3 m |
| House / detached / residential / terrace, without floor count | 6.2 m |
| Apartments, without floor count | 10 m |
| Other footprint under 75 m² | 3.5 m |
| Other building | 5.5 m |
| Historic church | 12 m eaves; about 20 m ridge; about 38 m to the cross |

The church follows its mapped footprint. Its gable roof, entrance tower, spire, cross, clock faces, and windows are illustrative additions guided by archival photographs and the National Register description. Their dimensions are not measured. Details such as roof dormers and buttresses are simplified or omitted. Most other buildings are plain extruded volumes with flat tops; this does not assert that their real roofs are flat.

Street widths are taken from an OSM width tag where present, otherwise estimated by road class. Curb strips and center markings are illustrative. The surface colors identify model categories and are not sampled real-world materials. Small surface heights only separate overlapping geometry visually. Terrain, facades, vegetation, utilities, and current construction have not been surveyed.

## Sources and attribution

**Map data © OpenStreetMap contributors, available under the Open Database License (ODbL) 1.0.**

- Map data endpoint used: https://api.openstreetmap.org/api/0.6/map?bbox=-93.670,45.205,-93.654,45.214
- Attribution and contributor information: https://www.openstreetmap.org/copyright
- ODbL 1.0: https://opendatacommons.org/licenses/odbl/1-0/
- Historic church mapped footprint: https://www.openstreetmap.org/way/552455209
- National Park Service, historic property inventory, April 1978: https://npgallery.nps.gov/NRHP/GetAsset/NRHP/79001279_text
- St. Michael Historical Society, church photo gallery: https://www.saintmichaelhistory.org/photo-gallery/st-michael-catholic-church

The supplied geographic database is provided under ODbL 1.0. Preserve attribution and its license notice when sharing or adapting the data or model. The archive includes the geographic input so the model can be reproduced. Reference photographs were consulted but are not redistributed here. Three.js and its GLTFExporter are MIT licensed; D3 is ISC licensed. See the included upstream license files.

## Verification

The GLB was decoded independently and checked for a valid header, UTF-8 scene metadata, buffer/index integrity, finite coordinates, object counts, and geographic extent. It contains 461 meshes and 7,223 triangles. An independent software render of the full area and the church was visually inspected. The interactive-view JavaScript passed a syntax check; live browser controls could not be exercised because the available preview browser blocked local files.
