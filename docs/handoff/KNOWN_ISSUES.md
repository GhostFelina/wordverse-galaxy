# Bilinen sorunlar

- Tek `src/main.js` dosyası büyük; içerik, çizim ve depolama sorumlulukları iç içe. Faz 0 ADR geçiş planı uygulanmalı.
- İlk JS paketi 534 kB (minify); Vite 500 kB uyarısı veriyor. Faz 9 performans bütçesi henüz ölçülmedi.
- WebGL başlatılamazsa arayüzün tüm veri işlevleri ayrı bir liste modu ile güvence altında değil.
- Mevcut görseller için kaynaklar `docs/ART_ASSET.md`, `docs/ASTRONOMY_REFERENCES.md` ve kök dizindeki `ATTRIBUTIONS.md` içinde. Yeni varlıklar eklendikçe merkezi atıf güncellenmeli.
- Statik TR/EN/ES sayfaları üretildi. Kök URL `/` tarayıcı dili veya yerel tercih nedeniyle JavaScript açıldığında EN/ES'e dönebilir; statik HTML varsayılan TR'dir. Kanonik dil adresleri `/en/` ve `/es/` açık dili sabitler.
- Bulut hesabı, RLS ve cihazlar arası senkron Faz 2 kapsamında.
- Sistem açık tema seçilse de uygulama yalnız koyu palet kullanıyor. Faz 9'da açık tema tasarımı ve testleri değerlendirilmeli.
- Vercel preview SSO korumalı; anonim HTTP smoke için erişim yok. Preview build/check başarılı; prod URL izole tarayıcıda test edildi.
- Faz 2 hedef Wordverse Supabase projesine Chrome Dashboard erişimi var; dört tablo uygulandı ve RLS testi geçti. Bağlı Supabase uygulaması ve CLI başka hesaplara bağlı olduğundan hedef projeye bu araçlarla erişilemiyor; Dashboard'da uygulanan migration geçmişi CLI ile ayrıca eşleştirilmeli. Yanlış projeye değişiklik uygulanmamalı.
- Hesap UI yalnız taslak dalda; Google provider kapalı ve bulut eşitleme henüz bağlanmadı. E-posta doğrulama/sıfırlama gerçek posta kutusu ve prod dönüş URL'leriyle doğrulanmalı. Şu an Supabase Site URL localhost:3000 varsayılanı; izinli URL'ler hazırlanmalı.
- Gizlilik/koşullar taslağında veri sorumlusu yasal kimliği, sağlayıcı log/yedek saklama süreleri ve Singapur bölgesine aktarım güvenceleri henüz tamamlanmadı. Bunlar netleşmeden KVKK/GDPR uyumu tamamlandı sayılmaz.
