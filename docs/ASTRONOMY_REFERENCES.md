# Astronomy references

## Active visual interpretation

- [ESA/Hubble Orion heic0601a](https://esahubble.org/images/heic0601a/): optical color guidance. The active starless derivative is AI-edited; volume depth is artistic.
- [NASA/Spitzer Orion](https://svs.gsfc.nasa.gov/30959/): infrared color guidance.
- [NASA black-hole anatomy](https://science.nasa.gov/universe/black-holes/anatomy/) and [NASA accretion-disk visualization](https://svs.gsfc.nasa.gov/13326): disk morphology and bent light as references. Wordverse's shader uses a bounded strong-field ray approximation and locally distorts gas; it is not a calibrated Kerr solver. [NASA warped-world visualization](https://www.nasa.gov/universe/nasa-visualization-shows-a-black-holes-warped-world/) informs the apparent back-side disk geometry. Reference media are not copied into the event shader.
- [NASA stellar explosions](https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/hubble-stellar-explosions/): expanding supernova-shell inspiration. The duration and dimensions are compressed, not measured.
- [NASA meteors and meteorites](https://science.nasa.gov/solar-system/meteors-meteorites/): distinction between atmospheric light and interstellar objects. Wordverse's meteor overlay is artistic.

## Deferred catalog sources

OpenNGC, NASA/JPL Small-Body Database, CNEOS historical fireballs and Gaia DR3 retain their separate provenance in `src/data/catalog` and `src/data/nebula-environments.json`. Deferred layers do not constitute visible features. Data adaptation and licenses are in [ATTRIBUTIONS.md](../ATTRIBUTIONS.md).

- [NASA star lifecycle](https://science.nasa.gov/mission/webb/star-lifecycle/): real evolution depends on mass. Wordverse uses a compressed illustrative sequence, not a stellar clock.
- [NASA neutron-star kilonova](https://science.nasa.gov/asset/hubble/neutron-star-collision-creates-kilonova/): binary merger and ejecta inspiration. No reference media or waveforms are copied.

- [NASA comet facts](https://science.nasa.gov/solar-system/comets/facts/): distinct dust and ion tails inform the original comet silhouette. Displayed trajectories and times are artistic.
- [NASA pulsars](https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/hubble-pulsars/): rotating beams inform the restrained pulsar accent. Wordverse slows the pulse for a calm view; it does not represent a measured rotation rate.
