# Devir durumu

## Son güncelleme

2026-10-02 · codex · commit: `daa46ac` (Faz 0 kapanışı), `v1.10.0` release. Faz 1 çalışma dalında yeni commit henüz yok.

## Şu an aktif faz ve branch

Faz 0 tamamlandı. Aktif Faz 1 · `phase/1-i18n`.

## Son oturumda yapılanlar

- `git pull --ff-only` yapıldı; başlangıçta çalışma ağacı temizdi.
- Mevcut 11 Node testi ve Vite build geçti. Three.js WebGL, v3 localStorage ve IndexedDB ayna yapısı incelendi.
- Ana görev tanımı, devir belgeleri ve migrasyon öncesi ham veri arşivi eklendi.
- V2 ve v3 JSON içe alma testleri dahil 14 birim testi; lint, typecheck, build ve Playwright e2e geçti.
- Chrome'da yıldız ayrıntısı, anlam açma ve zoom manuel denendi. 12 ekran görüntüsü `evidence/` içinde; tablet ve mobil taşmalar düzeltildi.
- PR #3 CI geçti; Vercel preview ve prod deploy hazır. Canlı URL'de izole Chromium ile kelime ekleme/yenileme kalıcılığı ve about sayfası geçti.
- `v1.10.0` tag ve GitHub Release yayımlandı; main CI tekrar geçti. Faz 1 için metin envanteri ve ilk çeviri altyapısı oluşturuldu.

## Yarım kalan iş

- Faz 1 çeviri JSON'ları şu an yalnız çekirdek anahtarları içeriyor; DOM/dinamik metinler henüz taşınmadı. Dil seçici henüz yok.

## Sıradaki ilk 3 adım

1. `index.html` ve `src/main.js` görünür metinlerini eksiksiz üç dil sözlüğüne taşı; dil seçiciyi bağla.
2. `about.html`, meta/OG/JSON-LD ve `hreflang` için yerelleştirme stratejisini uygula.
3. Anlam dili için v3 verisini koruyan sürümlü migrasyon ve eski yedek testlerini yaz.

## Dikkat edilmesi gerekenler

- `wordverse.universe.v3` anahtarı ve eski `wordverse.words.v2` kayıtları korunmalı; şema v3 şu an uygulamanın tek yazma biçimi.
- `.env.local` repoya eklenmez. Mevcut yerel veriye test sırasında dokunma; testler ayrı localhost origin kullanmalı.
- Prod dağıtımı ancak otomatik ve görsel kontrollerden sonra yapılır.

## Doğrulanmamış iddialar

- 5.000 kayıt/60 FPS hedefi ölçülmedi. Önceki 200 kayıt testi yalnız çizim çağrısı bulgusu.
- IndexedDB engelli gerçek tarayıcı senaryosu henüz manuel sınanmadı; uygulama uyarı göstererek localStorage ile sürer.
