# Bilinen sorunlar

- Tek `src/main.js` dosyası büyük; içerik, çizim ve depolama sorumlulukları iç içe. Faz 0 ADR geçiş planı uygulanmalı.
- Son yıldız temeli ana JS paketi yaklaşık 574 kB (minify); Vite 500 kB uyarısı veriyor. Faz 9 performans bütçesi henüz ölçülmedi.
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
- 2026-10-03 gerçek Dashboard, default mail ile custom template düzenlemesine izin vermiyor: custom SMTP veya Pro istiyor. Confirmation/recovery TR/EN/ES şablonları ve preview repoda hazır, hosted'e uygulanmadı. Kullanıcı SMTP/hesap girişlerini sonraya bıraktı; bağımsız kod/test işlerini sürdür, tekrar aynı soruyu sorma.

- Avatar client helper/SDK fixture hazır, profil UI'ına bağlı değil. Oturum upload sonrası koparsa eski hesabın yüklemesi sunucuda kalabilir; late result yeni hesaba verilmez, otomatik cleanup yapılmaz. MIME değişimi için yeni path gerekir. Client signature check tam dosya decode veya hosted boyut/MIME/RLS kabulü değildir; AVATAR_API_ACCEPTANCE.md bu kontrolleri ayırır.

- IndexedDB hesap deposu için simulated onblocked/late native connection close ve SecurityError/recovery kabulü geçti (82 unit/40 e2e). Gerçek tarayıcı gizlilik politikası veya fiziksel cihaz depolama engeli sınanmadı; bu kontroller yerine geçmez.

- Hesap IDB yazma/kota hatasında mevcut kalıcı kopya korunur ve yeni değişiklik bu sayfa açıkken bellekte tutulur. Retry başarısından önce reload/çıkış yeni değişikliği kaybettirebilir; kalıcı depoya yazılamayan verinin reload dayanıklılığı iddia edilmez. UI hata/retry ve kalıcı açık tutma/JSON export yönlendirmesi gösterir. Gerçek disk doldurma yapılmadı; kabul DOMException injection kullanır.

- 300 atlas galaksisi gerçek katalog kayıtlarıdır; açısal gökyüzü yerleşimi ve redshift derinliği sanatsal sıkıştırılır, fiziksel 3B uzaklık değildir. İlk 5 dışında mesafeler bilinmiyor. Yakın yıldız/gazlar prosedüreldir. Kalıcı galaksi seçimi migrasyonu henüz yok.

- Güncel tek kâinat: en uzak zoom galaksileri gizler, 300 galaksi ara ölçekte görünür. Akıtılan yıldızlar, 3 ilk bulutsu ve asteroidler prosedürel/sanatsal; ≥100 bulutsu/≥50 olay veya fiziksel simülasyon kabulü değildir. Bulutsu kartları henüz yok.

- Son kullanıcı isteğiyle bütün galaksi çizimi/katalog ana uygulamadan kaldırıldı. Bulutsu/asteroid ve galaksi taslakları devre dışı; yıldız sistemi önce kurulacak. Eski atlas kanıtları tarihsel, güncel görünüm yıldız sahnesidir.
