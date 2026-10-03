# Wordverse

Başlangıç noktası: [docs/handoff/HANDOFF.md](docs/handoff/HANDOFF.md). Ardından `MASTER_PROMPT.md`, `KNOWN_ISSUES.md` ve `TASKS.md` dosyalarını oku. Kullanıcıyla Türkçe konuş; mevcut veriyi koru.

“Wordverse projemize kaldığımız yerden devam et” bu repodaki güncel görevi sürdürür. Codex/Claude sırayla aynı HANDOFF ve Git dalını kullanır. Cihaz/ajan değişiminde [CROSS_DEVICE.md](docs/handoff/CROSS_DEVICE.md) ve [SERVICE_ACCESS.md](docs/handoff/SERVICE_ACCESS.md) yönergelerini uygula. Bitmiş fazları tekrarlama; gerçek OS/kabuk, git durumu ve [STATE.json](docs/handoff/STATE.json) aktif dalını kontrol et. Temiz ağaçta `git pull --ff-only`. `npm run doctor` eksik kurulumu/girişi gösterir; rutin eksikleri tamamla. Yerel uygulamayı `127.0.0.1:5360` üzerinde görünür tarayıcıda aç.

## Durum Analiz komutu

Kullanıcı “Durum Analiz” dediğinde anlık Git/devir/test/CI durumunu kontrol edip Türkçe tablo göster: `| Durum | İş | Sonuç / kalan adım |` ve `|---|---|---|`. Bitenler, devam edenler ve yapılacakları somut sonuç/kalan adımla belirt; eski yüzde veya test sonucunu güncel diye sunma. Durum isteği aktif geliştirmeyi iptal etmez; kısa güncellemeden sonra göreve devam et.
