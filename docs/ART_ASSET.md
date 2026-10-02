# Bulutsu dokusu

## v1.5.0: galaksi toz şeritleri

- Dosya: `public/assets/galaxy-dust-lanes.png`
- Üretim yöntemi: yerleşik ImageGen aracı, `stylized-concept` kullanım kipi.
- Kullanım: kelime sayısı arttıkça belirginleşen ana gaz ve toz katmanı. Görselin içinde yıldız yoktur; her sözcük yıldızı uygulama tarafından ayrı çizilir.
- Araştırma: NASA'nın [NGC 7331](https://science.nasa.gov/image-detail/c30-1/) ve [NGC 685](https://science.nasa.gov/image-detail/ngc685-1-flat-cont-final/) açıklamalarındaki koyu toz şeritleri, mavi yıldız oluşum bölgeleri ve sıcak çekirdek tonları referans alındı. NASA fotoğrafı kullanılmadı.

### Üretim istemi

> Use case: stylized-concept. Asset type: high-resolution photorealistic gas-and-dust texture for a real-time interactive OLED-black galaxy. Create only diffuse interstellar material, inspired by Hubble observations of inclined spiral galaxies: fine branching rusty-brown dust lanes silhouetted against soft muted cobalt-blue reflection gas, tiny subtle warm hydrogen-alpha rose filaments, and a restrained ivory luminous haze near the central region. Wide 3:2 composition, one continuous loose spiral sweep with dark cavities, layered wisps and convincing astrophotography grain. Material is concentrated in the central 65% and fades smoothly to true black on every edge so it can be layered over a moving Three.js galaxy. Critical: no stars, no isolated luminous points, no galaxy core object, no planets, no lens flare, no beams, no circular graphics, no text, no labels, no logo, no border. Natural telescope-exposure color, high micro-detail, deep blacks, subdued brightness; not fantasy concept art.

## İlk bulutsu katmanı

- Dosya: `public/assets/nebula-gas.png`
- Üretim yöntemi: yerleşik ImageGen aracı
- Kullanım: kelime sayısına göre görünürlüğü ve ölçeği artan, yıldız içermeyen gaz katmanı

## Son istem

> Use case: stylized-concept. Asset type: seamless-feeling deep-space nebula texture for a real-time interactive galaxy, no interface. A physically evocative, photorealistic wide cloud of interstellar gas and fine cosmic dust, resembling a long-exposure astronomical observatory image. Loose spiral flow with layered filaments, dark cavities, delicate indigo and midnight blue with faint violet and warm amber gas near the center. Composition: diffuse cloud concentrated in the middle with soft edges fading smoothly to true black on all sides, no hard border. Critical constraints: ABSOLUTELY NO STARS, no individual points of light, no sun, no planet, no galaxy core object, no lens flare, no text, no logo, no watermark. The application will add each real star separately in code. Rich high resolution fine gas detail and natural subtle luminosity, restrained contrast for OLED black.
