# Devir durumu

## Son güncelleme

2026-10-02 · codex · son uygulama commit'i `981ed0f`; ana dal tabanı `v1.10.0`, Faz 1 sürüm adayı `1.11.0`.

## Şu an aktif faz ve branch

Faz 0 tamamlandı ve `v1.10.0` yayımlandı. Aktif Faz 1 · `phase/1-i18n` · taslak PR #4. CI ve Vercel preview geçti; ana dala henüz alınmadı.

## Son oturumda yapılanlar

- Galaksi başına öğrenilen dil ve anlam dili ayrıldı; v4 şeması v3/v2 yerel veri ve yedekleri koruyor.
- Ana uygulama, Hakkında sayfası, hata/boş durumlar, erişilebilirlik etiketleri, SEO ve FAQ JSON-LD TR/EN/ES sözlüklerine bağlandı. İki sayfada mobil dil seçici var.
- Açık dil URL'leri `/`, `/en/`, `/es/` ile Hakkında eşleri olarak düzenlendi. Eski `?lang=` bağlantıları da çalışıyor. Build altı statik, JavaScript olmadan okunabilen dil sayfası üretiyor; canonical ve `hreflang` bunları gösteriyor (`981ed0f`).
- Yerelde lint, typecheck, build, format, 20 birim ve 15 Playwright testi geçti. Altı prod preview sayfası JavaScript açık/kapalı tarayıcıda doğrulandı; tarihli görseller `docs/handoff/evidence/` altında. 3 dil × 1440/768/390 × iki sistem teması × iki hareket ayarı kontrol edildi.
- PR #4 uzak `verify`, Vercel ve Preview Comments kontrolleri geçti. Yerel uygulama kullanıcı için görünür Chrome sekmesinde `http://127.0.0.1:5360/?lang=tr` adresinde açık.

## Yarım kalan iş

- `CHANGELOG.md:3` Faz 1 değişiklikleri ve sürüm kaydı güncellenecek; PR #4 hazır edilip ana dala alınacak, `v1.11.0` tag/Release ve prod duman testi yapılacak.
- `src/i18n.js` profil dilini öncelik sırasına alabiliyor, fakat gerçek profil veri modeli Faz 3'te kurulacak. Şimdilik URL→localStorage→tarayıcı→TR çalışıyor.
- E-posta şablonları Faz 2 auth ile oluşturulacak; şu an üründe e-posta gönderme yok.

## Sıradaki ilk 3 adım

1. Changelog ve devir belgelerini commit edip PR #4 kontrollerini tekrar doğrula.
2. Faz 1 kabul kanıtını gözden geçir; PR'ı ana dala al, `v1.11.0` tag ve GitHub Release oluştur.
3. Canlı sitede üç dil URL'si, Hakkında ve kelime ekleme/yenileme duman testi yap; ardından Faz 2 dalına geç.

## Dikkat edilmesi gerekenler

- `main` v3 anahtarıyla çalışır; Faz 1 dalı v4'e yazar. Eski v3/v2 anahtarlarını silme.
- `.env.local` repoya eklenmez. Gerçek yerel veriye test sırasında dokunma; testler ayrı localhost origin kullanmalı.
- Vercel preview SSO korumalı; dağıtım kontrolü geçti, anonim HTTP duman testi prod üzerinde yapılır.

## Doğrulanmamış iddialar

- 5.000 kayıt/60 FPS hedefi ölçülmedi. IndexedDB engelli gerçek tarayıcı senaryosu manuel sınanmadı.
