# Faz 1 çeviri envanteri — 2026-10-02

## Mevcut durum

Ana uygulama arayüzü hâlâ Türkçe. Metinler `index.html` başlangıç DOM/erişilebilirlik/meta, `src/main.js` dinamik panel/toast/form metinleri ve `src/universe-data.js` yıldız evre adları ile başlangıç galaksi adlarında dağınık. `about.html` görünür metinleri `src/about.js` üzerinden TR/EN/ES sözlüğüne bağlandı. Şu an e-posta şablonu yok; Faz 2 auth sırasında üç dilde oluşturulacak.

## Taşınacak alanlar

1. **Ana sayfa:** üst bar, galaksi seçici, hero, istatistikler, etkileşim ipuçları, zoom kontrolleri, tüm panel başlıkları, form etiketleri ve boş durumlar.
2. **Dinamik metinler:** galaxy/word/planet ayrıntıları, yıldız evresi, tarihler ve sayılar, arama sonuçları, hata/toast, dışa/içe aktarma, aria-label ve placeholder.
3. **Hakkında (tamamlandı):** başlık, dört kullanım kartı, dört SSS, gezegen kaynak açıklaması, alt not ve FAQ JSON-LD üç dilde. Görünür `?lang=` adresi ve saklanan tercih çalışıyor. Altı ekran görüntüsü ve üç dil tarayıcı testi var.
4. **SEO (sürüyor):** Hakkında için çalışma zamanında title, description, OG, canonical ve `hreflang` uygulanıyor. Ana sayfa ve Twitter meta alanları bekliyor. Arama motoru taraması için istemci tarafı meta/JSON-LD yerine ayrı statik dil sayfaları veya ön işleme değerlendirilmeli.
5. **Veri alanları:** UI dili, öğrenilen dil ve anlam dili ayrı saklanacak. Mevcut galaksiler anlam dili TR kabul edilerek sürümlü migrasyonla genişletilecek; yedekler korunacak.

## İlk altyapı

`src/i18n.js` dil tercih sırası ve Intl yardımcıları; `locales/*.json` üç dilde eş anahtarlar; `tests/i18n.test.js` anahtar bütünlüğü ve tercih sırasını doğrular. Hakkında DOM uygulaması başladı. Ana sayfa dil seçici, eksiksiz çeviri hazır olmadan gösterilmemeli.
