# Bilinen sorunlar

- Tek `src/main.js` dosyası büyük; içerik, çizim ve depolama sorumlulukları iç içe. Faz 0 ADR geçiş planı uygulanmalı.
- İlk JS paketi 534 kB (minify); Vite 500 kB uyarısı veriyor. Faz 9 performans bütçesi henüz ölçülmedi.
- WebGL başlatılamazsa arayüzün tüm veri işlevleri ayrı bir liste modu ile güvence altında değil.
- Mevcut görseller için kaynaklar `docs/ART_ASSET.md` ve `docs/ASTRONOMY_REFERENCES.md` içinde; merkezi `ATTRIBUTIONS.md` eksik.
- Bulut hesabı, RLS ve cihazlar arası senkron Faz 2 kapsamında.
- Sistem açık tema seçilse de uygulama yalnız koyu palet kullanıyor. Faz 9'da açık tema tasarımı ve testleri değerlendirilmeli.
- Vercel preview SSO korumalı; anonim HTTP smoke için erişim yok. Preview build/check başarılı; prod URL izole tarayıcıda test edildi.
