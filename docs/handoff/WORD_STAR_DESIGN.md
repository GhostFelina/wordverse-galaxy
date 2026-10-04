<!-- Yeni2026-10-04 STAR_REFERENCE_PLAN.md ve HANDOFF üst bölümü bu eski tasarım kaydındaki8–24px yüzey geçişi,0.75wheel ve fotoğraftaki yıldızların kalması kararlarının yerine geçer. -->

# Kelime yıldızı sistemi · 2026-10-04

## Son kullanıcı referansları

Masaüstündeki `uzaktan görünüş.png` (103×105) incelendi: küçük beyaz/lavanta çekirdek, dört ince keskin uç, sınırlı halo. `en uzak görüntü aralığı.png` (1852×813) incelendi: OLED siyahı üzerinde geniş Orion, sağa ağırlıklı başlangıç kadrajı. Kullanıcı son talimatıyla maksimum uzaklığı bu kadraja sabitledi; eski 50000 uzak sınırı iptal edildi. Referans dosyaları kullanıcının Masaüstünde kalır; kişisel ekran görüntüsü Git'e kopyalanmadı.

## Görünüm ve davranış

| Durum | Uygulama |
|---|---|
| En uzak | Kamera z≤160; başlangıç ve sıfırlama 160. 75° görüş açısı referanstaki geniş Orion kadrajını korur; eski 50° kadraj nebulayı fazla büyütüyordu. Kelimeler küçük keskin çekirdek, dört optik uç ve dar halo. |
| Parlama | Çekirdekte hafif, yavaş ışık değişimi; azaltılmış hareket tercihinde sabit. |
| Yaklaşma | Ekran çapı 8–24 px arasında nokta ışığı gerçek küresel yüzeye kesintisiz karışır. |
| Yakın yüzey | Ortak 0.45 birim yarıçap; sıcak beyaz emisyon, üç boyutlu hücresel granülasyon, kenara doğru parlaklık azalması, ince korona. Ekranda çözülemeyen granüller yumuşatılır. |
| Hover / klavye odağı | Ölçülü ışık vurgusu. Hit alanı görünüme bağlı; dokunmatik minimum 44 px. |
| Seçim | Mevcut kelime detayını açar; anlamı gösterme, düzenleme/silme akışı korunur. Seçim veri yazmaz. |
| Yıldıza odak | Kamera kaydın sabit koordinatına yaklaşır; wheel yıldız yüzeyinin dışında durur. |
| Yanından geçme | Canvas sürükleme yıldız odağını bırakır; pan ve ileri/geri wheel gezinmesi sürer. Arkada kalan yıldız ekran dışına çıkar. |
| Yeni kelime | Mevcut kayıtlardan en az 10 birim uzakta kalıcı yerleşim; başarılı yerel kayıttan sonra kısa ışık artışı. Mevcut kayıtların koordinatı değişmez. |
| Wheel | Pixel/line/page normalizasyonundan sonra tüm zoom dallarında hareket katsayısı 0.75; önceki hızdan %25 yavaş. |
| Diğer yıldızlar | Üretim sahnesinde cosmic field, 96 Gaia ayrı nokta, dört Trapezium ayrı nokta ve dekoratif demo yıldızı çizilmez. Yalnız kelime kayıtları yıldız olarak çizilir. Orion'un gerçek kaynak dokusunun içindeki fotografik ışık noktaları dokunun parçası olarak kalır. |

## Mimari / veri

`src/word-star-system.js`: tek Points batch, en çok 24 ayrıntılı yüzey ve 24 ince korona; paylaşılan geometri, kayıt ID'sinden kararlı ince doku farklılığı. Bütün kelimeler aynı görsel aile ve yarıçap. `src/main.js` kayıt/arayüz adaptörü; zorunlu ikili yörünge ve zamanla renk değiştirme kaldırıldı. x/y/z (z=0 dahil) korunur. Şema, hesaplar ve öğrenme geçmişi değiştirilmedi. Binlerce kayıt için birim düzeyinde bounded pool doğrulanır; gerçek 5000 yıldız FPS kabulü henüz yapılmadı.

Gaz katmanından sonra yıldızlar ayrı çizilir. Gazın içindeki bir kelime yıldızına fiziksel ışık sönümü henüz hesaplanmaz. Yazılım GPU'sunda durgun rafine gaz önbelleğe alınır; güçlü cihazda yavaş gaz hareketi devam eder. Kamera gezinmesi gazı yeniden çizer.

## Bilimsel dayanak ve sınırlar

[NASA photosphere](https://solarscience.msfc.nasa.gov/surface.shtml): granülasyon ve kenar kararması referansı. [ESA Hubble optik uçları](https://www.esa.int/ESA_Multimedia/Images/2021/07/A_scattering_of_stars): dört ışık ucu teleskop görünümünün parçasıdır; fiziksel sivri yıldız yüzeyi değildir. Doku prosedüreldir; tanımlı gerçek bir yıldızın fotoğrafı ya da bilimsel simülasyonu değildir. Yüzey dönmesi ve ışık değişimi estetik olarak zaman ölçeklenir. Kusursuz 8K/her piksel gözlemsel doğruluk veya her cihazda sabit FPS iddiası yok.

## Doğrulama ve kanıt

`tests/word-star-system.test.js`: sabit koordinatlar, sıfır derinlik, 5000 kayıt/24 yüzey sınırı, kamera arkası, kaynak disposal. `e2e/word-stars.spec.js`: aynı gövdenin uzak/yüzey/yan geçiş/geri dönüşü; gerçek üretim kayıt adaptöründe seçim, ekleme, reload, koordinat korunması, wheel katsayısı ve en uzak sınır. Sentetik fixture gerçek 5360 hesabına veri yazmaz.

`scripts/capture-word-star-evidence.mjs` boş port/fake ortamda aynı üretim yıldız modülünü kullanır; `tests/fixtures/word-star-lab.html` saklama alanına yazmaz. Son test sonuçları HANDOFF/STATE içinde tutulur. Kullanıcı görsel kabulü bekliyor.
