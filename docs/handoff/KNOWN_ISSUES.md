# Bilinen sorunlar

- Tek `src/main.js` dosyası büyük; içerik, çizim ve depolama sorumlulukları iç içe. Faz 0 ADR geçiş planı uygulanmalı.
- İlk JS paketi 534 kB (minify); Vite 500 kB uyarısı veriyor. Faz 9 performans bütçesi henüz ölçülmedi.
- WebGL başlatılamazsa arayüzün tüm veri işlevleri ayrı bir liste modu ile güvence altında değil.
- Mevcut görseller için kaynaklar `docs/ART_ASSET.md`, `docs/ASTRONOMY_REFERENCES.md` ve kök dizindeki `ATTRIBUTIONS.md` içinde. Yeni varlıklar eklendikçe merkezi atıf güncellenmeli.
- Statik TR/EN/ES sayfaları üretildi. Kök URL `/` tarayıcı dili veya yerel tercih nedeniyle JavaScript açıldığında EN/ES'e dönebilir; statik HTML varsayılan TR'dir. Kanonik dil adresleri `/en/` ve `/es/` açık dili sabitler.
- Bulut hesabı, RLS ve cihazlar arası senkron Faz 2 kapsamında.
- Sistem açık tema seçilse de uygulama yalnız koyu palet kullanıyor. Faz 9'da açık tema tasarımı ve testleri değerlendirilmeli.
- Vercel preview SSO korumalı; anonim HTTP smoke için erişim yok. Preview build/check başarılı; prod URL izole tarayıcıda test edildi.
- Faz 2 görev dosyasındaki Supabase proje kimliği bağlı Supabase uygulamasında ve CLI hesabında görünmüyor; uygulama aracı izin hatası veriyor. Doğru hesap erişimi netleşene kadar uzak şema ve auth ayarları değiştirilemez. Yerel geliştirme sürüyor.
