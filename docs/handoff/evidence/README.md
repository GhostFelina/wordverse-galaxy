# Rendering evidence

New gallery images in `docs/images` are captured from production modules using synthetic records in an isolated ephemeral localhost browser. Reproduce with `node scripts/capture-gallery.mjs`. No personal browser profile or storage is read.

The optional animated starlight gallery uses65 actual compositor PNGs from the desktop home with six synthetic old records and native Chrome/full motion. A720×380 crop omits the controls. GIF encoding uses5fps and one256-color palette; no star brightness or positions are changed in post-processing. [Native core measurements](2026-10-12-scintillation-native.json) record4×4 display luminance against the surrounding nebula, zero position drift and unchanged records. The GIF is an illustrative capture, not calibrated photometry.

`2026-10-12-before-desktop` and `2026-10-12-refined-desktop` contain deterministic general, approach, close and gas-side views. Granulation uses the same record seed; the source image resolution remains1254×1254.

Frame reports distinguish hardware-reported D3D11 and SwiftShader software WebGL. RAF intervals include scheduler/display pacing and are not GPU timer-query measurements. These fixtures do not certify all devices, visible-browser sessions or large collections.

Earlier screenshots document historical synthetic test flows and may show now-disabled visual layers. Current feature descriptions follow the product specification.
