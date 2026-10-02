# Devir durumu

## Son güncelleme

2026-10-02 · codex · Faz 1 merge commit'i `94bb7d2`; sürüm `1.11.0`.

## Şu an aktif faz ve branch

Faz 0 ve Faz 1 tamamlandı. Aktif dal `main`; PR #4 birleşti. Sıradaki faz Faz 2 `phase/2-auth-sync`.

## Son oturumda yapılanlar

- Galaksi başına öğrenilen dil ve anlam dili ayrıldı; v4 şeması v3/v2 yerel veri ve yedekleri koruyor.
- Ana uygulama, Hakkında sayfası, hata/boş durumlar, erişilebilirlik etiketleri, SEO ve FAQ JSON-LD TR/EN/ES sözlüklerine bağlandı. İki sayfada mobil dil seçici var.
- Açık dil URL'leri `/`, `/en/`, `/es/` ile Hakkında eşleri olarak düzenlendi. Eski `?lang=` bağlantıları da çalışıyor. Build altı statik, JavaScript olmadan okunabilen dil sayfası üretiyor; canonical ve `hreflang` bunları gösteriyor (`981ed0f`).
- Yerelde lint, typecheck, build, format, 20 birim ve 15 Playwright testi geçti. Altı prod preview sayfası JavaScript açık/kapalı tarayıcıda doğrulandı; tarihli görseller `docs/handoff/evidence/` altında. 3 dil × 1440/768/390 × iki sistem teması × iki hareket ayarı kontrol edildi.
- PR #4 `94bb7d2` ile birleşti. Main CI ve Vercel prod geçti. Canlı sitede altı dil sayfası JavaScript açık/kapalı, site haritası ve izole misafir oturumunda kelime ekleme/yenileme geçti. Yerel uygulama kullanıcı için görünür Chrome sekmesinde `http://127.0.0.1:5360/?lang=tr` adresinde açık.

## Yarım kalan iş

- Faz 1 için `v1.11.0` tag/GitHub Release oluşturulacak. Ardından `phase/2-auth-sync` dalı açılıp hesap ve senkron mimarisi uygulanacak.
- `src/i18n.js` profil dilini öncelik sırasına alabiliyor, fakat gerçek profil veri modeli Faz 3'te kurulacak. Şimdilik URL→localStorage→tarayıcı→TR çalışıyor.
- E-posta şablonları Faz 2 auth ile oluşturulacak; şu an üründe e-posta gönderme yok.

## Sıradaki ilk 3 adım

1. Faz 1 kapanış belgelerini commit et, `v1.11.0` tag ve GitHub Release oluştur.
2. `phase/2-auth-sync` dalını aç; Supabase mevcut durumunu, env ve veri güvenliği sınırlarını denetle.
3. Önce RLS'li şema ve yalıtılmış testleri, sonra misafirden hesaba kayıpsız senkron akışını geliştir.

## Dikkat edilmesi gerekenler

- `main` artık v4 anahtarına yazar. Eski v3/v2 anahtarlarını ve arşivlerini silme.
- `.env.local` repoya eklenmez. Gerçek yerel veriye test sırasında dokunma; testler ayrı localhost origin kullanmalı.
- Vercel preview SSO korumalı; dağıtım kontrolü geçti, anonim HTTP duman testi prod üzerinde yapılır.

## Doğrulanmamış iddialar

- 5.000 kayıt/60 FPS hedefi ölçülmedi. IndexedDB engelli gerçek tarayıcı senaryosu manuel sınanmadı.
