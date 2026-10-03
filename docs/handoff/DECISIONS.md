# Mimari kararlar

## ADR-001 — Çalışan Vite + Three.js tabanını koru

- **Bağlam:** Proje Vite 7, ES modülleri ve Three.js WebGL kullanıyor; 80+ yıldızda instancing var. 11 mevcut veri testi geçiyor.
- **Karar:** Faz 0'da render motoru yeniden yazılmayacak. TypeScript kademeli eklenecek; önce yeni veri ve senkron modülleri türlenip sonra büyük `main.js` bölünecek. IndexedDB gelecekte birincil depo, localStorage v3 geçiş kaynağı olacak.
- **Alternatifler:** Sıfırdan React/Canvas uygulaması veya mevcut tek JS dosyasını aynı biçimde büyütmek.
- **Sonuç:** Görsel davranış ve kullanıcı verisi korunur. Modülerleştirme ve 5.000 yıldız testi sonraki fazlarda zorunludur.

## ADR-002 — Migrasyondan önce ham yerel veriyi arşivle

- **Bağlam:** Açılıştaki `persist()` v3 anahtarını yazıyor; v2 dönüştürme ve v3 onarımından önceki baytlar ayrıca saklanmıyordu.
- **Karar:** v2 ve v3 raw string değerlerini IndexedDB `pre-migration` store içine anahtar başına ilk kez yaz; sonra `wordverse.schema.version` kaydını tut. Arşiv hiçbir açılışta üzerine yazılmayacak. JSON eski yedek içe aktarma v3 biçimini koruyacak.
- **Alternatifler:** localStorage içinde ikinci kopya (kota riski), yalnız mevcut ayna (ham v2 içermiyor).
- **Sonuç:** Geriye dönük kurtarma mümkün olur. IndexedDB engellenirse kullanıcıya yedek uyarısı gerekir.

## ADR-003 — Anlam dilini galaksi verisine ekleyen v4 şeması

- **Bağlam:** v3 galaksilerinde yalnız öğrenilen dil bulunuyordu; anlam alanı Türkçe varsayılıyordu. UI dili bundan bağımsızdır.
- **Karar:** `wordverse.universe.v4` yeni anahtar olur. Her galakside `meaningLanguage` BCP-47 temel dil kodu tutulur; v3 verisi `tr` varsayımıyla v4'e taşınır. Eski `wordverse.universe.v3` silinmez ve ham hâli IndexedDB arşivinde kalır. V3 ve v2 JSON yedekleri v4'e normalize edilerek içe alınır. İlk seçimler TR/EN/ES'tir.
- **Alternatifler:** v3'e sessiz alan eklemek (sürümlü migration kuralını ihlal eder); anlam dilini global tutmak (galaksi başına farklı dil çiftini engeller).
- **Sonuç:** Öğrenilen dil ve anlam dili ayrılır. Kullanıcı anlam dilini değiştirirse mevcut anlam metinleri otomatik çevrilmez; UI bunu açıkça belirtir.

## ADR-004 — Hakkında sayfasında açık dil bağlantıları

- **Bağlam:** Hakkında sayfası üç dilde okunmalı; saklanan tercih ve tarayıcı dili farklı olabilir. Dil bağlantılarının açıldığında beklenen dili göstermesi gerekir.
- **Karar:** Açık URL dili tercihi saklar. İlk uygulamada `?lang=tr|en|es` kullanıldı; ADR-006 ile kanonik yol adreslerine geçildi. Açık dil yoksa `resolveLocale` profil→yerel kayıt→tarayıcı→TR sırasını uygular. Hakkında içeriği ve FAQ JSON-LD aynı sözlükten üretilir.
- **Sonuç:** Paylaşılabilir dil bağlantıları çalışır. Statik arama çıktısı ADR-006 ile sağlanır.

## ADR-005 — Arayüz dilini veri dilinden ayır ve seçimde sayfayı yenile

- **Bağlam:** Galaksi verisindeki `language` ve `meaningLanguage` kullanıcı içeriğinin dilidir; arayüz dili değişince bu veriler çevrilmemeli veya yeniden yazılmamalıdır. Ana uygulama tek dosyada birçok DOM metni üretiyor.
- **Karar:** UI tercihini `wordverse.ui.locale` anahtarında tut. Üst bar seçicisi kanonik dil adresine gider; açılışta statik DOM/metalar ve dinamik metinler aynı sözlükten uygulanır. Dil değişimi sayfayı yeniler. Başlangıç galaksilerinin saklanan Türkçe adları yalnız gösterimde çevrilir. Çoğullar `Intl.PluralRules`, tarih/sayılar `Intl` ile biçimlenir.
- **Alternatifler:** Her görünüm için ayrı HTML/JS uygulaması; seçicide DOM'u anında yeniden yazmak (mevcut tek dosya durum yönetiminde eski dil metni bırakma riski).
- **Sonuç:** Seçim kalıcı ve veri değişmeden çalışır. URL ile açık dil seçimi paylaşılır.

## ADR-006 — Kanonik dil yolları ve build sırasında statik HTML

