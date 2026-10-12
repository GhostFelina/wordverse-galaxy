# Art assets and provenance

## Active Orion guidance

`public/assets/nebulae/orion-starless.png` is a native **1254 × 1254** AI-edited starless derivative of ESA/Hubble heic0601a. Point sources and optical halos were inpainted; gas microstructure and colors were also altered. It is not an unchanged observation or an 8K texture. No upscaling is claimed.

Credit: NASA, ESA, M. Robberto (STScI/ESA), Hubble Space Telescope Orion Treasury Project Team. The original optical derivatives remain available. `orion-ir.webp` is the NASA/Spitzer/JPL-Caltech infrared guidance image. Media conditions and source links are in [ATTRIBUTIONS.md](../ATTRIBUTIONS.md).

The volume uses a deterministic periodic 96³ density field, finite lobes, mip-filtered world-space filaments and a guidance ridge. Depth is reconstructed for navigation; it is not measured tomography.

## Procedural word photosphere

`public/assets/stars/granulation-128.bin`: 128³ single-channel field, 2,097,152 bytes. Rebuild with `node scripts/build-star-granulation.mjs`. Deterministic cellular heat, radial falloff and soft boundaries are sampled at several scales on the GPU. Limb darkening, warm color and convection are artistic models. SHA256: `567489ea2fa9d8e56f93e9f52fb5f236c32718140e1451316ba917376c91736a`.

Scene, detail preview and PNG card use the same stellar surface and record seed. Export resizes and restores the existing detail renderer, without another idle loop or a new WebGL context.

## Sky experiences

Meteor streak, supernova shell, comet, pulsar, neutron-star merger and illustrative black-hole disk are original procedural GLSL, with no external video/audio asset. A session-only director sequences finite events with quiet intervals; manual selection takes priority and quiet mode disables automatic direction. Reduced motion produces a representative still. The black-hole illustration integrates bounded bent rays through an original thin-disk field and samples the existing gas buffer for local background distortion. Personal stars remain a separate foreground pass. It is an artistic strong-field approximation, not a calibrated Kerr metric, full-scene gravitational simulation or film-media asset. Meteors occur in atmospheres; the overlay does not imply an atmospheric event inside Orion.

## Legacy assets

`nebula-gas.png`, `galaxy-dust-lanes.png`, `galaxy-barred-v1.png` and `galaxy-flocculent-v1.png` were generated for Wordverse with ImageGen. They are artistic textures inspired by telescope morphology, not copied telescope photographs. The corresponding old galaxy layers are currently disabled.

## Local fonts

DM Sans and Space Grotesk variable TTFs are unchanged Google Fonts repository files, under SIL Open Font License1.1. License texts are shipped beside the fonts. [Font sources and credits](../ATTRIBUTIONS.md#local-fonts).

## Original audio

Web Audio synthesis has no external recordings or soundtrack samples. Stereo harmonic voicings, deterministic noise/impulse response, HRTF transient cues and bounded waveshaping are original code. The atmosphere is an artistic sonification, not recorded sound traveling through space. [Web Audio spatialization](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics) defines the browser headphone model; [Dolby web delivery](https://professionalsupport.dolby.com/s/article/Dolby-Audio-and-Dolby-Atmos-in-web-apps?language=en_US) is a separate encoded-media/device pipeline and is not implemented here.
