# Wordverse — Claude için bütün proje rehberi

**Tarih:** 3 Ekim 2026. **Cihaz:** Windows 11 Pro / PowerShell 7.6.6.
**Güncel geliştirme:** `phase/4-universe`, paket sürümü `1.14.0`.
**Yayın:** `main`, `v1.11.0`; geliştirme özellikleri henüz production değildir.

Bu belge projenin anlaşılır, bütünlüklü tanıtımıdır. Güncel görev kaynağı `docs/handoff/HANDOFF.md`, dal/faz kaydı `STATE.json` olur. Ana şartname `MASTER_PROMPT.md` korunur; daha sonra verilen kullanıcı kararları eski görsel talepleri değiştirir. Bu rehberle birlikte verilen tam kaynak dökümü bütün Git metinlerini satır atlamadan içerir; ZIP aynı checkpoint'in görseller dahil bütün Git dosyalarını taşır. Yerel sırlar, gerçek kullanıcı verileri ve bağımlılık klasörleri bu pakete dahil değildir. Bu belge gelecekteki değişikliklerden sonra kendiliğinden güncellenmez; devam oturumunda önce Git ve HANDOFF kontrol edilir.

## 1. Ürün nedir?

Wordverse, öğrenilen kelimeleri yıldızlara, bağlaçları gezegenlere dönüştüren kişisel öğrenme evrenidir. Kullanıcı dil ve anlam bilgisiyle kayıt ekler, koleksiyonlarını düzenler, gök cisimlerine yaklaşır, kendi kayıtlarını inceler ve JSON yedeklerini içe/dışa aktarır. Öğrenme günlüğü ve tekrar deneyimi ürünün temelidir. Gelecekte FSRS, günlük/ters/rastgele tekrar, telaffuz, farklı kayıt türleri, notlar ve projeler hedeflenir; bunların tümü bugün uygulanmış değildir.

- Canlı: https://wordverse-galaxy.vercel.app
- Repo: https://github.com/GhostFelina/wordverse-galaxy
- Windows mevcut proje: `C:\Users\User\Desktop\Projeler\kelime-evreni`
- Yerel görünür uygulama: http://127.0.0.1:5360/
- Bildirilen mevcut Mac klonu: `/Users/felina/Projects/wordverse-galaxy`; kendiliğinden taşınmaz.
- Yasal taslaklarda kullanıcı adı: Mustafa Kılıç; iletişim: kopukfad@gmail.com.

**En önemli kural: mevcut kelime/koleksiyon/hesap/misafir verisini koru.** Görsel değişiklik için kullanıcı verisini yeniden oluşturma veya sıfırlama. Migration eski JSON'u ve ham arşivleri korumalıdır. Gerçek kelime metinleri Git'e veya görsel kanıta girmez.

## 2. Kullanıcı nasıl çalışmak istiyor?

Türkçe konuş. Gerçek işletim sistemi ve kabuğu her oturumda kontrol et. Windows'a macOS komutu veya tersini uygulama. Rutin geliştirme, bağımlılık kurulumu, test, yerel açılış, commit ve push için tekrar onay isteme. Sürekli somut adımlarla ilerle; kısa durum güncellemeleri ver. Geri alınamaz silme, ücretli plan, hesap parolası/2FA gibi kullanıcıya bağlı adımları ayrı ele al. Mevcut yetkiyi tekrar sorma. Sırları isteme veya kaydetme.

Kullanıcı “Durum Analiz” dediğinde anlık Git/test/CI ve görev durumunu kontrol et, şu tabloyu ver; sonra aktif işe devam et:

| Durum | İş | Sonuç / kalan adım |
|---|---|---|
| Bitti / sürüyor / bekliyor | Somut iş | Kanıt veya gerçek kalan adım |

Codex ve Claude limitlere göre **sırayla aynı dal ve devir belgelerini** kullanır. Diğer ajan başka dalda ayrı bir proje başlatmaz. Diğer cihaz yalnız push edilen işleri görür; tarayıcı verisi ve oturum sırları Git ile taşınmaz. İki ajan aynı dalı eşzamanlı değiştirmemelidir. Kullanıcı Mac çalışmasını durdurup Windows'ta devam etti; yeniden Mac'e geçerse CROSS_DEVICE adımlarını izle.

