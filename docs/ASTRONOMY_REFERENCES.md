# Astronomi ve görsel tasarım referansları

Bu proje fiziksel ölçekli simülasyon değil, öğrenme verisinin astronomiden esinlenen görselleştirmesidir. Referanslardaki ilkeler, kelime verisini okunur tutacak biçimde uyarlanır.

## Yıldız ve hareket

- [NASA/Webb: kırınım sivrileri](https://science.nasa.gov/asset/webb/webbs-diffraction-spikes/) — Parlak yıldızların çevresindeki ince sivriler teleskop optiğinin görünümüdür. Yeni çekirdek dokusundaki kırınım halkaları ve sivriler seçici, ölçülü bir görüntü efekti olarak kullanılır.
- [NASA: ötegezegen ve yıldız parlaklığı karşıtlığı](https://science.nasa.gov/astrophysics/programs/exep/technology/) — Gezegenler ana yıldızlarından çok sönüktür. Wordverse gezegenleri yalnız yakın bakışta ve düşük ışıkla gösterir; ölçülen fiziksel parlaklık oranlarını bire bir simüle etmez.
- [NASA: yıldız rengi ve sıcaklığı](https://science.nasa.gov/exoplanets/stars/) — Sıcak yıldızlar mavi/beyaz, soğuk yıldızlar turuncu/kırmızı görünür. Kelime yaşına bağlı renk yolculuğu bilimsel yaşam süresinin sanatsal sıkıştırmasıdır.
- [NASA: Güneş benzeri yıldız yaşam döngüsü](https://science.nasa.gov/resource/the-life-cycle-of-a-sun-like-star-annotated/) — Kızıl dev ve beyaz cüce evrelerinin görsel adları için referans.
- [ESA Gaia: yıldızların galaktik yörüngeleri](https://www.cosmos.esa.int/web/gaia/dr3-where-do-the-stars-go-or-come-from) — Yıldızlar galaksinin ortak kütleçekim alanında dolanır. Wordverse bu hareketi kararlı, yavaş yörüngelerle temsil eder.
- [NASA: çift yıldız sistemleri](https://imagine.gsfc.nasa.gov/science/objects/binary_stars1.html) ve [LIGO: çift nötron yıldızı](https://ligo.org/science-summaries/GW170817BNS/) — En eski iki kelime ortak kütle merkezi etrafında, eşit olmayan yarıçaplarla döner. Gerçek nötron yıldızlarının oluşum ve birleşme fiziği kelimelere uygulanmaz.

## Bulutsu ve küme

- [NASA/Hubble: NGC 7331](https://science.nasa.gov/image-detail/c30-1/) ve [NGC 685](https://science.nasa.gov/image-detail/ngc685-1-flat-cont-final/) — Koyu toz şeritlerinin mavi kollar ve sıcak merkez önünde görünümü, v1.5.0 gaz dokusunun renk ve katman düzenine referans oldu. Fotoğraflar uygulamaya kopyalanmadı.
- [NASA: bulutsu türleri](https://science.nasa.gov/universe/stories/quick-reads/decoding-nebulae/) — Mavi yansıma bulutsusu ve sıcak ışıma bulutsusu farklı ışık katmanlarıyla temsil edilir. Boş galakside bulutsu yoktur.
- [NASA: açık yıldız kümeleri](https://science.nasa.gov/mission/hubble/science/universe-uncovered/hubble-star-clusters/) — Yeni kelimeler yedi yıldızlık gevşek kümelere dağılır. Küme yıldızları aynı yönde yakın hızlarla hareket eder.
- [NASA/Hubble: takım yıldızları](https://science.nasa.gov/image-detail/galactic-conjunction-2/) — Takım yıldızları bakış açısından görünen örüntülerdir. Wordverse örüntüyü bağlantı çizgileri olmadan yıldızların konumuyla kurar.

## Gezegen ve halka

- [NASA: Satürn halkaları ve gölge](https://science.nasa.gov/resource/shadow-and-ringshine/) — Yakın plandaki halkalı gezegenin sönük halka katmanları ve gölgeli diski için referans.

## Kuyruklu yıldız ve meteor
- [NASA: kuyruklu yıldızın çekirdeği, koması ve iki kuyruğu](https://science.nasa.gov/solar-system/comets/nov2024-night-sky-notes/) — Beyazımsı toz kuyruğu geniş ve hafif kavisli; mavi iyon kuyruğu daha ince ve düzdür. İki kuyruk parçacıklarla çizilir.
- [NASA/JWST: kuyruklu yıldız 238P/Read](https://science.nasa.gov/asset/webb/comet-238pread-nircam-image/) ve [ESA Rosetta görüntüleri](https://www.esa.int/ESA_Multimedia/Images/2014/09/Rosetta_comet_observed_with_Very_Large_Telescope) — Küçük çekirdek ve yumuşak koma yoğunluğu için görsel referans.
- [NASA: meteor tanımı](https://science.nasa.gov/sun/the-atmosphere-after-dark/) — Kayan yıldız meteor, atmosferdeki kısa ışık çizgisidir. Uygulamadaki kısa geçiş bir uzay sahnesi efekti olarak açıkça sanatsaldır; yavaş kuyruklu yıldızdan ayrıdır.

## Açık kaynak incelemesi

- [ESA Gaia Sky](https://github.com/pandygui/gaiasky) — Gözlemci uzaklığına göre yıldız görünümü ve galaksi içinde gezinme yaklaşımı incelendi.
- [NASA mission-viz](https://github.com/nasa/mission-viz) — Three.js tabanlı yörünge ve gezegen sahnesi incelendi.
- [OpenSpace](https://github.com/OpenSpace/OpenSpace) — Gezegen görüntüsü ile derin uzay nesnelerini farklı ölçeklerde sunma yaklaşımı incelendi.
- [andrewdcampbell/galaxy-sim](https://github.com/andrewdcampbell/galaxy-sim) — WebGL'de yüksek sayıda parçacık ve kamera etkileşimi.
- [N0rvel/galaxy_sim](https://github.com/N0rvel/galaxy_sim) — GPU tabanlı galaksi parçacıkları ve performans ayarları.
- [BasilOmsha/Galaxy-Simulator](https://github.com/BasilOmsha/Galaxy-Simulator) — Spiral kollarda diferansiyel dönüş yaklaşımı.
- [BlindByte98/ASTRO](https://github.com/BlindByte98/ASTRO) — Çoklu yıldızlarda kütle merkezi hareketi.

Bu depolardan kod veya varlık kopyalanmadı. Tasarım ve performans yaklaşımları incelendi. Dünya dışı uzay görünümü ve kullanıcının çizgi istememesi nedeniyle gezegen yörüngesi çizgileri kullanılmadı.

## Kullanıcının paylaştığı hareket referansı

- [Dain'in X videosu](https://x.com/dain0x/status/2105666705938665789) bir yapay zekâ ajan haritasını renkli kümeler ve bağlantı çizgileriyle gösteriyor. Hareket ve derinlik duygusu incelendi; Wordverse gerçek uzay estetiği hedefi ve çizgisiz yıldız tercihi nedeniyle ağ bağlantılarını kullanmıyor.
