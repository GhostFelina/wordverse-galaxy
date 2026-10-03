# Wordverse yol haritası

İlerleme yüzdeleri yaklaşık teslim durumudur; kabul ancak otomatik ve görsel kanıtla yapılır. Ayrıntı: `MASTER_PROMPT.md`.

| Faz | İlerleme | Kabul ölçütü |
| --- | ---: | --- |
| 0 Denetim ve altyapı | 100% | Audit ve ADR; devir dosyaları; v2/v3 kayıpsız arşiv/migrasyon; Vitest, Playwright, lint, format ve CI; 1440/768/390 ile tema/hareket kanıtları |
| 1 TR/EN/ES | 100% | Tüm UI, about, meta ve hata metinleri üç dilde; tercih sırası; anlam dili ayrı; eksik anahtar CI testi. E-posta şablonları Faz 2'de auth ile oluşturulacak. |
| 2 Hesap ve senkron | Kabul ertelendi | Yerelde gerçek Google + hesap/misafir ayrımı + merge/offline senkron doğrulandı; mail şablonları, avatar bucket, prod auth ve kalan kabul kontrolleri sürüyor |
| 3 Profil | Kalan işler ertelendi | Profil, hedefler, istatistik, tekrar durumu, dışa aktarma, hesap silme ve varsayılan kapalı paylaşım |
| 4 Evren/katalog | Aktif görsel geliştirme | Güncel ≥150 gerçek galaksi, ≥200 bulutsu, toplam ≥1000 asteroid/meteor; ayrıca ≥250 gezegen, ≥25 takım yıldızı; kaynak/lisans; LOD, kamera, sürükleme |
| 5 Evrim ve hafıza | 5% | Yaş ve hafıza ayrı; FSRS; rastgele yıldız, günlük tekrar, ters test ve erişilebilir kontrol |
| 6 Olaylar | 3% | Fizik referanslı kuyruklu yıldız; ≥50 kaynaklı olay; nadirlik ve gözlem günlüğü |
| 7 Marka | 0% | Logo, ikon, OG, marka kılavuzu, optimize varlık ve atıflar |
| 8 GitHub vitrini | 10% | Üç dil README, demo/video, topluluk dosyaları, repo ayarları ve yalnız taslak lansman metinleri |
| 9 Cila | 0% | 5.000 yıldızda FPS hedefi; WebGL fallback; klavye/ekran okuyucu; PWA; Lighthouse ve paylaşım görseli |

Her faz sonunda test + manuel tarayıcı kanıtı, changelog, commit, tag, release ve dağıtım durumu `HANDOFF.md` içinde kaydedilir.

2026-10-03 kullanıcı önceliği: Faz 2 kalan kabulüne sonra dön; son işi tamamlayıp Faz 3–9 geliştir. Faz 3 ilk salt okunur profil/istatistik görünümü eklendi; release/prod yapılmadı.

Yeni öncelik: evren/katalog + olay görselleri. Tek kâinat ve kademeli aktivasyon: yıldız →200 bulutsu →asteroid/meteor →300 gerçek galaksi. En uzak zoomda galaksiler gizli; yıldızlı arka plan serbest, OLED siyah, parlama/patlama/dalga ve profesyonel gerçekçilik ayrı kabul hedefi. Şu anda kademe 2, galaksiler henüz kapalı.
