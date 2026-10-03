# Varlık atıfları

- `public/assets/planets/*.jpg`: [NASA/JPL-Caltech Solar System Simulator haritaları](https://space.jpl.nasa.gov/tmaps/). Kullanım ve doku başına özgünlük notları [docs/ASTRONOMY_REFERENCES.md](docs/ASTRONOMY_REFERENCES.md) içinde. Atıf: **Courtesy NASA/JPL-Caltech**. Gezegen haritaları MIT kod lisansına dahil değildir.
- `public/assets/nebula-gas.png`, `galaxy-dust-lanes.png`, `galaxy-barred-v1.png`, `galaxy-flocculent-v1.png`: Wordverse için ImageGen ile üretilen özgün görseller. İstemler ve astronomi esin kaynakları [docs/ART_ASSET.md](docs/ART_ASSET.md) içinde; doğrudan NASA/ESA fotoğrafı kopyası değildir.
- UI, WebGL shader'ları ve prosedürel dokular: bu repo için yazılmış kod. İncelenen açık kaynak projeler ve astronomi başvuruları [docs/ASTRONOMY_REFERENCES.md](docs/ASTRONOMY_REFERENCES.md) içinde; bu projelerden kod kopyalanmadı.

- `src/data/catalog/galaxies.json`: NASA Hubble Messier sayfalarından M31/M51/M87/M82/M104 kimlik ve uzaklık özeti; kaynaklar her kayıtta. Hiçbir NASA/ESA fotoğrafı kopyalanmadı. `catalog-shape.js`/`catalog-layer.js` özgün MIT kod ve sanatsal morfoloji çalışmaları; sahne ölçeği/yerleşimi gerçek koordinat değildir.

## 300 galaksilik katalog

- `src/data/catalog/galaxies-300.json`: [OpenNGC — Mattia Verga](https://github.com/mattiaverga/OpenNGC), sabit revision `75ca7ff090e1d0081a5b08be70eb3bc45ccd9e06`. **CC BY-SA 4.0**. Lisansın tam metni `src/data/catalog/CC-BY-SA-4.0.txt`; kaynak ve SHA-256 `provenance.json` içinde. Wordverse değişiklikleri: yalnız Type G 300 kayıt seçimi, J2000 koordinatlarını dereceye çevirme, Hubble türünden sanatsal morfoloji, sahne eksen/derinlik sıkıştırması ve seed alanları. Bu uyarlanmış veri aynı CC BY-SA 4.0 lisansıyla sunulur; repo MIT lisansı verinin lisansını değiştirmez.
- `catalog-overview.js`, `flight-field.js` ve atlas/yıldız/gaz dokuları bu proje için özgün prosedürel render kodudur (MIT); katalog kaydının birebir fotoğrafı veya gözlenmiş yıldız konumları değildir. X referans videosunun medyası/kodu kullanılmadı.

- `space-details.js`: M42/M57/M1 türleri her kayıttaki NASA Hubble Messier sayfasından doğrulandı. Bulutsu dokuları ve asteroid geometrisi özgün MIT prosedürel koddur; fotoğraf kopyası yok, renk/boyut/yerleşim sanatsal. `cosmic-field.js` yıldızları gözlenmiş yıldız kataloğu değildir.

## 200 bulutsu, asteroid ve tarihsel meteor katalogları

- `nebulae-200.json`: OpenNGC sabit revision 75ca7ff090e1d0081a5b08be70eb3bc45ccd9e06, Mattia Verga ve katkıda bulunanlar; CC BY-SA 4.0. Tür/RA/Dec/açısal boyut dönüşümü ve sanatsal sahne konumları; uyarlanmış veri aynı lisansla. Tam lisans catalog klasöründe; SHA256 ve değişiklikler expansion-provenance.json.
- `asteroids-1000.json`: NASA/JPL Small-Body Database Query API 1.0, 1000 numaralı ana kuşak asteroid (MBA), çap/albedo/yörünge/epoch gerçek verileri. Ceres cüce gezegen olduğu için hariç. Kaynak API dokümanı: https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html. Veriler MIT kod lisansına dahil edilmez; kaynak şartları ve atıf geçerli.
- `fireballs-1000.json`: NASA/JPL CNEOS Fireball API 1.2; 1000 ayrı tarihsel atmosfer gözlemi. Tarihler UTC, enerji dönüşümü joule; eksik ölçü null. Meteorlar canlı olay/meteor taşı değildir. https://ssd-api.jpl.nasa.gov/doc/fireball.html. API istekleri birer birer, uygulama User-Agent, cache ve sürüm kontrolüyle importer'da; tarayıcı API çağırmaz.
- `public/assets/planets/earth-natural-color.jpg`: NASA Goddard Blue Marble 2002, Reto Stöckli / Robert Simmon / MODIS ekipleri; kaynak JPEG değiştirilmedi. https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/. Satelit mozaik, seçilen meteor gününün görüntüsü değil. Özgün kaynak ve SHA256 earth-texture-provenance.json. Bu dosya eski JPL topografik earth.jpg haritasından farklıdır.
- `nebula-volume.js`, `celestial-system.js`, `asteroid-orbit.js`: özgün MIT render kodu. Bulutsu gaz hacmi, kaya biçimi/boyut sıkıştırması ve meteor izinin yönü sanatsal/şematik; gözlenmiş fotoğraf veya kesin fiziksel 3B simülasyon olarak sunulmaz.

## Wordverse yükseltme özgün sahne

`premium-bodies.js` yıldız granülasyon/limb ve prosedürel gezegen yüzeyi özgün GLSL; fotoğraf/katalog ölçümü iddiası yok. `showcase-scene` sanatsal sentetikdemo, üçüncü taraf video/müzik varlığı içermez. Yerel kullanıcıreferansları yalnız incelendi; dağıtılanasset olarak kopyalanmadı. Three r180 tone/color shaderchunklisansı mevcutThreeMIT olarak korunur.
