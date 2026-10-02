# Devir durumu

## Son güncelleme

2026-10-02 · codex · Faz 1 Hakkında yerelleştirme çalışması. Ana dal tabanı `v1.10.0`; aktif sürüm adayı `1.11.0`.

## Şu an aktif faz ve branch

Faz 0 tamamlandı ve yayımlandı. Aktif Faz 1 · `phase/1-i18n` · taslak PR #4.

## Tamamlananlar

- Faz 0 denetim, ADR, ham v2/v3 arşiv, test/CI, responsive düzeltmeler ve 12 görsel kanıtla tamamlandı. PR #3 ana dala alındı, `v1.10.0` tag ve GitHub Release yayımlandı, prod duman testi geçti.
- Faz 1 için TR/EN/ES sözlükleri, eş anahtar testi ve `src/i18n.js` tercih/Intl yardımcıları oluşturuldu.
- Galaksi öğrenilen dili ile anlam dili v4 şemada ayrıldı. v3 verisi ve orijinal anahtar korunarak migrasyon ile eski JSON yedek içe alma doğrulandı.
- `about.html` başlık, kullanım kartları, SSS, gezegen kaynakları, alt not ve SEO metinleri üç dilde çalışıyor. `?lang=` açık dil seçimi, canonical, `hreflang` ve çevrilmiş FAQ JSON-LD eklendi.
- Hakkında için TR/EN/ES × 1440/390 görüntüleri `docs/handoff/evidence/2026-10-02-about-*.png` içinde. Yerelde 20 birim, 7 Playwright testi, lint, typecheck, build ve format kontrolü geçti.

## Yarım kalan iş

- Ana uygulama `index.html`, `src/main.js` ve `src/universe-data.js` görünür metinleri henüz sözlüğe taşınmadı; üst bar dil seçici yok.
- Hakkında meta/FAQ JSON-LD JavaScript ile güncelleniyor. Arama botları için statik dil çıktısı değerlendirilmeli.
- E-posta şablonu henüz yok; Faz 2 kimlik doğrulamada üç dilde oluşturulacak.
- PR #4 taslak. Faz 1 kabulünün tüm ekranlar ve dil seçici tamamlanmadan verilmemesi gerekir.

## Sıradaki ilk 3 adım

1. Ana sayfanın statik DOM, erişilebilirlik, meta ve boş durum metinlerini üç dile bağla.
2. `src/main.js` dinamik metinlerini ve `src/universe-data.js` görünür adlarını sözlüğe taşı; dil seçiciyi bağla.
3. Üç dilde masaüstü/tablet/mobil, sistem temaları ve azaltılmış hareket kontrolünden sonra Faz 1 PR'ını gözden geçir.

## Dikkat edilmesi gerekenler

- `main` v3 anahtarı ile çalışır; Faz 1 dalı v4'e yazar. Eski v3 ve v2 anahtarları silinmemeli.
- `.env.local` repoya eklenmez. Gerçek yerel veriye test sırasında dokunma; testler ayrı localhost origin kullanmalı.
- Prod dağıtımı ancak otomatik ve görsel kontrollerden sonra yapılır.
- 5.000 kayıt/60 FPS hedefi ölçülmedi; IndexedDB engelli gerçek tarayıcı senaryosu manuel sınanmadı.
