# Avatar kabulü: istemci ve gerçek Storage ayrı kontrollerdir

## Tamamlanan bağımsız kontrol

`npm run test:avatars` 10 birim testi ve izole gerçek SDK tarayıcı akışını çalıştırır. Tarayıcı fixture `/tests/fixtures/avatar-lab.html`; bellekte sahte transport, persistSession=false, gerçek env/hesap/depo kullanılmaz. Fixture Vite dev içindir; production build entry değildir. 1440/768/390, sistem light/dark ve reduced-motion kontrolü vardır; arayüz koyu kalır.

`src/avatar-storage.ts` yeni avatar için owner/avatar-UUID.ext üretir. Aynı owner path verilince explicit upsert; yalnız JPEG/PNG/WebP, 0 < boyut <= 2 MiB ve eşleşen dosya başlangıç imzası. Bu bir tam dosya decode/zararlı dosya taraması değildir; tarayıcı image decode fixture'da ayrıca kontrol edilir. Backend limitleri ve RLS istemci kontrollerinden bağımsız gereklidir.

Her işlem öncesi getUser sahibi doğrular; geç ağ sonucundan sonra aynı sahip yeniden kontrol edilir. Raw backend hatası, token veya signed URL dışa verilmez. Private download Blob döndürür ve cache:no-store kullanır. UI object URL oluşturursa değiştirme/çıkışta revoke etmeli. Profilde yalnız private object path tutulmalı. Faz 3 UI/metadata bağlantısı henüz yoktur; helper otomatik kayıt silmez, otomatik orphan cleanup yapmaz.

Mevcut avatar yolu ext ile aynı MIME ister; PNG->JPEG gibi tür değişimi yeni path gerektirir. Başarılı upload ardından oturum koparsa yardımcı late result'ı reddeder, sunucuda kalmış eski-owner nesnesini otomatik silmez. Sonraki profil entegrasyonu bu durumu ayrı yönetmeli; yeni hesaba eski sonucun path'ini yazmamalı.

## Gerçek API kabulü — henüz yapılmadı

Hedef sadece **mrkmtcpzyvooreeokmkp**, private **wordverse-avatars**, 2 MiB/JPEG/PNG/WebP. SQL rollback metadata/RLS kabulü zaten geçti; bu belge onu dosya API kabulü olarak sunmaz. Doğru erişim sağlanınca ayrı disposable test hesapları A/B ve yalnız bu kontrolün oluşturduğu UUID yolları kullanılır. Gerçek kullanıcının avatarı, kelimeleri veya profil metadata'sı değişmez. Sırları terminal/sohbet/Git'e kopyalama. service_role ile yapılan test authenticated sahiplik kabulü değildir.

| Adım | Gerçek API beklentisi | Kanıt |
|---|---|---|
| A yeni PNG upload | API success, sahibi A, path A klasörü | Yanıtta secret içermeyen durum; Dashboard metadata |
| A aynı path upsert | İçerik değişir; nesne sayısı aynı | Authenticated download bytes/hash |
| A private download | Başarılı ve PNG decode edilir | Tarayıcı görseli |
| B/anon A path read | İçerik dönmez | Hata veya empty result; A tekrar hâlâ okur |
| B A path upload/upsert/remove | A nesnesi etkilenmez | A bytes/hash aynı; B kendi path çalışır |
| Auth'suz public asset URL | Avatar içeriği dönmez | RLS/private bucket bağımsız kontrol |
| 2 MiB boundary geçerli PNG | Başarılı | Byte sayısı ve API yanıtı |
| 2 MiB+1 doğrudan SDK upload | Sunucu reddeder | Helper bypass, ayrı test path; nesne yok |
| SVG doğrudan SDK upload | Sunucu MIME reddeder | Helper bypass, ayrı test path; nesne yok |
| A yalnız test path remove | API ile kaldırılır; tekrar download içerik dönmez | Test nesnesi sayısı sıfır |

Doğrudan SDK boyut/MIME denemeleri helper'ı bilinçli bypass eder: client rejection sunucu limit kabulü değildir. RLS farklı hesap testi de helper bypass etmelidir; istemci path doğrulaması tek başına RLS kanıtı değildir. Yalnız testte kaydedilmiş tam path listesiyle temizle; list/bulk folder deletion veya SQL DELETE kullanma. `storage.protect_delete` korumasını kapatma. Başarısız cleanup varsa exact fixture path'leri özel yerel test kaydında tut, test tamamlandı deme; kullanıcının başka kayıtlarına dokunma.

Kaynaklar (2026-10-03): [private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [RLS/upsert izinleri](https://supabase.com/docs/guides/storage/security/access-control), [upload](https://supabase.com/docs/reference/javascript/file-buckets-upload), [Storage API delete](https://supabase.com/docs/guides/storage/management/delete-objects). SDK sözleşmesi repoda sabitlenmiş @supabase/supabase-js 2.117.2 ve storage-js kaynaklarından kontrol edildi; eski storage-from-*.md reference yolları HTML redirect verdi, geçerli markdown kaynağı sayılmadı.
