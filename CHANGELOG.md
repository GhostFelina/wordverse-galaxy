# Değişiklik kaydı

## [Unreleased] — Faz 2 / 1.12.0 hazırlığı

- Supabase CLI yerel proje yapılandırması ve kullanıcıya ait kayıtlar için RLS/senkron mimari kararı eklendi.
- İlk girişte yerel ve bulut evrenlerini veri kaybı olmadan birleştiren saf çekirdek ve çakışma testleri eklendi; uygulama akışına bağlanması sürüyor.
- IndexedDB birincil yerel evren deposu eklendi. localStorage eşzamanlı kurtarma kopyası olarak kalıyor; yazma yarım kalırsa sürüm numarasıyla yeni kopya seçiliyor. Eski yedek arşivi korunuyor.

## [1.11.0] - 2026-10-02

- Ana uygulama ve Hakkında sayfası TR/EN/ES sözlüklerine taşındı; görünür metinler, hata ve boş durumlar, erişilebilirlik etiketleri, meta ve FAQ JSON-LD çevrildi. İki sayfaya mobil dil seçimi eklendi.
- Tercih sırası, `Intl` tarih/sayı/çoğul biçimleri ve eksik çeviri anahtarı testi eklendi. Altı kanonik dil sayfası build sırasında statik HTML olarak üretiliyor; eski `?lang=` bağlantıları çalışıyor.
- Galaksi başına anlam dili eklendi. v3 yerel verisi ve eski yedekleri v4'e kayıpsız taşınırken eski kayıt korunuyor.
- Üç dilde 15 Playwright akışı, 20 birim testi, statik sayfaların JavaScript açık/kapalı tarayıcı kontrolü ve farklı ekran/tema/hareket görselleri doğrulandı.

## [1.10.0] - 2026-10-02

- Faz 0 denetimi, mimari kararlar, ayrıntılı yol haritası ve ajanlar arası devir sistemi eklendi.
- Eski v2 ve mevcut v3 yerel kayıtlarının ham hâli, açılışta ilk kez IndexedDB arşivine yazılıyor; şema sürümü ayrıca tutuluyor. V2 kelime dizileri ve v3 JSON yedekleri içe alınabiliyor.
- Vitest, Playwright, ESLint, Prettier, TypeScript kontrolü ve GitHub Actions doğrulama hattı kuruldu.
- Tablet üst barı ve mobil alt istatistik taşması düzeltildi. Üç genişlik, iki tema ve iki hareket tercihi için yerel görüntü kanıtları kaydedildi.

## [1.9.0] - 2026-10-02

- Spiral, çubuklu spiral ve parçalı spiral için üç ayrı galaksi görünümü eklendi. Yeni galaksiler en az kullanılan biçimler arasından rastgele seçim yapar; seçim kayıtta ve yedekte kalıcıdır.
- Galaksi başına farklı tohumla disk parçacıkları, gaz katmanları ve renkler çeşitlendirildi. Üç yerel bulutsu bölgesi kelime sayısı büyüdükçe belirir; boş galaksi karanlık kalır.
- Yeni kelime yıldızları dört çizgisiz küme örüntüsüne dağıtılır. Bağlaç gezegenleri bağımsız konumlandırılır; en eski iki yıldızın hareketi korunur.
- Yerel Chrome'da çubuklu ve parçalı sarmal biçimler ayrı test galaksilerinde doğrulandı. NASA/ESA kaynakları ve özgün doku üretimi belgelendi.

## [1.8.0] - 2026-10-02

- “Bağlaç ekle” kayıt türü eklendi. Bağlaçlar galakside kendi gezegenleri olarak görünür; yıldız ve gezegen sayısı ayrı gösterilir. Önceki kayıtlar yıldız olarak kalır.
- Aynı galakside kelime yıldızları ve bağlaç gezegenleri doğal sapmalarla konumlanır. Sekiz NASA/JPL-Caltech gezegen haritası galaksi başına dengeli, eşit kullanımda rastgele seçilir; kayıt başına sabit tutulur. Doku kaynağı uygulamada belgelenir.
- Bağlaç türü düzenleme, arama listesi, olay geçmişi ve JSON yedeğinde korunur. En eski iki kelimenin ikili hareketi yalnız yıldızlara uygulanır.
- Spiral kuyruklu yıldız kaldırıldı. NASA'nın koma, toz ve iyon kuyruğu açıklamalarına göre düz yörüngeli yeni bir görsel çizildi. Meteor geçişi kısaltıldı.
- Yerel Chrome'da kayıt türü formu ve kişisel veriler korunarak galaksi görünümü incelendi.

## [1.7.0] - 2026-10-02

