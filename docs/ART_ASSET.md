# Bulutsu dokusu

## v1.9.0: galaksi biçimleri

- `public/assets/galaxy-barred-v1.png`: çubuklu sarmal için merkez çubuğu, iki ana kol, koyu toz şeritleri ve soluk mavi/pembe gaz bölgeleri.
- `public/assets/galaxy-flocculent-v1.png`: parçalı sarmal için kesintili, tüy gibi kollar ve katmanlı yıldız oluşum bölgeleri.
- Üretim: yerleşik ImageGen aracı. NASA/Hubble galaksi sınıfları ve parçalı sarmal gözlemlerinden esinlenen özgün dokular; NASA/ESA fotoğrafları kopyalanmadı.
- Kenarlar şeffaftır. Görseller arka plan gazı olarak kullanılır; kullanıcının kelime yıldızları uygulamada ayrı ve etkileşimli çizilir. Doku içinde ince dekoratif ışık noktaları da bulunabilir; bunlar kelime kaydı değildir.

### Çubuklu sarmal istemi

> Create a photorealistic barred spiral galaxy gas-and-dust cutout for an OLED-black real-time scene, viewed from a shallow oblique angle. A distinctly elongated warm central bar, two sweeping broken arms, dark branching dust lanes, sparse cobalt-blue star-forming gas and muted rose hydrogen knots. Restrained astrophotography exposure, fine turbulent structure, transparent fading border. No interface, text, planets or decorative lens flare.

### Parçalı sarmal istemi

> Create a realistic face-on flocculent spiral galaxy gas-and-dust cutout, inspired by Hubble imagery of feathered spiral arms. Many fragmented wispy segments, dark inter-arm voids, subtle amber central bulge, cold blue star-forming patches and dim violet gas, with natural fine-grain telescope texture. Transparent fading border for compositing on an OLED-black scene. No interface, text, planets or dramatic lens flare.

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


## Orion yıldızsız türev · 2026-10-04

- Dosya: `public/assets/nebulae/orion-starless.png`
- Yerleşik imagegen **edit**; giriş `orion-gas.webp` (ESA/Hubble heic0601a türevi). Özgün 2K/4K/8K dosyalar korunur.
- Çıkışın gerçek çözünürlüğü **1254×1254**, 1,997,279 bayt; prompt 4096 istedi fakat araç bu boyutu döndürdü. Upscale yapılmadı, 8K sayılmaz.
- Yıldızlar, optik uçlar ve halo inpaint edildi. Gazdaki küçük detaylar/renkler de üretim sırasında değişti; bu dosya değişmemiş gerçek Hubble gözlemi değildir. Üretim yıldızsız sahnesi bu türevi kullanır; gaz derinliği modellenir.
- Kredi: NASA, ESA, M. Robberto (STScI/ESA), Hubble Space Telescope Orion Treasury Project Team; yıldızsız düzenleme: Wordverse/imagegen. Kaynak medya koşulları ATTRIBUTIONS içinde.
- Son prompt (yerleşik araç; CLI/API kullanılmadı):

> Use case: precise-object-edit. Asset: starless Orion nebula gas texture for an interactive 3D astronomical scene. Edit the supplied square Orion Hubble-derived texture. Remove EVERY star and point of light, large and small, colored and white, including all cross-shaped diffraction spikes, blue glows and halos surrounding stars, and the bright cluster. Inpaint each removed star with the local nebular gas and dust filaments that belong behind it. Strict invariants: preserve the original entire square framing, orientation, every large dust silhouette, major filament position, sharp gaseous texture, original black, violet, rose and orange colors, overall brightness and all large nebula forms. Do not move, crop, rotate, brighten or redesign the nebula. Only remove the stars and their optical artifacts. No replacement celestial objects, no artificial dots, no speckles, no text, no UI. High-fidelity photorealistic texture with no remaining star points. Request a high-resolution square 4096x4096 output.
# Prosedürel kelime yıldızı granülasyonu · 2026-10-04

`public/assets/stars/granulation-128.bin`: 128³ tek kanallı byte alanı, 2,097,152 byte. `node scripts/build-star-granulation.mjs` ile yeniden üretilebilir. Periyodik Voronoi hücre boşluğu modellenir; GPU doğrusal örnekleme, küresel koordinat deformasyonu ve yavaş hareket uygular. Wordverse kaynak kodundan üretilmiştir; üçüncü taraf görsel veya gerçek yıldız yüzeyi fotoğrafı değildir. Her karedeki 27 komşu aramasının maliyetini kaldırmak için önceden hesaplanır.