- **Bağlam:** İstemci JavaScript'iyle güncellenen meta ve FAQ içeriği JavaScript çalıştırmayan tarayıcılarda Türkçe kalıyordu. Dile özgü paylaşılabilir adres ve arama çıktısı gerekiyor.
- **Karar:** TR `/` ve `/about.html`, EN `/en/` ve `/en/about.html`, ES `/es/` ve `/es/about.html` adreslerini kullan. Eski `?lang=` bağlantılarını geriye dönük destekle. Vite build sonrası aynı uygulama çeviri fonksiyonlarını `linkedom` ile çalıştırıp altı gerçek HTML üret; statik meta, canonical, `hreflang` ve FAQ JSON-LD'yi build doğrulamasına dahil et. Geliştirme sunucusunda dil yollarını Vite middleware ile şablonlara yönlendir.
- **Alternatifler:** Altı ayrı elle tutulan HTML dosyası (içerik sapması); yalnız istemci JavaScript'i (statik SEO eksikliği); tüm uygulamayı yeni SSR çatısına taşımak (bu faz için geniş kapsam).
- **Sonuç:** Tek sözlük iki dağıtım yolunu besler. JavaScript kapalıyken sayfa tanıtımı okunur; etkileşimli evren için JavaScript gerekir. Kök adresin istemci açılışında kayıtlı dile dönmesi bilinen davranıştır.

## ADR-007 — Faz 2'de hesaplı senkron için kullanıcıya ait kayıtlar

- **Bağlam:** v4 evreni galaksi, kelime/bağlaç ve olay dizilerinden oluşur. Misafir verisi korunmalı; iki cihazın eşzamanlı değişiklikleri tek bir JSON belgesinin üzerine yazılmamalıdır.
- **Karar:** Bulutta galaksiler, girdiler, olaylar ve kullanıcı evren ayarları ayrı, kullanıcı kimliğiyle anahtarlanan kayıtlarda tutulacak. Her tabloda RLS ve sahiplik temelli SELECT/INSERT/UPDATE politikaları olacak; UPDATE hem `USING` hem `WITH CHECK` içerecek. Anonim erişim ve authenticated doğrudan DELETE yetkisi kaldırılacak. Veri modelindeki yeni alanlar `payload` JSONB'de kayıpsız korunurken kimlik ve zaman damgaları ayrı sütunlarda tutulacak. Silme `deleted_at` ile işaretlenecek. Yerel IndexedDB birincil kopya olacak; ilk girişte iki tarafın benzersiz kimlikli kayıtları birleşecek, eş kimlikli farklı içerikler ayrı kayıt olarak korunup kullanıcıya özetlenecek. Ağ yokken değişiklikler kuyrukta kalacak.
- **Alternatifler:** Bütün evreni tek kullanıcı satırında JSON olarak tutmak (eşzamanlı yazılarda kayıp riski); girişte yalnız bulut veya yalnız yerel kopyayı seçmek (veri kaybı).
- **Sonuç:** RLS ve çapraz kullanıcı testleri ile güvenlik, iki taraflı merge testleri ile veri koruma doğrulanmadan prod senkron açılmayacak. 2026-10-03 hedef Dashboard erişimiyle şema uygulandı ve rollback izolasyon testi geçti; CLI geçmişi bağlantı sağlanınca eşleştirilecek.

## ADR-008 — Hesap deposunu misafirden ayır; desteklenen TS araç çiftini sabitle

- **Bağlam:** Giriş/çıkışta aynı yerel anahtara yazmak farklı hesapların verisini misafir verisine karıştırabilir. İlk yeni TypeScript modülünde mevcut TS7, typescript-eslint destek aralığıyla uyuşmadı.
- **Karar:** Hesap evreni ve bekleyen işlemleri `wordverse-accounts` içinde ownerId ile anahtarla, aynı transaction içinde yaz. Misafir depo/arşivini değiştirme. TS6.0.3 ve typescript-eslint8.71.0 tam sürüm kullan; destek dışı parser için force/legacy-peer-deps kullanma. JS ve TS testlerini Vitest kapsamına al.
- **Sonuç:** Hesap değişimi veri ayrımını korur; auth sırları bu cache içine girmez. Cloud yazma ve UI bağlanmadan bu çekirdek cihazlar arası senkron sayılmaz. [Resmî destek aralığı](https://typescript-eslint.io/users/dependency-versions/) 2026-10-03 kontrol edildi.

## ADR-009 — Beklenen sunucu sürümüyle koşullu senkron yazma

- **Bağlam:** İstemci saatleri farklı olabilir; bir cihazın eski evreni diğer cihazın yeni kaydını ezmemeli. Ağ yanıtı kaybolunca aynı isteğin tekrar gitmesi normaldir. Auth oturumu istek sürerken değişebilir.
- **Karar:** RPC yalnız JWT sahibi ile p_owner_id eşleşince, tablo whitelist ve RLS altında çalışır. SECURITY INVOKER ve boş search_path kullanır. Mevcut satır FOR UPDATE kilitlenir; expected_updated_at tutmazsa mevcut satır conflict olarak döner. Yeni kayıt yarışında unique violation conflict olur. updated_at yalnız sunucuda ilerletilir. Bekleyen queue ve evren birlikte IndexedDB'ye yazılır; onay yalnız tam gönderilen içerik için kabul edilir, yeni düzenleme beklemeye devam eder. Soft delete tam payload ile saklanır. JSON kimlik CHECK'leri eksik anahtar NULL kaçışını reddeder.
- **Alternatifler:** İstemci saatiyle last-write-wins (saat sapması ve kayıp); önce SELECT sonra koşulsuz UPDATE (yarış); SECURITY DEFINER (gereksiz RLS aşma).
- **Sonuç:** 2026-10-03 Dashboard'da migration ve rollback CAS kontrolü geçti. Çakışmanın iki kopyayla çözümü ve seri UI motoru ayrı adımlardır; bu çekirdek henüz otomatik senkron değildir.
