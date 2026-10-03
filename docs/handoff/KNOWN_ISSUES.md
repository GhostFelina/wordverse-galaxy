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
- Hesap UI ve Google/bulut senkron taslak dalda yerelde gerçek hesapla doğrulandı; prod hâlâ v1.11.0. E-posta doğrulama/sıfırlama gerçek posta kutusuyla doğrulanmalı. Supabase prod Site URL ve izinli dönüş kalıpları kaydedildi.
- Google `cortexia-language` projesi Cortexia'nın mevcut istemcisi ve ortak consent markasını içeriyor. Wordverse ayrı istemcisi/provider etkin; gerçek giriş çalışıyor fakat consent marka ve hukuki linkleri Cortexia'dan kalma. Marka Wordverse'e çevrilirse Cortexia giriş ekranı da etkilenir; bu etki çözülmeli. Wordverse hukuki prod URL'leri henüz yayında değil.
- Kullanıcı veri sorumlusu adı/iletişimini Mustafa Kılıç ve kopukfad@gmail.com olarak verdi; üç dil taslağa işlendi. Sağlayıcı log/yedek saklama süreleri ve Singapur bölgesine aktarım güvenceleri tamamlanmadı. KVKK/GDPR uyumu tamamlandı sayılmaz.
- MacBook kurulumu henüz cihazda denenmedi; CROSS_DEVICE.md ve setup:device ilk Mac oturumu için hazır. Codex geçmişi ve yerel tarayıcı depoları kendiliğinden eşitlenmez.
- 2026-10-03 15:54 güncel Security Advisor: 0 hata, 1 Auth uyarısı (Leaked Password Protection Disabled). Bu koruma Pro+ plan gerektiriyor; ücretli plan açılmadı. Önceki 0 uyarı kaydı güncel değildir. Avatar RLS rollback testi geçti; Storage API upload/upsert/delete ve dosya limit reddi henüz denenmedi.
- Supabase storage.protect_delete doğrudan SQL DELETE'i engelliyor. Bu korumayı kapatma; dosyalar Storage API ile yönetilmeli. Avatar SQL kabulü yalnız metadata/RLS; ilk başarısız test fixture'ı transaction ile geri alındı, düzeltilmiş test geçti.
- Yedek stratejisi belgelendi; otomatik dump/özel cihaz dışı kopya ve izole restore tatbikatı henüz yapılmadı. JSON yedek tam Auth/Storage felaket kurtarması değildir.
