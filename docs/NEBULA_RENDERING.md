# Orion volume and personal observatory

Version 1.25 reconstructs the interior as a finite three-dimensional medium. The photographic guide remains recognizable in the overview and fades near its front emission layer. It is never extruded through the whole flight. Interior color, pores, dust and lighting come from a separate world-space field. This is an artistic reconstruction, not measured gas tomography.

## Density and lighting

`node scripts/build-nebula-density.mjs` deterministically builds a 128³ RGBA field: square-root encoded density, directional light visibility, dust and color weight. Compact, warped finite lobes, a cavity, multiscale ridges and feathered boundaries provide structure. A periodic 64³ field supplies smaller erosion. Both are losslessly gzip-compressed `.wvz` assets; dimensions, lengths and SHA256 are recorded in `src/data/nebula-density.json`.

The browser decompresses and validates the assets asynchronously. GPU textures and persistent render targets are prepared before revealing the scene. No 96³ procedural noise loop blocks initial scene setup. The CPU's approximate stellar extinction samples the same loaded base density, including after asynchronous replacement. Fine erosion, advection and the photographed front ridge are visual additions, not calibrated optical depth.

The shader integrates emission and absorption with fixed physical sample spacing, explicit mip footprints, bounded static sample offsets and empty-region rejection. Lighting is baked once instead of evaluated as multiple Gaussian/noise/light functions at every pixel step. Slow advection shares the existing animation preference; reduced motion keeps the gas clock fixed.

## Display and motion

Gas radiance stays in half-float targets until the final ACES/sRGB display pass. The old unsigned-byte target clipped bright linear values before display conversion. A reversible companding path preserves the range on devices without float color targets. A browser calibration patch traverses the production compositor and matches Three's final display transform within three RGB levels, including the fallback.

The volume budget controls both moving and settled resolution. Resting never bypasses a slow device's budget. Fast recovery uses hysteresis; slow frames reduce it quickly. Retained motion/settled targets avoid allocating a full viewport buffer at every gesture. Cached gas animation updates at a slower cadence than crisp stars and controls. Pauses, native dialogs and loop restarts reset timing rather than counting their idle duration as a slow rendered frame.

Wheel cruise is proportional to the finite journey, independent of the remote back plane. Impulses and camera damping are bounded; a stalled frame cannot complete most of a camera transition in one update. Selected-star approach retains its separate safe surface boundary. Version1.26 enables automatic cosmic events during flight while retaining manual priority, quiet mode and learning/focus deferral. View settings stay reachable inside the journey. [Additional volumes and phenomena](NEBULA_EXPERIENCES.md).

## Controls and discovery

View settings store device-local gas density (40–140%), light intensity (60–140%), optional star paths and label mode. Defaults are 85% density, 100% light, paths off and hover labels. Bounded paths connect at most 96 active-galaxy word nodes, have no cycles or degree above three, and hide while approaching a star. They express spatial proximity only. Visible labels avoid overlap and are limited to 24.

Recent discoveries and random-word exploration open existing records. Detail previous/next buttons and arrow keys follow the atlas's current filtered order, or recent order when opened elsewhere. Meaning resets to concealed on every selection. Identity changes clear discovery/navigation state. Coordinates, creation dates and stored history are unchanged.

Instrument Serif italic adds a local hero emphasis face; Space Grotesk and DM Sans retain their other roles. Shared Lucide icons replace mixed utility glyphs. Font and icon licenses are shipped with the assets.

## Reproduction and limits

`node scripts/measure-nebula.mjs <source-root> <label> [software]` runs the same nine-second 1920×1080 route with 240 synthetic word stars in a fresh Chrome profile. It records RAF pacing, CPU submission and disjoint-safe asynchronous GPU timer queries separately. Output defaults to `.tools/nebula-benchmark`; `WORDVERSE_BENCH_OUTPUT` overrides it. A baseline worktree requires its own copy of the benchmark fixture and installed dependencies.

The measured automatic strategies intentionally choose different intermediate resolutions. Results describe the complete adaptive strategy, not equal-resolution shader throughput. Native RTX5060Ti and SwiftShader are two isolated configurations; they do not establish universal device performance. [Raw comparison and capture manifest](handoff/evidence/2026-10-15-observatory/PROVENANCE.json) retain actual browser, viewport and settings.

`node scripts/capture-observatory.mjs` captures high-quality synthetic overview, interior, side, flight, translated discovery and responsive controls. Original telescope files remain available. The active starless guide is an AI-edited native 1254×1254 cleanup, not an 8K observation. [Asset provenance](ART_ASSET.md) and [credits](../ATTRIBUTIONS.md) identify the source and limits.

The final home layout caps display type by viewport height and hides recent discoveries below800px height. Its footer separation is checked with a16px minimum at1920×855 and2560×900, alongside the existing desktop widths.
