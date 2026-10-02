# Devir durumu

## Son güncelleme

2026-10-02 · codex · commit: `cce710c` (Faz 1 sürüm düzeltmesi), taban `daa46ac` / `v1.10.0`.

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
- v4 anlam dili migrasyonu, galaksi ayarı ve eski yedek uyumluluğu geliştirildi; yerelde 19 birim ve 4 Playwright testi geçti. 390/1440 kanıt görüntüsü alındı.

## Yarım kalan iş

- Faz 1 taslak PR #4 açık. Çeviri JSON'ları yalnız çekirdek anahtarları içeriyor; DOM/dinamik metinler henüz taşınmadı. UI dil seçici henüz yok.
- PR #4 ilk CI çalışmasında sürüm kapısı `1.10.0` nedeniyle durdu. Dal sürümü `1.11.0` olarak düzeltildi; sonraki GitHub CI tüm adımlarıyla geçti. Vercel preview hazır.

## Sıradaki ilk 3 adım

1. `index.html` ve `src/main.js` görünür metinlerini eksiksiz üç dil sözlüğüne taşı; dil seçiciyi bağla.
2. `about.html`, meta/OG/JSON-LD ve `hreflang` için yerelleştirme stratejisini uygula.
3. Üç dilde masaüstü/tablet/mobil, iki sistem teması ve azaltılmış hareket kontrolü yap; Faz 1'i ancak tüm anahtarlar tamamlanınca birleştir.

## Dikkat edilmesi gerekenler

- `main` v3 anahtarı ile çalışır; Faz 1 dalı v4'e yazar. Eski v3 ve v2 anahtarları kesinlikle silinmemeli.
- `.env.local` repoya eklenmez. Mevcut yerel veriye test sırasında dokunma; testler ayrı localhost origin kullanmalı.
- Prod dağıtımı ancak otomatik ve görsel kontrollerden sonra yapılır.

## Doğrulanmamış iddialar

- 5.000 kayıt/60 FPS hedefi ölçülmedi. Önceki 200 kayıt testi yalnız çizim çağrısı bulgusu.
- IndexedDB engelli gerçek tarayıcı senaryosu henüz manuel sınanmadı; uygulama uyarı göstererek localStorage ile sürer.
