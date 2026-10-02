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
- [~] Changelog ve SemVer; PR #3 ile main merge; GitHub CI, Vercel preview/prod ve canlı duman testi geçti. Tag ve GitHub Release kapanış commit'inden sonra yapılacak.

## Faz 1 · `phase/1-i18n` · codex/claude

- [~] Çeviri dosyaları ve anahtar bütünlüğü CI testi başladı; bütün HTML/UI/hata/meta/e-posta metinleri bekliyor.
- [ ] Profil→localStorage→tarayıcı→TR dil sırası, üst bar seçici, mobil erişim, Intl biçimleri.
- [ ] Öğrenilen dil/anlam dili ayrımı ve v3 verisi koruyan migrasyon; hreflang.
- [ ] Üç dilde tüm ekranlar ve iki doğrulama yolu; sürüm/deploy/handoff.

## Faz 2 · `phase/2-auth-sync` · codex/claude

- [ ] Supabase migration SQL, tüm tablolarda RLS ve çapraz kullanıcı testleri.
- [ ] E-posta kayıt/giriş/doğrulama/sıfırlama, Google OAuth, üç dilde gizlilik/koşullar.
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
