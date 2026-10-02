# Faz 1 çeviri envanteri — 2026-10-02

## Mevcut durum

Arayüz Türkçe. Metinler üç kaynakta dağınık: `index.html` başlangıç DOM/erişilebilirlik/meta, `about.html` açıklama/FAQ/SEO, `src/main.js` dinamik panel/toast/form metinleri. `src/universe-data.js` yıldız evre adları ve başlangıç galaksi adları da görünür metin üretir. Şu an e-posta şablonu yok; Faz 2 auth sırasında üç dilde oluşturulacak.

## Taşınacak alanlar

1. **Ana sayfa:** üst bar, galaksi seçici, hero, istatistikler, etkileşim ipuçları, zoom kontrolleri, tüm panel başlıkları, form etiketleri ve boş durumlar.
2. **Dinamik metinler:** galaxy/word/planet ayrıntıları, yıldız evresi, tarihler ve sayılar, arama sonuçları, hata/toast, dışa/içe aktarma, aria-label ve placeholder.
3. **Hakkında:** başlık, dört kullanım kartı, dört SSS, gezegen kaynak açıklaması, alt not, JSON-LD.
4. **SEO:** title, description, OG/Twitter, canonical ve `hreflang`; dil seçili URL davranışı kararlaştırılmalı.
5. **Veri alanları:** UI dili, öğrenilen dil ve anlam dili ayrı saklanacak. Mevcut galaksiler anlam dili TR kabul edilerek sürümlü migrasyonla genişletilecek; yedekler korunacak.

## İlk altyapı

`src/i18n.js` dil tercih sırası ve Intl yardımcıları; `locales/*.json` üç dilde eş anahtarlar; `tests/i18n.test.js` anahtar bütünlüğü ve tercih sırasını doğrular. Metinlerin DOM'a uygulanması henüz başlamadı. Dil seçici, eksiksiz çeviri hazır olmadan gösterilmemeli.
