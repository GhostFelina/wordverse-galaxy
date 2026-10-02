# Faz 1 çeviri envanteri — 2026-10-02

## Mevcut durum

Ana uygulama ve Hakkında sayfası TR/EN/ES sözlüğüne bağlandı. Ana uygulama statik DOM/metası `src/home-i18n.js`, dinamik panel ve işlem mesajları `src/main.js` ile çevriliyor. Yıldız evresi verisi yalnız dil bağımsız `stageId` tutuyor; görünen adlar sözlükte. Başlangıç galaksilerinin depolanan Türkçe adları korunuyor, gösterimde yerelleştiriliyor. Şu an e-posta şablonu yok; Faz 2 auth sırasında üç dilde oluşturulacak.

## Taşınacak alanlar

1. **Ana sayfa (uygulandı):** üst bar, dil seçici, galaksi seçici, hero, istatistikler, ipuçları, zoom kontrolleri, panel başlıkları, form etiketleri ve boş durumlar.
2. **Dinamik metinler (uygulandı):** galaksi/kelime/gezegen ayrıntıları, yıldız evresi, tarihler ve `Intl.PluralRules` sayılar, arama, hata/toast, dışa/içe aktarma, aria-label ve placeholder. Ana sayfa DOM taramasında EN/ES için yalnız anlam dili adı ve anlam örneği Türkçe kaldı; bunlar öğrenme verisinin hedef dilidir.
3. **Hakkında (tamamlandı):** başlık, dört kullanım kartı, dört SSS, gezegen kaynak açıklaması, alt not ve FAQ JSON-LD üç dilde. Üst bar dil seçicisi ve `/about.html`, `/en/about.html`, `/es/about.html` adresleri çalışıyor.
4. **SEO (tamamlandı):** Ana sayfa ve Hakkında title, description, OG/Twitter, canonical, `hreflang` ve JSON-LD aynı sözlükten altı statik HTML'e yazılıyor. JavaScript kapalı tarayıcıda altı sayfa doğrulandı; eski `?lang=` bağlantıları destekleniyor.
5. **Veri alanları (tamamlandı):** UI dili, öğrenilen dil ve anlam dili ayrı saklanıyor. Mevcut galaksiler anlam dili TR kabul edilerek v4'e taşınıyor; v3/v2 verisi ve yedekler korunuyor.

## İlk altyapı

`src/i18n.js` dil tercih sırası ve Intl yardımcıları; `locales/*.json` üç dilde eş anahtarlar; `tests/i18n.test.js` anahtar bütünlüğü ve tercih sırasını doğrular. Üst bar seçicisi kanonik dil yoluna gider. Üç dilde 15 Playwright akışı, altı JavaScript açık/kapalı statik sayfa ve 36 tema/hareket/genişlik kombinasyonu doğrulandı. Profil tercihi Faz 3 profil modeliyle bağlanacak; yardımcıdaki öncelik testi şimdiden var.