- Kelime yıldızı ayrıntısına “Yıldıza yaklaş” eklendi. Kamera yıldızı yakın planda takip ediyor; sürükleme takibi bırakıyor, Esc veya evren ikonu normal görünüme dönüyor.
- Yakınlaştırma düğmeleri galaksi merkezini kadrajda tutacak şekilde odaklı yakınlaştırma yapıyor.
- Yerel Chrome'da yıldız odağı, yakın gezegen görünümü, Esc ile dönüş ve düğmeyle yakınlaştırma doğrulandı.

## [1.6.0] - 2026-10-02

- Yıldız çekirdeklerinin ışık profili ince kırınım halkalarıyla yenilendi; uzak ve yakın görünüm ayrı ölçeklerde incelendi.
- Seçili kelime yıldızlarına çizgisiz yörüngelerde, yalnız yakınlaşınca görünen sönük gezegenler eklendi. Bir gaz devinde katmanlı halka, yüzey bantları ve yıldıza dönük aydınlık taraf bulunuyor.
- Kısa meteor geçişi kamera alanına göre konumlanıyor; çok uzak ve çok yakın bakışta ekranın dışında kalması önlendi.
- NASA/Webb, Satürn ve ötegezegen ışığı referansları ile Gaia Sky, NASA mission-viz ve OpenSpace incelemesi belgelendi.

## [1.5.0] - 2026-10-02

- NASA galaksi gözlemlerinden esinlenen yeni toz şeridi dokusu, mevcut bulutsu dokusuyla ayrı katmanlarda işlendi; dokularda sözcük yıldızı bulunmuyor.
- Galaksi diski ve arka plan tozu yavaş, farklı hızlarda hareket ediyor. Altı sözcüklü galakside yıldız aralıkları ve tam ekran kamera ölçeği artırıldı.
- Galaksi yoğunluğu kelime sayısıyla büyümeye devam ediyor; boş galaksiye geçildiğinde önceki gaz katmanı hemen temizleniyor.
- Yerel Chrome'da normal ve yalnız evren görünümleri ile boş İspanyolca galaksisi incelendi.

## [1.4.0] - 2026-10-02

- Her değişiklikten sonra evrenin ikinci bir yerel kopyası IndexedDB'ye otomatik yazılıyor.
- Ana tarayıcı kaydı eksik veya bozuksa uygulama açılırken yerel kopyadan kelimeler ve olay geçmişi geri getiriliyor.
- Geçerli ana kayıt ve eski sürümden taşınacak kelimeler, eski bir yedek kopyaya karşı öncelikli kalıyor.
- Kurtarma ve hata durumları için dört yeni veri testi eklendi; JSON yedeği cihazlar arası taşıma için kullanılmaya devam ediyor.

## [1.3.0] - 2026-10-02

- Kalabalık galaksilerde yıldız ışıkları üç toplu katman halinde çiziliyor. 200 yıldızlı Chrome testinde çizim çağrısı 644'ten 20'ye düştü.
- Az yıldızlı galaksiler mevcut ayrıntılı parıltıları koruyor; toplu çizimde yıldız seçimi ve anlam gizliliği doğrulandı.
- Yeni yıldız kümeleri farklı açılarda ve küçük doğal sapmalarla oluşuyor; tekrar eden dizilim azaltıldı.
- Yeniden üretilebilir yoğunluk testi için sahte kelime yedeği üreten betik ve FPS göstergesinde çizim çağrısı sayısı eklendi.

## [1.2.0] - 2026-10-02

- Herkese açık ürün açıklaması ve SSS, arama ve sosyal paylaşım meta verileri, yapılandırılmış veri, site haritası ve favicon.
- Yeni Vercel üretim yayını ve GitHub bağlantısıyla sonraki gönderimlerde otomatik dağıtım.
- Yerel proje adresini 5350 portunda sabitleme; yedek dosyasında yerel tarih kullanma.
- Galaksi düzenleme ve kelime düzenleme formunda son görsel/dil düzeltmeleri.

## [1.1.0] - 2026-10-02

- İngilizce ve boş İspanyolca galaksileri; yeni dil galaksisi oluşturma ve adını düzenleme.
- Yaşa bağlı beyaz doğan yıldız görselliği ve en eski iki kelimenin ikili hareketi.
- Uzak yıldız parlaması, farklı bulutsu katmanları, sözcük kümeleri, meteor ve kuyruklu yıldız hareketleri.
- Kelime anlamını göz ikonuyla açma; yörünge ve yıldızlar arası çizgileri kaldırma.
- Kelime ve galaksi işlemleri için olay geçmişi, JSON yedekleme ve geri yükleme.
- Eski kelimelerin yeni veri modeline kayıpsız aktarımı.
- Arayüzsüz evren görünümü, ürün açıklaması, doğrulama ve güvenlik belgeleri.

## [1.0.0] - 2026-10-01

- İlk kelime evreni: canlı galaksi, kelime yıldızları, düzenleme, arama ve yerel kayıt.
