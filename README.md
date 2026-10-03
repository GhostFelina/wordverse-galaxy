# Wordverse ✦

[Canlı evren](https://wordverse-galaxy.vercel.app/) · [Nasıl çalışır?](https://wordverse-galaxy.vercel.app/about.html) · [Sürümler](CHANGELOG.md)

[![CI](https://github.com/GhostFelina/wordverse-galaxy/actions/workflows/check.yml/badge.svg)](https://github.com/GhostFelina/wordverse-galaxy/actions/workflows/check.yml) ![Version](https://img.shields.io/badge/version-1.14.0--dev-9dbdff) ![MIT](https://img.shields.io/badge/license-MIT-a5c9ef)

**Öğrendiğin her kelime yaşayan bir galakside yıldız olur.** İngilizce ve İspanyolca için ayrı galaksilerle başla; yeni diller için yeni galaksiler aç. [Nasıl çalışır?](about.html)

> Güncel geliştirme: `phase/4-universe`, 1.14.0; production main v1.11.0. Aşağıdaki eski galaksi görünümü geliştirme dalında yıldız temeliyle değiştirildi. Güncel durum: 200 bulutsu +1000 asteroid +1000 tarihsel meteor gözlemi; 300 galaksi yeniden aktivasyonu bekliyor. Tam devir: `docs/handoff/CLAUDE_BRIEF.md` ve `HANDOFF.md`.

## Özellikler

| Özellik | Davranış |
| --- | --- |
| Kelime yıldızları | Her kelime beyaz doğar. Öğrenildiğinden beri geçen günler, sıkıştırılmış görsel yıldız evreleriyle temsil edilir. |
| İkili yıldız hareketi | Her galaksideki en eski iki kelime ortak kütle merkezi çevresinde döner. Aralarında çizgi yoktur. |
| Canlı galaksi | Bulutsu ve kozmik toz kayıt sayısıyla gelişir. Yıldızlar ve gezegenler hareket eder; kısa meteor ve seyrek kuyruklu yıldız geçişleri olur. |
| Üç galaksi biçimi | Spiral, çubuklu spiral ve parçalı spiral görünümleri galaksi başına farklı disk, toz ve gaz yerleşimi kullanır. Yeni galaksinin biçimi dengeli rastgele seçilir ve saklanır. |
| Çizgisiz yıldız kümeleri | Yeni kelimeler dört gevşek yıldız örüntüsüne yerleşir. Bulutsu bölgeleri galaksi büyüdükçe belirir; boş galakside görünmez. |
| Bağlaç gezegenleri | Formdan “Bağlaç ekle” seçildiğinde kayıt, yıldız yerine NASA/JPL kaynaklı gezegen haritalarından birini taşıyan üç boyutlu bir gezegen olur. Seçim ve konum kaydedilir; düzenleme, arama, geçmiş ve JSON yedeği türünü korur. |
| Gizli anlam | Yıldızın üzerine gelince yalnızca kelime görünür. Türkçe anlam, ayrıntıdaki göz ikonuyla açılır. |
| Galaksiler | İngilizce ve boş İspanyolca galaksileri hazırdır. Yeni dil galaksileri oluşturulabilir, galaksi adları değiştirilebilir. |
| Veri ve geçmiş | Ekleme, düzenleme, silme ve galaksi oluşturma olayları zaman damgasıyla kaydedilir. İkinci yerel kopya otomatik tutulur; JSON yedeği indirilebilir ve içeri alınabilir. |
| Odak görünümü | Tek ikonla bütün arayüz gizlenir; yalnızca evren ve geri dönüş ikonu kalır. |
| Yıldız takibi | Kelime ayrıntısındaki **Yıldıza yaklaş** düğmesi kamerayı hareket eden yıldızda tutar. Esc veya evren ikonu geri döner. |

Fareyle sürükle, tekerlekle yakınlaş, dokunmatik ekranda iki parmak kullan. `Shift+F` yerel FPS ve çizim çağrısı göstergesini açar.

## Hemen çalıştır

Node.js ve npm gerekir. Windows PowerShell veya macOS Terminal içinde:

```bash
npm ci
npm run dev
```

Vite'ın gösterdiği yerel adresi aç. Kontroller için `npm run check` çalıştır.

### Codex / Claude ve Windows / MacBook arasında devam

Geliştirme devri için [CROSS_DEVICE rehberi](docs/handoff/CROSS_DEVICE.md) ve güncel [HANDOFF](docs/handoff/HANDOFF.md). Aktif geliştirme dalı `phase/4-universe`; prod v1.11.0. Kullanıcı isteğiyle Faz 2 kalan kabulü ertelendi; Faz 3–9 geliştirme sürüyor. İlk cihazda `npm run setup:device`, ardından `npm run doctor -- --push-check`. İki ajan için devam mesajı: **wordverse projemize kaldığımız yerden devam et**. Proje klasöründen `npm run resume:codex` veya `npm run resume:claude` doğru dal/erişim/env kontrolüyle ajanı açar. Mac ilk kurulum betiği rehberdedir; hesap girişleri cihazda bir kez tamamlanır.

Kalabalık bir galaksiyi kişisel verileri kullanmadan denemek için `node scripts/generate-benchmark-fixture.mjs 200` komutu geçici dizine JSON yedeği üretir. Bu yedeği ayrı bir yerel test adresinde **Galaksilerim → Yedekten geri yükle** ile aç. 200 yıldızlı testte toplu çizim, çizim çağrısını 644'ten 20'ye düşürdü. Tarayıcı otomasyonunda FPS 1'e kısıtlandığından gerçek ön plan FPS ölçümü ayrıca yapılacak.

## Veriler ve gizlilik

Kelimeler kullanılan tarayıcının **yerel depolamasında**, o adres için saklanır. Her kayıttan sonra IndexedDB içinde ikinci bir yerel kopya oluşturulur; ana kayıt bozulursa uygulama açılışta bu kopyadan kurtarmayı dener. Sayfayı yenilemek verileri silmez. Tarayıcının **tüm site verilerini silmek iki yerel kopyayı da silebilir**. Production v1.11.0 cihazlar arası otomatik eşitleme içermez. Geliştirme dalında hesap başına IndexedDB + Supabase senkronu ve yerel gerçek Google oturumu doğrulandı; prod kabulü ve gerçek iki cihaz testi bekliyor. **Galaksilerim → Evren verilerini ve geçmişi indir** ile JSON yedeği al; yeni adreste **Yedekten geri yükle** ile birleştir. Tarayıcı verilerini silmeden önce yedeğini indir.

Kişisel kelimeler GitHub deposunda veya Vercel dağıtımında bulunmaz. Yedek dosyaları `.gitignore` kapsamındadır. Production v1.11.0 yerel kullanım içindir. Geliştirme dalında isteğe bağlı hesap/bulut saklama bulunur; misafir verisi hesaplardan ayrıdır.

## Astronomi ve görsel yaklaşım

Gerçek yıldız rengi esas olarak sıcaklık ve kütleyle ilişkilidir. Wordverse, kelimenin öğrenilmesinden beri geçen günleri beyaz → sıcak beyaz → sarı → kehribar → kızıl dev → beyaz cüce biçiminde **sanatsal olarak sıkıştırılmış** bir yaşam döngüsüne çevirir. En eski iki kelime, çift nötron yıldızlarının ortak kütle merkezi hareketinden esinlenir; bu bilimsel ölçekte bir simülasyon değildir. Yörünge çizgileri gösterilmez.

Kısa kayan yıldız geçişi sanatsal bir meteor etkisidir. Önceki spiral kuyruklu yıldız kaldırıldı; yeni kuyruklu yıldızın geniş toz kuyruğu ve dar iyon kuyruğu NASA tanımlarına göre ayrı çizilir. Fotoğraf veya video doğrudan kopyalanmadı. Kaynaklar ve tasarım kararları: [Astronomi referansları](docs/ASTRONOMY_REFERENCES.md).

## Teknoloji

Vite, Three.js, GPU nokta çizimi, hafif sprite katmanları ve tarayıcı yerel depolaması. Masaüstü ve mobilde piksel oranı sınırlandırılır. Gaz ve toz dokuları `public/assets/` içindedir; [üretim ve kaynak bilgileri](docs/ART_ASSET.md) belgelenmiştir.

## Sürümler ve katkı

Her yayımlanan güncellemede [SemVer](https://semver.org/) sürümü yükseltilir, [CHANGELOG.md](CHANGELOG.md) güncellenir ve `vX.Y.Z` Git etiketi oluşturulur. Özellikler için küçük sürüm, hata düzeltmeleri için yama sürümü kullanılır. Güvenlik bildirimleri için [SECURITY.md](SECURITY.md) dosyasına bak. Katkı adımları [CONTRIBUTING.md](CONTRIBUTING.md) içindedir.

Uygulama kodu MIT lisanslıdır. NASA/JPL kaynaklı gezegen haritaları MIT kapsamında değildir; [kaynak ve kullanım koşulları](docs/ASTRONOMY_REFERENCES.md) ayrıca belirtilmiştir.

Projeyi yararlı bulduysan [GitHub'da yıldız ver](https://github.com/GhostFelina/wordverse-galaxy).
