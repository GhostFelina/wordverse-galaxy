# Görevler

Durum: `[ ]` bekliyor, `[~]` sürüyor, `[x]` doğrulandı. Sorumlu: codex veya claude. Dal adları faz başlığı altındadır.

## Faz 0 · `phase/0-audit-infrastructure` · codex

- [x] Repo, işletim sistemi, git ve başlangıç testlerini denetle; `AUDIT.md` yaz.
- [x] Ana görev tanımını repoya al; AGENTS/CLAUDE yönlendirmeleri ve devir belgelerini oluştur.
- [x] Hedef mimariyi ADR ile kaydet.
- [x] v2/v3 ham veriyi dönüşümden önce arşivle ve şema sürümünü yaz; arşivin üzerine yazılmamasını test et.
- [x] Eski v2 kelime dizisi ve v3 JSON yedeklerini içe alma testini ekle.
- [x] Vitest, Playwright, ESLint, Prettier ve TypeScript hazırlığını bağla; yerel kontrolleri geçir. CI uzakta push sonrası doğrulanacak.
- [x] Yerel tarayıcıda 1440/768/390, aydınlık/karanlık, azaltılmış hareket kontrolünü yap ve kanıt kaydet. Tablet/mobil taşmalar düzeltildi.
- [x] Changelog ve SemVer; PR #3 main merge, GitHub CI, Vercel preview/prod, canlı duman testi, `v1.10.0` tag ve GitHub Release tamamlandı.

## Faz 1 · `phase/1-i18n` · codex/claude

- [x] Ana uygulama ve Hakkında görünür metinleri, hata/boş durum/tooltip/meta/JSON-LD üç dilde; eş anahtar testi var. Altı statik SEO sayfası üretildi. E-posta şablonları Faz 2 auth ile oluşturulacak.
- [x] Profil→localStorage→tarayıcı→TR önceliği yardımcıda/testte; iki sayfada mobil dil seçimi ve Intl tarih/sayı/çoğul çalışıyor. Gerçek profil tercihi Faz 3 veri modeliyle bağlanacak.
- [x] Öğrenilen dil/anlam dili ayrımı ve v3 koruyan v4 migrasyonu yapıldı; altı statik sayfada canonical ve `hreflang` doğrulandı.
- [x] Üç dilde ana/ekle/ayrıntı/koleksiyon/galaksi ve Hakkında akışları otomatik geçti; 1440/768/390, tema ve hareket kanıtı var. PR #4 merge, main CI, Vercel prod ve altı dil sayfası/izole kelime ekleme duman testi geçti.

## Faz 2 · `phase/2-auth-sync` · codex/claude

- [x] Dört tablolu sürümlü migration hedef Wordverse Dashboard'da uygulandı. RLS iki hesaplı rollback testi geçti; anonim erişim ve doğrudan silme kapalı. Security/Performance Advisor 0 hata/uyarı; kullanılmamış iki FK indeksi korundu.
- [ ] CLI hedef hesap erişimi ve uygulanmış migration geçmişinin eşleştirilmesi (MCP/CLI farklı hesapta).
- [~] İlk girişte galaksi, kelime ve olayların iki taraflı kayıpsız birleşimi için saf çekirdek ve üç birim testi yazıldı; IndexedDB ve hesap akışına henüz bağlanmadı.
- [~] IndexedDB birincil yerel depo uygulamaya bağlandı; üç birim ve bir tarayıcı kurtarma testi geçti. Offline kuyruk, bulut eşitlemesi ve görsel durum göstergesi sırada.
- [~] TypeScript bulut okuyucu ve hesap başına atomik evren/bekleyen işlem önbelleği çekirdeği yazıldı; 8 yeni birim testi geçti. Sürüm koşullu bulut yazma, kuyruk üretimi ve UI bağlantısı sırada.
- [~] Üç dil e-posta kayıt/giriş/doğrulama bildirimi/sıfırlama/çıkış UI yazıldı; Google hazırlık bildirimi var. Gerçek mail/prod auth, OAuth ve URL Configuration henüz doğrulanmadı.
- [~] Üç dil gizlilik/koşullar statik sayfaları hazır; yasal kimlik, saklama ve aktarım güvenceleri tamamlanmalı.
- [x] Supabase prod Site URL ve altı prod/proje-preview/yerel dönüş kalıbı Dashboard'da kaydedildi.
- [~] Wordverse Web OAuth formu hazır; Create ve Secret'ın Supabase'e aktarımı kullanıcıya bırakıldı. Mevcut Cortexia istemcisi ve proje genelindeki markası değiştirilmedi.
- [ ] Misafir modu, IndexedDB birincil depo, ilk girişte kayıpsız merge, offline kuyruk ve soft delete.
- [ ] JSON import/export, avatar bucket, env ve yedek stratejisi; prod auth duman testi.

## Faz 3 · `phase/3-profile` · codex/claude

- [ ] Profil alanları, avatar, istatistik/ısı haritası, tekrar güçlü-zayıf analizi.
- [ ] Hedef/ayarlar, rozetler, JSON+CSV, kalıcı hesap silme, varsayılan gizli paylaşım.

## Faz 4 · `phase/4-universe` · codex/claude

- [ ] Kaynak/lisans kayıtlı 50 galaksi, 100 bulutsu, 250 gezegen, 25 takımyıldızı.
- [ ] Gerçek galaksiye bağlı koleksiyon migrasyonu, morfoloji, LOD ve kesintisiz zoom.
- [ ] Kamera ve dokunmatik; yıldız/gezegen sürükleme, kalıcı konum ve otomatik düzen.

## Faz 5 · `phase/5-memory` · codex/claude

- [ ] Tür kayıt sistemi ve genişletilebilir Entry modeli; `docs/EXTENDING.md`.
- [ ] Gerçekçi yıldız görünümü ve yaşa bağlı geri dönüşsüz evrim; kelimeler kalıcı.
- [ ] FSRS, hafıza görseli, rastgele/günlük/ters tekrar ve telaffuz.

## Faz 6 · `phase/6-events` · codex/claude

- [ ] Fizik referanslı iki kuyruklu kuyruklu yıldız ve sakin nadirlik dağılımı.
- [ ] ≥50 olay, üç dilde kaynaklı bilgi kartları ve gözlem günlüğü.

## Faz 7 · `phase/7-brand` · codex/claude

- [ ] Logo, favicon/PWA/OG/banner görselleri; `BRAND.md`, atıflar ve optimizasyon.

## Faz 8 · `phase/8-showcase` · codex/claude

- [ ] Üç dil README, GIF/video, mimari ve kurulum; lisans/topluluk/şablonlar.
- [ ] Repo açıklaması, topics, önizleme, `good first issue`; platforma özgü lansman taslakları.

## Faz 9 · `phase/9-polish` · codex/claude

- [ ] 5.000 yıldız stres ve Lighthouse; 60/30 FPS bütçesi, LOD ve yükleme.
- [ ] WebGL fallback, klavye/ekran okuyucu, kontrast, hareket azaltma.
- [ ] Çevrimdışı PWA, isteğe bağlı analitik, yüksek çözünürlüklü galaksi indirme.
