# Devir durumu

## Son güncelleme

2026-10-02 · codex · Faz 1 kapanış commit'i `3752ff1`, `v1.11.0` tag/Release; Faz 2 dalı açıldı.

## Şu an aktif faz ve branch

Faz 0 ve Faz 1 tamamlandı. Aktif Faz 2 · `phase/2-auth-sync`; ana dal sürümü `v1.11.0`.

## Son oturumda yapılanlar

- Galaksi başına öğrenilen dil ve anlam dili ayrıldı; v4 şeması v3/v2 yerel veri ve yedekleri koruyor.
- Ana uygulama, Hakkında sayfası, hata/boş durumlar, erişilebilirlik etiketleri, SEO ve FAQ JSON-LD TR/EN/ES sözlüklerine bağlandı. İki sayfada mobil dil seçici var.
- Açık dil URL'leri `/`, `/en/`, `/es/` ile Hakkında eşleri olarak düzenlendi. Eski `?lang=` bağlantıları da çalışıyor. Build altı statik, JavaScript olmadan okunabilen dil sayfası üretiyor; canonical ve `hreflang` bunları gösteriyor (`981ed0f`).
- Yerelde lint, typecheck, build, format, 20 birim ve 15 Playwright testi geçti. Altı prod preview sayfası JavaScript açık/kapalı tarayıcıda doğrulandı; tarihli görseller `docs/handoff/evidence/` altında. 3 dil × 1440/768/390 × iki sistem teması × iki hareket ayarı kontrol edildi.
- PR #4 `94bb7d2` ile birleşti. Main CI ve Vercel prod geçti. Canlı sitede altı dil sayfası JavaScript açık/kapalı, site haritası ve izole misafir oturumunda kelime ekleme/yenileme geçti. Yerel uygulama kullanıcı için görünür Chrome sekmesinde `http://127.0.0.1:5360/?lang=tr` adresinde açık.
- `v1.11.0` tag ve GitHub Release oluşturuldu. Faz 2 dalında Supabase CLI yerel yapılandırması başlatıldı ve ADR-007 senkron/RLS tasarımı kaydedildi.
- `src/sync-merge.js` yerel ve bulut kayıtlarının kimlik çakışmasında iki kopyayı koruyan ilk giriş çekirdeğini içeriyor; üç birim testi geçti. Uygulamaya bağlanmadı. Faz 2 geliştirme sürümü `1.12.0`.

## Yarım kalan iş

- `supabase/config.toml` yerel yapılandırma hazır; hedef projeye bağlantı kurulmadı. `docs/handoff/MASTER_PROMPT.md:134` içindeki proje kimliği bağlı Supabase uygulaması ve CLI hesabında görünmüyor; araç izin hatası verdi. Doğru hesap erişimi gerekli. Farklı projeye değişiklik uygulanmamalı.
- `src/storage-mirror.js:17-85` IndexedDB bugün ayna/arşiv olarak çalışıyor; Faz 2'de birincil yerel depo ve offline kuyruğa geçiş, v4/v3/v2 kayıtlarını koruyarak yapılacak.
- `src/i18n.js` profil dilini öncelik sırasına alabiliyor, fakat gerçek profil veri modeli Faz 3'te kurulacak. Şimdilik URL→localStorage→tarayıcı→TR çalışıyor.
- E-posta şablonları Faz 2 auth ile oluşturulacak; şu an üründe e-posta gönderme yok.

## Sıradaki ilk 3 adım

1. Hedef Supabase proje erişimi yanıtını beklerken yerel IndexedDB birincil depo ve saf merge çekirdeğini uygulama akışına bağla.
2. Doğru Supabase hesabı bağlanınca proje kimliği, mevcut tablolar ve auth ayarlarını yalnız okuyarak doğrula; sonra migration ve RLS testlerini uygula.
3. Üç dilde auth ekranları, gizlilik/koşullar ve misafirden hesaba geçişi tamamla.

## Dikkat edilmesi gerekenler

- `main` artık v4 anahtarına yazar. Eski v3/v2 anahtarlarını ve arşivlerini silme.
- `.env.local` repoya eklenmez. Gerçek yerel veriye test sırasında dokunma; testler ayrı localhost origin kullanmalı.
- Vercel preview SSO korumalı; dağıtım kontrolü geçti, anonim HTTP duman testi prod üzerinde yapılır.

## Doğrulanmamış iddialar

- 5.000 kayıt/60 FPS hedefi ölçülmedi. IndexedDB engelli gerçek tarayıcı senaryosu manuel sınanmadı.
