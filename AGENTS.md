# Wordverse

Aktif görsel yükseltme şartnamesi: [WORDVERSE_MASTER_UPGRADE.md](docs/handoff/WORDVERSE_MASTER_UPGRADE.md). U0–U9 ayrı yükseltme fazlarıdır; güncel durum HANDOFF/STATE içindedir. Eski görsel taleplerle çelişirse yeni şartname ve son kullanıcı talimatı uygulanır.

Başlangıç noktası: [docs/handoff/HANDOFF.md](docs/handoff/HANDOFF.md). Ardından `MASTER_PROMPT.md`, `KNOWN_ISSUES.md` ve `TASKS.md` dosyalarını oku. Kullanıcıyla Türkçe konuş; mevcut veriyi koru.

“Wordverse projemize kaldığımız yerden devam et” (kısa biçimi de geçerli) bu repodaki güncel görevi sürdürmek demektir. Codex/Claude sırayla aynı HANDOFF ve Git dalını kullanır. Önce gerçek OS/kabuk ve git durumunu kontrol et; temiz ağaçta `git pull --ff-only`, aktif dal [STATE.json](docs/handoff/STATE.json). `npm run doctor` eksik kurulum/giriş adımını gösterir; rutin eksikleri tamamla. Bitmiş fazları tekrarlama. Cihaz/ajan devri: [CROSS_DEVICE.md](docs/handoff/CROSS_DEVICE.md); servis erişimi: [SERVICE_ACCESS.md](docs/handoff/SERVICE_ACCESS.md). Yerel uygulamayı `127.0.0.1:5360` üzerinde görünür tarayıcıda aç.

## Durum Analiz komutu

Kullanıcı “Durum Analiz” dediğinde anlık Git/devir/test/CI durumunu kontrol edip Türkçe tablo göster: `| Durum | İş | Sonuç / kalan adım |` ve `|---|---|---|`. Bitenler, devam edenler ve yapılacakları somut sonuç/kalan adımla belirt; eski yüzde veya test sonucunu güncel diye sunma. Durum isteği aktif geliştirmeyi iptal etmez; kısa güncellemeden sonra göreve devam et.