## 3. Talep geçmişi ve son kararların üstünlüğü

1. İlk görev: MASTER_PROMPT'u baştan sona oku, Faz 0'dan başlayarak altyapı, üç dil, hesap/senkron, profil, evren, öğrenme, olaylar, marka, vitrin ve cila fazlarını ilerlet.
2. Kullanıcı defalarca yerelde açmayı, tarayıcıda görmeyi, devam etmeyi ve commit/push yapmayı istedi. Bunlar kalıcı çalışma tercihleridir.
3. Windows–MacBook ve Codex–Claude geçişi için kurulum, devam komutu, GitHub bağlantısı ve ortak belgeler istendi. Windows kontrolleri yapıldı; gerçek Mac kurulumu henüz kabul edilmedi.
4. Faz 2'nin kalan kabul işleri daha sonra yapılmak üzere ertelendi. Sonraki fazlara geçilmesi istendi. Faz 3'ün ilk profil/istatistik işi yapıldı; kalanları ertelendi.
5. Öncelik evren/katalog ve olay **görselleri** oldu. X referansı: https://x.com/ITangieff/status/2106060890407915571 — sağ taraftaki videonun 00:10–00:15 yakın yıldız/gaz içinden uçuş hissi. Video varlıkları kopyalanmaz; hangi modelin ürettiği iddiası bağımsız doğrulanmış sayılmaz.
6. İlk 200–300 galaksinin en uzak görünümde gösterilmesi talebi **değişti**: tek kesintisiz kâinat; **en uzak zoomda galaksiler görünmez**, iyice yaklaşınca yıldızların arasında görünür.
7. Her galaksi aynı görünmemeli. Geçişler estetik/profesyonel, kişisel kelime evreni kendi galaksisinin merkezinde olmalı. Kayıt koordinatları görsel dönüşüm uğruna değiştirilmez.
8. Kullanıcı önce bütün galaksileri kaldırıp yıldız temelini kurmamızı istedi. Bu temel oluşturuldu; sonradan katmanlar kademeli geri gelir.
9. Yeni asgari sayılar: **200 gerçek bulutsu, toplam 1000 asteroid/meteor, 150 farklı gerçek galaksi**. Açık cevap: 1000 asteroid ve meteorun **toplamı**; her türden 1000 zorunlu değildir.
10. “Kademe kademe artır”: yıldız temeli →200 bulutsu →asteroid/meteor →300 mevcut gerçek galaksi. Şu an **kademe 2**. Galaksiler kapalı.
11. En uzakta parlama, patlama, dalga ve ultra gerçekçi evren hissi istendi. OLED derin siyah şartı sürüyor. Önce yıldızlı arka plan istemedi, ardından “yada olsun arka plan” dedi: yıldızlı arka plan serbest; yakın katman gerçek 3B konum/parallax taşımalı.
12. Kullanıcı yıldızları ve galaksileri “inanılmaz amatör” buldu. Sayıların sağlanması kalite kabulü değildir. Profesyonel ışık, ölçek, gaz/toz, morfoloji ve geçiş çalışması açık görevdir.
13. Tarayıcıda tek tek inceleme ve “yıldız yıldız, galaksi galaksi, bulutsu bulutsu gibi mi?” değerlendirmesi istendi. İlk manuel incelemede somut kusurlar görüldü ve düzeltmeler yapıldı; ultra gerçekçilik hâlâ kabul edilmedi.
14. Son görev: karışıklığı gidermek için bütün projeyi anlatan Markdown rehberini ve eksiksiz kaynak paketini Masaüstü `MD` klasörüne koy; Claude için başlangıç promptu hazırla.

Eski oturum belgeleri, ADR veya testler önceki talepleri yansıtabilir. Özellikle “en uzakta 300 galaksi”, “yalnız yıldız sahnesi” ve “en az 100 bulutsu” güncel görsel talimat değildir. Tarihsel kanıtı silme; tarihsel olduğunu belirt.

## 4. Fazların gerçek durumu

