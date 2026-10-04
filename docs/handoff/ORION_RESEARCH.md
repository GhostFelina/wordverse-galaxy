# Orion M42 araştırması ve uygulama kararları · 2026-10-04

## Aktif kullanıcı isteği

Sahnede yalnız Orion ve yıldızlar kalır. Önceki 20 bulutsu isteği iptal edildi. Başlangıçta sağ orta konum, %70 ekran genişliği için ön hacim sınırı; mouse wheel ile ileri/geri, drag ile yön. Asıl kalite referansı [NASA YouTube videosu](https://www.youtube.com/watch?v=fkWrjrdT3Zg&t=58s), **00:58 sonrası**. Video oynatmak veya fotoğrafı yakınlaştırmak yerine etkileşimli hacim kullanılır. Öğrenme kayıtları, bağlaçlar ve hesap verileri silinmez.

## Tek tek incelenen kaynaklar

| Kaynak | İnceleme | Uygulamaya etkisi |
|---|---|---|
| [NASA SVS 30957](https://svs.gsfc.nasa.gov/30957/) | Açıklama, kaynaklar, krediler; görünür ve IR kliplerinden 5'er kare; 178.6 sn birleşik klipten 58/65/75/90/105/120/140/160 sn kareleri | Açık yıldız kümesi, düzensiz gaz vadisi, ön perde ve gerideki toz duvarı; bütün ekranı kaplayan homojen sis azaltıldı |
| [NASA SVS 12086](https://svs.gsfc.nasa.gov/12086/) | Kısa Orion turunun açıklaması ve 45.987 sn animasyondan 5 kare | Trapezium çevresindeki yıldız oluşumu ve gaz sırtları |
| [ESA Hubblecast 106e](https://esahubble.org/videos/hubblecast106e/) | Belgesel/tanıtım sayfası ve kaynak açıklaması | Hubble görünür ışık ile Spitzer kızılötesi ayrımı; bilimsel görüntü ile modellenmiş derinlik birbirine karıştırılmaz |
| [ESA Hubble heic0601a](https://esahubble.org/images/heic0601a/) | Gerçek gözlem görüntüsü, görsel kontrol ve kredi | 10.000×10.000 TIFF kaynağından yerel Orion optik doku ve yıldız piksel izlerini azaltan 3 piksel median gaz rehberi |
| [NASA SVS 30959](https://svs.gsfc.nasa.gov/30959/) | Optik/IR gözlem karşılaştırması, 3840×2160 IR kaynak dosyası ve kredi | Yerel Spitzer renk rehberi; IR renkleri çıplak göz rengi olarak sunulmaz |
| [NASA/JPL 2018 açıklaması](https://www.jpl.nasa.gov/news/nasa-space-telescopes-provide-a-3-d-journey-through-the-orion-nebula/) | Görselleştirme ekibinin yöntem açıklaması | Üç boyutlu nebula derinliğinin bilimsel bilgiyle oluşturulan model olduğu açık |
| [Three r180 cloud örneği](https://github.com/mrdoob/three.js/blob/r180/examples/webgl_volume_cloud.html) | Kaynak kodu tamamen okundu | Mevcut MIT Three bağımlılığındaki ImprovedNoise, Data3DTexture, kutu ışın kesişimi, içeride başlangıç clamp, erken opaklık çıkışı |
| [Donitzo volume renderer](https://github.com/Donitzo/three.js-volume-renderer) | README ve MIT LICENSE | Sönüm ve derinlik konusundaki teknik yaklaşım; kod/bağımlılık kopyalanmadı |
| [jordanade/Nebula](https://github.com/jordanade/Nebula) | Proje açıklaması | Yıldız-gaz geçirgenliği ve uçuş fikirleri; Android motoru veya kodu alınmadı |
| [OpenSpace](https://github.com/OpenSpace/OpenSpace) | Repo ve skybrowser belgeleri | Astronomi motoru/veri ayrımı; hazır Orion hacim verisi bulunduğu iddia edilmiyor |
| [Three forum: cloud depth](https://discourse.threejs.org/t/getting-the-correct-depth-in-ray-march-cloud-example/64037) | Yazarın derinlik ve raymarch sorunu | Saydam katman sıralaması bir kalite sınırı olarak kaydedildi |
| [Toplulukta NASA uçuşu](https://www.reddit.com/r/spaceporn/comments/17yx88j/) | Orijinal NASA kaynağına giden tartışma | Bilimsel iddialar forumdan değil NASA/CDS kaynaklarından alındı |

Video incelemesi yukarıdaki zamanlardan örneklenmiş karelerle yapıldı; tüm belgesellerin her saniyesinin izlendiği veya bütün internetin tarandığı iddia edilmiyor. Araştırma klipleri/kareleri `.git/orion-research` içinde, depoya ve üretim paketine eklenmez.

## Veri ve lisans

- Optik: NASA, ESA, M. Robberto (STScI/ESA), Hubble Space Telescope Orion Treasury Project Team. [ESA kullanım şartları](https://esahubble.org/public/copyright/).
- IR: NASA/Spitzer/JPL-Caltech. [NASA medya şartları](https://www.nasa.gov/nasa-brand-center/images-and-media/).
- Uygulamada kaynak ve kredi bağlantıları Orion panelinde görünür. Metadata dosyasında kaynak/çıktı SHA256 bulunur.
- Gaia DR3: 20 yaydakika görüş alanında 96 gözlenen kaynak, katalog kimlikleri string; RA/Dec, G parlaklığı ve BP-RP katalogdan. ESA/Gaia/DPAC ve CDS/VizieR. Konik sorgu küme üyeliğini kanıtlamaz.
- Dört theta1 Ori A/B/C/D konumu CDS Sesame ile ayrı ayrı çözüldü, yanıt hash ve URL'leri kaydedildi. Eşleşen Gaia kaynaklarında modellenmiş çekirdek derinliği kullanılır.
- Three MIT bağımlılığı üzerinden ImprovedNoise kullanılır. Dış repo kodu veya NASA üretim mesh'i eklenmedi.

## Somut uygulama

- 19 bulutsu görseli ve aktif metadata çıkarıldı; tek Orion kaydı, optik/IR/gaz rehberi paketlendi. Eski katalog fixture'ları tarihsel test verisidir, ana sahnede çizilmez.
- Fotoğraf düzlemleri ve fotoğraf→hacim değiştirme yok. Aynı kutu hacmi dışarıda/içeride raymarch ile çizilir: 64³ deterministik yoğunluk, 12/16/24/32 adım (shader üst sınırı 48), gaz vadisi/kıvrımları, toz sönümü, ön ince perde, ışık gradyanı. Sabit orta nokta örneklemesi ekran rastgeleliği üretmez.
- Gaz ayrı çözünürlükte framebuffer üzerinde çizilip doğru premultiplied alpha ile birleştirilir. Ana yıldızlar ve arayüz çözünürlüğü korunur; yavaş karelerde mevcut adaptif DPR ve gaz adım bütçesi çalışır.
- Gaia yıldızları dünya koordinatlarında sabit kalır. Perspektif boyutu 1.5–18 CSS piksel; ileri gidince büyür ve kameranın arkasına geçince doğal olarak kırpılır. Saydam gazın yıldızlara uyguladığı tam fiziksel sönüm henüz modellenmedi.
- Wheel eksi yönde büyük darbeler sınırlanır, geri çıkış tam zoom aralığına ulaşır. Tekrar başlangıca dönme ve drag serbest pan vardır. Form, dialog ve düğmelerin scroll'u uçuş başlatmaz.

## 8K ve son genişlik/derinlik düzeltmesi

- Gerçek kaynak: [ESA 10K TIFF](https://esahubble.org/media/archives/images/publicationtiff10k/heic0601a.tif), 10000×10000, 139.163.086 bayt. Kaynak ve türev SHA256 metadata içinde.
- 8192×8192 gözlemsel doku 5.013.984 bayt; yapay büyütme veya üretilmiş ayrıntı yok. 4096×4096 masaüstü tabanı, 2048×2048 kompakt başlangıç. Büyük doku desteklenen masaüstünde yakınlaşınca yerelden yüklenir. Bu dosya çözünürlüğüdür; viewport'un her pikselinin 8K çözünürlükte çizildiği veya tüm cihazlarda aynı GPU kalitesinin sağlandığı iddiası değildir.
- Genişlik %70 ana gaz kesiti projeksiyonu; ön kutu sınırı değildir. Derinlik ölçeği 0.8 yarıçaptan 1.15 yarıçapa çıkarıldı. Çok yavaş adveksiyon/yoğunluk hareketi var; reduced-motion sıfır zamanla sabit görüntü verir. Hız ölçülmüş gaz hareketi değildir. İçeri ilerleyen kamera açık gaz vadisine alçalır; sürükleme yön kontrolünü korur.
- Gaz framebuffer çözünürlüğü ölçülen kare süresine göre %25–100 arasında, en çok 1920 px genişlikte değişir. Yavaş cihazlarda 12 adımlı örnekleme ve düşük çözünürlük yakın gazda pütürlenmeye yol açabilir; kaynak 8K olsa da bu görüntü kalite sınırı açıktır.
- Sentetik ve kullanıcı verisinden bağımsız kanıt: `node scripts/capture-orion-evidence.mjs` kendi 5351 sunucusu/tarayıcısında başlangıç ve 8K iç hacim PNG'lerini oluşturur; gerçek 5360 hesabına erişmez.
- Doku mip düzeyleri ekran piksel ayak izi ve kamera yakınlığıyla açık seçilir; erken çıkışlı ray döngüsünde belirsiz örtük türevler kullanılmaz. Son Orion 4/4 tarayıcı testi geçti; ilk cold test 22.7 s, sıcak tam uçuş 12.8 s. Cold tek uçuş 30 s timeout geçmişi performans sınırıdır; gizlenmedi.

## Kabul sınırları

NASA videosu çevrimdışı uzman üretimidir; burada ölçülmüş üç boyutlu gaz tomografisi veya NASA mesh'i yoktur. Görüntüler gözlemsel, yıldız görüş açıları gözlemsel; kamera ölçeği, gaz/yıldız derinliği, ışık yayılımı ve renk karışımı görselleştirme modelidir. Hubble görüntüsü ile Gaia alanı WCS ile birebir kayıtlanmadı. Modellenen vadinin bilimsel birebirlik iddiası yoktur. Kullanıcı son görüntüyü kabul etmeden “ultra gerçekçilik tamamlandı” denmez. Mobil donanım/FPS kabulü ayrıca açıktır.