| Faz | Durum | Yapılan / kalan |
|---|---|---|
| 0 Denetim/altyapı | Tamamlandı | Audit, ADR, veri arşivi/migration, test/lint/build/CI, responsive kanıt, v1.10.0 yayın |
| 1 TR/EN/ES | Tamamlandı | Ana/Hakkında UI, meta/SEO, dil tercihi, anlam dili ayrımı, statik altı sayfa, v1.11.0 yayın |
| 2 Hesap/senkron | Çekirdek var; kabul ertelendi | Yerel gerçek Google, owner depoları, offline kuyruk, merge/CAS/RLS, import/export; gerçek mail/prod auth/Storage/Mac/hukuk ve kurtarma kabulü açık |
| 3 Profil | İlk bölüm var; kalan ertelendi | Salt okunur profil/istatistik; ad/handle, tercihler, avatar UI, ısı haritası, hedef/rozet, CSV, hesap silme/paylaşım açık |
| 4 Evren/katalog | Aktif | Yıldız temeli; 200 bulutsu; 1000 asteroid ve 1000 tarihsel meteor kayıt/katmanı; 300 galaksi verisi hazır ama renderer kapalı. Kalite, geçiş, dokunmatik, 250 gezegen/25 takımyıldızı ve kalıcı gerçek galaksi bağlantısı açık |
| 5 Evrim/hafıza | Başlanacak | Eski yaş rengi var; FSRS, genişletilebilir Entry registry, kalıcı evrim ve tekrar sistemi yok |
| 6 Olaylar | Görsel öncelikle kısmi | Eski kozmetik kuyruklu yıldızlar + yeni tarihsel meteor tekrarları var; ≥50 ayrı olay türü/günlük/fizik referanslı kuyruk sistemi tamam değil |
| 7 Marka | Başlanacak | Logo/ikon/PWA/OG/banner, BRAND.md, optimizasyon ve atıflar |
| 8 Vitrin | Bazı temel dosyalar var | Tam EN/TR/ES README, demo/GIF/video, repo sunumu ve platform lansman taslakları açık; kullanıcı adına yayın yapılmaz |
| 9 Cila | Başlanacak | 5000 kullanıcı yıldızı FPS/Lighthouse, zayıf WebGL fallback, tam erişilebilirlik, PWA/offline ve yüksek çözünürlük paylaşım |

Yalnız Faz 0 ve 1 tamamlandı. Draft PR **#7**, base `phase/3-profile`. Faz 4 tamamlanmadan main merge, release tag veya production çıkışı yapılmaz. Faz 2/3 kabulüne görsel işlerden sonra dönülecek.

## 5. Teknoloji ve çalıştırma

Vite üzerinde framework kullanmayan JavaScript + TypeScript modülleri, Three.js ve Supabase SDK. **React/Next.js projesi değildir.** `package.json` ve `package-lock.json` sürüm kaynağıdır. Şu an Node 24.20/npm 11.19; önerilen Node 24, minimum 22.13. Three.js r180; Supabase 2.117.2; TypeScript 6.0.3. Vitest, Playwright, ESLint ve Prettier bulunur.

```powershell
# Windows — önce gerçek OS/kabuk ve mevcut klasör kontrol edilir
Set-Location 'C:\Users\User\Desktop\Projeler\kelime-evreni'
git status --short --branch
# Yalnız temiz ağaçta ve doğru dalda:
git pull --ff-only
npm ci
npm run setup:device
npm run doctor -- --push-check
npm run dev -- --port 5360
```

Sunucu açıksa aynı repo/port olduğunu kontrol edip mevcut sekmeyi koru. `npm run resume:claude` / `resume:codex` uygun ajanı proje kökünde açan devam yardımcılarıdır. `npm run check` lint →typecheck →unit →build →e2e çalıştırır; `npm run format:check` ayrıca çalışır. Playwright test sunucusu **5350** ve sahte Supabase yapılandırması kullanır; kullanıcı **5360** uygulamasıyla karıştırma. Build TR/EN/ES ana/Hakkında altı statik sayfayı ve hukuki sayfaları üretir/doğrular.

Mac'te gerçek OS/kabuk ve mevcut klonu bul. Windows yolunu kullanma. `CROSS_DEVICE.md` ve `scripts/setup-mac.sh` aktif dal kurulumunu tarif eder. Node_modules veya sanal ortam taşınmaz, kilit dosyasından yeniden kurulur. GitHub/Codex/Claude ilk girişlerini kullanıcı tamamlar; Windows'taki tarayıcı araçları ve kimlik bilgileri başka CLI/cihazda otomatik bulunmuş sayılmaz. Sıfır hata veya tam Mac erişimi doğrulanmış değildir.

Public istemci env isimleri: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_GOOGLE_AUTH_ENABLED`. `.env.local` Git dışıdır; rutin UI geliştirmesi service_role, OAuth secret veya DB parolası gerektirmez. `.env.example`, setup:device ve SERVICE_ACCESS rehberini kullan. Sır değerlerini çıktıya yazdırma.

## 6. Dosya ve mimari haritası

| Dosya/grup | Rol / sınır |
|---|---|
| `index.html`, `about.html`, `src/main.js` | Ana deneyim, Three sahnesi, mevcut kayıt formları/listeleri, kamera ve UI entegrasyonu |
| `src/style.css`, `auth.css`, `profile.css`, `catalog.css` | Ana/hesap/profil/atlas stilleri; derin siyah sahne |
| `src/universe-data.js` | Mevcut v4 veri modeli, eski sürüm dönüşümü, normalizasyon/import/export |
| `local-primary.js`, `storage-mirror.js` | Misafir IndexedDB birincil depo ve recovery/mirror |
| `record-merge.js`, `sync-merge.js` | Kimlik çatışmaları ve iki/üç taraflı kayıpsız birleşimler |
| `supabase-client.js`, `auth-ui.js`, `account-sync-ui.js` | Public SDK, giriş/hesap UI ve eşitleme bağlantıları |
| `account-cache.ts`, `sync-queue.ts` | Owner'a ayrılmış kalıcı hesap deposu ve dayanıklı offline kuyruk |
| `cloud-universe.ts`, `cloud-write.ts` | Bulut okuma, owner doğrulama, koşullu yazma/onay |
| `sync-engine.ts`, `sync-reconcile.ts` | Seri istekler, geç session koruması, uzaktaki değişimler/conflict |
| `avatar-storage.ts` | Private Storage client kuralları; profil UI entegrasyonu henüz yok |
| `profile-statistics.js`, `profile-ui.js` | Aktif owner evreninde salt okunur profil/istatistik |
| `i18n.js`, `home-i18n.js`, `about.js`, `locales/*.json` | TR/EN/ES anahtarlar, tercih, Intl ve Hakkında |
| `legal-page.js`, `scripts/prerender-legal.mjs` | Üç dil hukuki taslaklar/statik üretim; hukuk kabulü değil |
| `cosmic-field.js` | Dünya konumlu uzak yıldız hacmi ve kamera çevresinde deterministik yakın hücreler |
| `celestial-system.js`, `celestial-ui.js` | Aktif kademeler, kaynak atlası, odak/reset, bulutsu/asteroid/meteor çizimi |
| `nebula-volume.js` | Tek aktif yakın bulutsunun raymarch gaz/toz hacmi |
| `asteroid-orbit.js` | Kaynaktaki orbital elementlerden kayıt epoch'unda Kepler yerleşimi |
| `catalog-layer.js`, `catalog-shape.js`, `catalog-ui.js`, `catalog-overview.js` | Önceki galaksi atlası; kademe 3 aktivasyonu bekliyor, eski UI testleri ertelenmiş |
| `flight-field.js`, `space-details.js`, `local-galaxy-layout.js`, `universe-travel.js` | Önceki uçuş/detay/kişisel merkez ve kamera yardımcıları; varlıkları aktif entegrasyon kabulü değildir |
| `src/data/catalog/*` | Sürümlü gerçek kayıtlar, provenance, SHA256, lisans ve Dünya doku kaynağı |
| `public/assets/*` | Dağıtılan görsel/doku varlıkları; atıflar ATTRIBUTIONS.md |
| `supabase/migrations/*`, `supabase/checks/*`, `templates/*` | Şema/RLS/CAS/Storage, rollback kabul SQL ve Go e-posta şablonları |
| `tests/*`, `e2e/*`, `tests/fixtures/*` | Birim/entegrasyon, izole sentetik tarayıcı fixture ve responsive kabul |
| `scripts/*` | Cihaz/doctor/resume, importer, build/SEO/legal/email, kanıt ve doğrulama yardımcıları |
| `.github/workflows/check.yml` | Uzak CI kapıları; yerel başarı yerine uzaktaki durum ayrıca kontrol edilir |
| `docs/handoff/*` | Ana şartname, güncel devir, tasks/roadmap/ADR, risk, cihaz/servis rehberi, oturumlar ve görsel kanıt |

Tam dosya listesi ve içerikler ayrı kaynak dökümündedir; bu tablo kaynak dosyalarının yerine geçmez.

## 7. Veri modeli ve veri kaybı sınırları

Bugün kullanılan şema **v4**: Universe içinde `galaxies`, `words`, `events`, `activeGalaxyId`; word/conjunction ayrımı, koleksiyon/dil/anlam dili bilgisi var. UI'de “galaksi” denen kullanıcı koleksiyonu ile gerçek OpenNGC galaksisi henüz kalıcı bağlı değildir. Hedef Universe→Collection→Entry, tür registry, review_state/FSRS ve genişleyen content modeli **gelecek iştir**.

Misafir birincil IDB: `wordverse-offline/state`; `wordverse.universe.v4` ve revision yerel recovery. Eski v2/v3 ham kayıtlar dönüşüm öncesi korunur. `wordverse-local-backup` mirror/arşiv bulunur. Hesap IDB `wordverse-accounts/accounts`, owner bazında cache ve atomik kuyruk. Yerel/prod/preview farklı origin ve farklı misafir deposudur. Misafir cihaz değişimi JSON ile; hesap verisi eşitlendikten sonra aynı Google hesabıyla buluttan gelir. Pending offline veri Git ile veya henüz ağa bağlanmadan karşıya taşınmaz.

İlk giriş iki tarafı koruyan merge/özet veya yalnız bulut seçimi sunar. Çakışmalar iki sürümü ve remap edilmiş ilişkileri korur; import tekrarının çoğaltmaması testlidir. Soft delete/tombstone ve açık JSON restore ayrıdır. Kota/yazma hatasında upload engellenir, kalıcı eski kopya korunur, yeni veri bellekte tutulur ve JSON yedek yönlendirmesi görünür. Kalıcı yazılamayan bellek verisinin reload sonrası korunacağını iddia etme.

Gerçek Windows hesabının incelemede **7 kayıt/2 koleksiyonu** değişmedi; misafir tarihsel **13 kayıt** ve v2/v3 arşivler korunur. Bunlar kabul anı sayımlarıdır, gelecekte canlı sayım yerine kullanılamaz. Gerçek içerikleri fotoğraflama; sentetik fixture kullan.

## 8. Supabase / kimlik / hukuk / yedek

Doğru proje **`mrkmtcpzyvooreeokmkp`**. Bazı CLI/MCP bağlantıları başka hesapta; kör `db push`, migration repair veya alternatif Mac şeması uygulama. Dashboard'da uygulanan migrations: `20261002181057`, `20261003064254`, `20261003123923`. Dört owner tablo: `wordverse_galaxies`, `wordverse_entries`, `wordverse_events`, `wordverse_settings`; JSON payload, owner, soft delete ve server version/timestamp. RLS iki hesap/anon rollback kabulü var. SECURITY INVOKER koşullu RPC JWT owner kontrolü/izinli tablo/FOR UPDATE/CAS conflict kullanır.

Google yerel ve env'li preview giriş/senkron/reload doğrulandı. Mail UI ve confirmation/recovery üç dil şablonları hazır; gerçek SMTP teslimatı ve production auth kabulü bekliyor. Dashboard custom template düzenlemesi custom SMTP/Pro şartı çıkardı; kullanıcı bunu erteledi. Ücretli plan açma veya aynı kurulum sorusunu tekrar sorma. OAuth client secret yalnız Dashboard'da kalır. Mevcut ortak Cortexia consent marka etkisi açık iş.

Private bucket `wordverse-avatars`: 2 MiB, JPEG/PNG/WebP, path/owner RLS ve restrictive guard. Client helper ve izole SDK transport testi var; **profil avatar UI ve gerçek Storage API upload/upsert/delete kabulü yok**. `storage.protect_delete` korumasını atlama, storage tablolarına doğrudan DELETE yapma.

Gizlilik/koşullar üç dil taslak; yasal kimlik girildi ama retention, sınır ötesi aktarım/Singapur ve KVKK/GDPR hukuki kabulü tamam değil. Security Advisor'ın Auth uyarısını ücretsiz kabul tamamlanmış sayma. Yedek plandaki RPO24h/RTO4h hedef, uygulanmış SLA değil. Zamanlanmış DB dump/restore tatbikatı henüz yok. JSON export tüm Auth/Storage felaket kurtarma yedeği değildir. Private backups Git dışıdır.

## 9. Güncel yıldız ve gök cismi sistemi

### Yıldız temeli

Desktop uzak hacim 24.000 + yakın 27×600=16.200; compact 9000 +27×240=6480. Toplam kapasite 40.200/15.480; hepsi aynı anda ekranda değildir. Deterministik 600 birim hücreler, ortak dünya konumları, buffer reuse, mesafe fade, iki Points drawcall. Uzak yıldızlar kameraya yapışan arka plan değildir; sabit geniş 3B hacimdir. Noktalar **prosedürel, gerçek yıldız kataloğu değil**. Kamera FOV50, near0.1/far100000; zoom19–50000. Pointer/wheel/pinch/klavye ve ana görünüm dönüşü var; kapsamlı dokunmatik/performans kabulü açık.

Kendi kelime yıldızları yakın ölçekte görünür. `coreOrbit` görsel dönüşüm, kalıcı koordinatlar değiştirilmez. Siyah sahne/vignette, CSS grain kapalı. Yaklaşınca ışık, renk/ölçek ve parallax mevcut; kullanıcı ultra gerçekçiliği kabul etmiş değildir.

### Kademe 1 — 200 bulutsu

OpenNGC sabit revision `75ca7ff090e1d0081a5b08be70eb3bc45ccd9e06`, CC BY-SA4.0. PN/Neb/HII/RfN/SNR/EmN kayıtları; M42/NGC1976 Cl+N açık nebula+cluster istisnası, bütün kümeleri bulutsu diye sayma. RA/Dec J2000, açı/boyut nullable, distanceLy bilinmiyorsa null. Sanatsal sıkıştırılmış koordinat/derinlik; astrometrik fiziksel 3B doğruluk değildir.

200 kayıt, üç derinlik dilimi =600 instanced quad, 7 tür×4 atlas varyantı. Çok uzakta fade; yakın odakta tek raymarch box gaz hacmi, 12 adım, value-noise/fBM/toz/Beer opacity. Aktif overlay gizlenir, diğerleri atlas olarak kalır. Manuel görülen neon/tekrarlanan halkalar için hacim eklendi; komşu gaz örtüşmesi ve sanatsal görünüm kalite kapısı hâlâ açık.

### Kademe 2 — asteroid ve tarihsel meteor

**1000 gerçek JPL ana kuşak (MBA) asteroid**, Ceres/cüce gezegen hariç. SPK/id/name, diameter/albedo/H/rotation, a/e/i/node/perihelion/M/epoch/spektral sınıf kaydı. Orbital yerleşim her kaydın **kendi epoch'unda**, hepsinin bugünkü konumu diye sunulmaz. Logaritmik görünür boyut, seed şekil/rotasyon, mergeVertices/smooth normal/granüler ışık ve yakınlık LOD. Gözlemlenmiş birebir yüzey şekli değildir.

**1000 gerçek CNEOS/JPL tarihsel ateş topu gözlemi**, ayrı UTC kimlikleri. Enerji/impact, nullable enlem-boylam-yükseklik/hız parametreleri; hız bileşenleri tamam değilse türetilmiş hız null. Bu kayıtlar canlı evren olayı veya 1000 eşzamanlı meteor değildir. Atlas seçimi tek gözlemi Dünya atmosferinde **şematik tarihsel tekrar** olarak gösterir. Konumu bilinmeyen olay için iz/konum icat edilmez; tangent iz kesin gözlemlenmiş uçuş rotası değildir. Reduced-motion sabit faz kullanır.

NASA Blue Marble doğal renk JPEG ve day/night shader meteor Dünya'sına eklendi. Doku 2001 gözlemlerinden 2002 kompozitidir, olay gününün fotoğrafı değildir. SHA256 ve NASA/Reto Stöckli/Robert Simmon/MODIS kredisi provenance/ATTRIBUTIONS ve atlas UI'de. Kullanıcı bağlaç gezegenlerinin eski dokusu ayrı korunur.

### Kademe 3 — galaksiler (henüz kapalı)

300 ayrı gerçek OpenNGC TypeG kayıt, 8 morfoloji/32 atlas varyasyonu ve eski yakın gaz/yıldız yardımcıları var. İlk 5 özel kaynaklı galaksi de korunur. **CELESTIAL_STAGE=2; aktif sahne galaksi sayısı 0.** Mevcut renderer dosyalarının bulunması veya eski test/PNG başarıları şu an galaksinin açık olduğu anlamına gelmez. Profesyonel gaz/toz/kol çeşitliliği, LOD ve geçişleri yeniden değerlendir; eski amatör çizimleri sırf sayıyı sağlamak için açma. En uzak ölçek gizleme kuralı sürer.

### Atlas ve kaynak dürüstlüğü

TR/EN/ES tür sekmeleri, arama, 12 kayıt sayfası, gerçek kaynak linki, bilinmeyen değer etiketi, odak ve reset. Gösterilen sayılar **katalog kayıt sayısı**, aynı anda görünen cisim sayısı değil. Prosedürel görseller “gerçek katalog kaydı / sanatsal görselleştirme”; meteor “tarihsel atmosfer olayı / şematik tekrar” etiketli. Browser JPL API çağırmaz; importer sürümlü cache kullanır. OpenNGC türev veri lisansı proje kod lisansından ayrıdır.

## 10. Doğrulama ve bilinen sınırlar

Bu rehber hazırlanırken son yerel `npm run check`: **lint, typecheck, 98 unit, build, 66 e2e geçti**. `format:check` ayrı gate. Star foundation `087f328` CI37141874755, nebula `9418c85` CI37143962448 başarılı tarihsel checkpoint'lerdir. Yeni asteroid/meteor checkpoint'inin remote CI sonucu ayrıca kaydedilir; önceki CI yeni kodun kabulü değildir.

Yeni 6 bulutsu +6 asteroid/meteor senaryosu üç dil×desktop/mobil; ana star-cosmos9 üç dil×1440/768/390. Kaynak bütünlüğü, Kepler yerleşimi, kamera odak/reset, hata/taşma ve v4 bytes korunması testlidir. Eski galaksi UI9 test `tests/deferred/catalog.spec.js` altında, kademe3 yeni atlasına uyarlanmalı; sessizce test kapsamını geçilmiş sayma.

Manuel Chrome 5360 ve sentetik celestial-lab üzerinden M42/Vesta/meteor incelendi. İlk neon halka, düşük poligon kaya, bulutsu içine dolan asteroid ve topografik Dünya sorunları sonrası düzeltmeler yapıldı. Son değişikliklerin manuel/kalite onayı açıkça ayrıca yapılmalıdır. `docs/handoff/evidence` tarihli otomatik responsive ve manuel sentetik kanıt içerir; her eski PNG bugünkü görüntü değildir.

Bulutsu raymarch20→12/polynomial hash ve kamera elapsed clamp100→1000ms düzeltmesi, düşük FPS'te odak zaman aşımını giderdi; hedefli12/12 ardından tam66/66 geçti. Bir eski CI katalog viewport zaman aşımı gerçek hataydı; düzeltme ve sonuç KNOWN_ISSUES'ta. Başarısız denemeyi saklama, timeout gevşeterek görsel kabul iddia etme.

Bilinen build uyarısı: yaklaşık409kB ana JS,545kB asteroid veri chunk'ı; uyarı performans kabulü değildir. 5000 kullanıcı yıldızı, fiziksel mobilde30FPS/desktop60FPS, Lighthouse, tüm dokunmatik davranış ve WebGL fallback henüz ölçülmedi. 40.200 dekoratif yıldız kapasitesi 5000 kullanıcı kayıt stres testinin yerine geçmez.

## 11. Claude için sıradaki işler

1. OS/kabuk, doğru repo/dal, git status, güncel HANDOFF/STATE; temizse pull --ff-only. Doctor ile cihaz erişimi ve env isimlerini doğrula. Kullanıcı verisini koru, yerel5360 görünür aç.
2. Bu paketin snapshot'ını güncel repo ile karşılaştır. Belgede geçen test/CI sonuçlarını yeni commit'e otomatik taşıma. Yeni hedeflere geçmeden en son checkpoint/CI durumunu kontrol et.
3. Kademe2'nin son görsel düzeltmelerini tek tek manuel izle: M42/M57/M1, asteroid yakın yüzeyi/yörünge, konumlu/konumsuz tarihsel meteor, doğal Dünya, zoom/drag/reset. 1440/768/390, tema/reduced-motion ve geçişleri doğrula. Profesyonel kaliteye ulaşmayanları dürüstçe açık bırak.
4. Yıldızların görünümü, bulutsu hacmi/toz ve örtüşme, OLED uzak sahne parlama/patlama/dalga, hareket/performans bütçesini somut görsel adımlarla iyileştir. Kelime yıldızları okunaklı kalsın.
5. Kademe3 için 300 gerçek galaksiyi profesyonel farklı morfoloji/ışık/gaz/toz ve kesintisiz yaklaşma ile geri ekle; en uzak zoomda gizle, kişisel evren merkezini koru. Yeni atlas UI/ertelenmiş testleri uyumla; kaynak ve lisansları koru.
6. Faz4 kalan250gezegen/25takımyıldızı, koleksiyon gerçekgalaksi bağlantısı, kalıcı sürükleme/otomatik düzen; sonra Faz5–9. Faz2/3 ertelenen kabulüne kullanıcı önceliğine göre daha sonra dön.
7. Her anlamlı adım: ilgili otomatik gate + gerçek görsel kullanım/kanıt → HANDOFF/TASKS/KNOWN_ISSUES/session → Conventional Commit/push → remote CI/preview sonucu. Faz bitmeden main/tag/prod yok. Kanıt gerçek kullanıcı içeriği içermez.

## 12. Kesinlikle tamamlandı sayılmayacaklar

Ultra gerçekçi evren ve tüm yıldız/galaksi kalitesi; aktif300galaksi; tüm Faz4; ≥250gezegen/25takımyıldızı/50olay türü; FSRS ve registry; gerçek MacBook/two-device kabulü; gerçek mail/prod auth/Storage API; profil avatar/hesap silme; hukuki uyum; zamanlanmış tam yedek/restore; 5000kayıt FPS/PWA/WebGLfallback. Her biri açık görevdir.

## 13. Tam belge setini nasıl kullanmalı?

- `MASTER_PROMPT.md`: orijinal tam ürün şartnamesi/kurallar.
- `HANDOFF.md`: tek güncel yapılacak iş ve son somut doğrulama.
- `STATE.json`: aktif dal/faz/kademe ve son sayısal gereksinimler.
- `TASKS.md`, `ROADMAP.md`: faz kapsamı ve kabul listeleri; tarihsel bloklar açıkça tarihsel okunur.
- `KNOWN_ISSUES.md`: başarısız kontrol, risk ve doğrulanmamış sınırlar.
- `DECISIONS.md`: mimari kararlar ve ertelenme gerekçeleri; son kullanıcı talimatı eski planı değiştirebilir.
- `CROSS_DEVICE.md`, `SERVICE_ACCESS.md`, `ENVIRONMENT.md`: cihaz/servis/env/backup rehberi.
- `AUDIT.md`, sessions, evidence, README, CHANGELOG, ATTRIBUTIONS, Supabase checks/templates: geçmiş ve kanıt.
- Masaüstü paketindeki `WORDVERSE_TAM_KAYNAK_DOKUMU.md`: tüm Git metin dosyalarının eksiksiz içerikleri. Büyükse path başlıklarını arayıp parçalar halinde oku; boyutu nedeniyle okunamadı diyerek görevi bırakma. Binary dosyalar manifest ve ZIP'te.
- `WORDVERSE_KAYNAKLAR.zip`: aynı commit'in tüm Git dosyaları; `.git` geçmişi değil. Çalışmak için doğru repo/dalı kullan; ZIP'i canlı kullanıcı deposu üstüne kontrolsüz açma.
- `CLAUDE_BASLANGIC_PROMPTU.md`: yeni Claude oturumuna yapıştırılacak hazır görev.

Bu rehber proje kodunun, tüm eski konuşma geçmişinin veya sunucu canlı durumunun yerine geçmez. Paket snapshot commit'i ve bütünlük sayımı Masaüstü `PAKET_BILGILERI.md` içinde yer alır. Tek bir metin satırını atlamama şartı **kaynak dökümünde** karşılanır; anlatım rehberi bu kaynakları anlaşılır şekilde birleştirir.
