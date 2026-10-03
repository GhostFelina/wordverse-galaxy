# Görevler

Durum: `[ ]` bekliyor, `[~]` sürüyor, `[x]` doğrulandı. Sorumlu: codex veya claude. Dal adları faz başlığı altındadır.

## Faz 0 · `phase/0-audit-infrastructure` · codex

- [x] Repo, işletim sistemi, git ve başlangıç testlerini denetle; `AUDIT.md` yaz.
- [x] Ana görev tanımını repoya al; AGENTS/CLAUDE yönlendirmeleri ve devir belgelerini oluştur.
- [x] Hedef mimariyi ADR ile kaydet.
- [x] v2/v3 ham veriyi dönüşümden önce arşivle ve şema sürümünü yaz; arşivin üzerine yazılmamasını test et.
- [x] Eski v2 kelime dizisi ve v3 JSON yedeklerini içe alma testini ekle.
- [x] Vitest, Playwright, ESLint, Prettier ve TypeScript hazırlığını bağla; yerel kontrolleri geçir. CI uzakta push sonrası doğrulanacak.
- [x] Yerel tarayıcıda 1440/768/390, aydınlık/karanlık, azaltılmış hareket kontrolünü yap ve kanıt kaydet. Tablet/mobil taşmalar düzeltildi.
- [x] Changelog ve SemVer; PR #3 main merge, GitHub CI, Vercel preview/prod, canlı duman testi, `v1.10.0` tag ve GitHub Release tamamlandı.

## Faz 1 · `phase/1-i18n` · codex/claude

- [x] Ana uygulama ve Hakkında görünür metinleri, hata/boş durum/tooltip/meta/JSON-LD üç dilde; eş anahtar testi var. Altı statik SEO sayfası üretildi. E-posta şablonları Faz 2 auth ile oluşturulacak.
- [x] Profil→localStorage→tarayıcı→TR önceliği yardımcıda/testte; iki sayfada mobil dil seçimi ve Intl tarih/sayı/çoğul çalışıyor. Gerçek profil tercihi Faz 3 veri modeliyle bağlanacak.
- [x] Öğrenilen dil/anlam dili ayrımı ve v3 koruyan v4 migrasyonu yapıldı; altı statik sayfada canonical ve `hreflang` doğrulandı.
- [x] Üç dilde ana/ekle/ayrıntı/koleksiyon/galaksi ve Hakkında akışları otomatik geçti; 1440/768/390, tema ve hareket kanıtı var. PR #4 merge, main CI, Vercel prod ve altı dil sayfası/izole kelime ekleme duman testi geçti.

## Faz 2 · kabul ertelendi (kullanıcı 2026-10-03, ADR012) · `phase/2-auth-sync` · codex/claude

- [x] Dört tablolu sürümlü migration hedef Wordverse Dashboard'da uygulandı. RLS iki hesaplı rollback testi geçti; anonim erişim ve doğrudan silme kapalı. İlk schema advisor kaydı tarihseldir; güncel Security Advisor 0 hata/1 Auth uyarısı, kullanılmamış iki FK indeksi korundu.
- [ ] CLI hedef hesap erişimi ve uygulanmış migration geçmişinin eşleştirilmesi (MCP/CLI farklı hesapta).
- [x] İlk girişte iki tarafı koruyan birleşim, özet ve bulut/misafir seçimi ana uygulamaya bağlandı; kimlik çakışması e2e geçti.
- [x] Hesap IDB yazma/kota hatası: upload engeli, eski kalıcı kopya/misafir koruması, yeni kayıt memory retention ve retry/reload; e2e + native IDB izole fixture/manual. 82 unit/42 e2e; gerçek disk kotası kabulü değildir.
- [x] Yerel yazma hatasında kalıcı açık tutma/JSON yedekleme yönlendirmesi (TR/EN/ES, localSaved state, e2e/manual); network hatasından ayrı bildirim. Retry öncesi bellek verisinin reload korunması iddia edilmez.
- [x] Hesap deposu engellenme/late-open/retry koruması: geç native bağlantı kapatılır, SecurityError sırasında bulut çağrısı yapılmaz ve misafir korunur; erişim geri gelince bağlanma geçti. 82 unit/40 e2e + ayrı fixture manual; gerçek tarayıcı politika engeli kabulü değildir.
- [x] IndexedDB birincil yerel depo, ayrı hesap cache'i, offline kuyruk, bulut eşitlemesi, durum göstergesi ve retry bağlandı; ağ geri gelince upload ve reload e2e geçti.
- [x] Bulut okuyucu, hesap başına atomik cache, dayanıklı kuyruk ve tam içerik/sahiplik kontrolüyle yazma onayı ana uygulamada kullanılıyor.
- [x] Sürüm koşullu SECURITY INVOKER RPC hedefte uygulandı; server timestamp, JWT sahibi, eski sürüm conflict ve tombstone gerçek rollback SQL testinde doğrulandı.
- [x] Seri senkron motoru, hesap değişimi sırasında geç istek koruması ve üç taraflı conflict kopyası; 63 birim, izole IDB tarayıcı kontrolü ve 25 Playwright geçti.
- [x] Hesap oturumu controller'ı, ilk giriş özeti, senkron göstergesi ve main/auth UI bağlantısı. Gerçek Google hesabında 5 kayıt/2 galaksi upload/reload/çıkış/misafire dönüş doğrulandı.
- [~] Üç dil e-posta kayıt/giriş/doğrulama bildirimi/sıfırlama/çıkış UI yazıldı; Google hazırlık bildirimi var. Gerçek mail/prod auth, OAuth ve URL Configuration henüz doğrulanmadı.
- [x] Confirmation/recovery üç dil metinleri locales'e, sürümlü Go şablonları supabase/templates'e; altı yerel preview, üç ekran genişliği kontrolü ve tasarım kanıtı. Yerel html/template 24 senaryo geçti; nil Data/invalid locale hatası düzeltildi ve CI gate eklendi. Hosted uygulama/render/mail teslimatı bekliyor.
- [ ] Custom SMTP + gerçek mail kabulü: 2026-10-03 Dashboard free planda şablon düzenlemesini custom SMTP/Pro'ya bağlamış. Kullanıcı bu giriş/kurulum adımlarını sonraya bıraktı; ücretli plan açma, sır isteme veya tekrar soru sorma.
- [~] Üç dil gizlilik/koşullar statik sayfaları hazır; yasal kimlik, saklama ve aktarım güvenceleri tamamlanmalı.
- [x] Supabase prod Site URL ve altı prod/proje-preview/yerel dönüş kalıbı Dashboard'da kaydedildi.
- [x] Kullanıcı Google istemcisi/Secret aktarımını tamamladı. Provider public ayarı etkin; yerel gerçek Google giriş/çıkış ve senkron doğrulandı. Secret okunmadı/kaydedilmedi.
- [~] Wordverse consent marka/hukuki URL düzeni; mevcut Cortexia ortak marka etkisi çözülecek.
- [x] Misafir modu, IndexedDB birincil depo, kayıpsız merge, offline kuyruk ve soft delete çekirdek/UI bağlandı.
- [x] Vercel Production/Preview/Development için üç public env adı tanımlandı; .env.local Google flag etkin.
- [x] Hesap JSON export + eski v3 import + reload + misafir ayrımı e2e; gerçek hesap JSON indirme manuel geçti. Kısa ekranlarda panel kaydırma düzeltildi.
- [x] JSON import kimlik çatışmasında iki sürümü korur; galaksi/kelime/olay snapshot bağlantıları remap edilir, tekrar import çoğaltmaz. Üç unit + hesap sync/reload e2e ve ayrı misafir origin manuel kanıtı; 71 unit/37 e2e geçti.
- [x] Hesap tombstone + reload + açık JSON restore e2e. Boş hesapta gerçek galaksi paneli açılışı ve aria-hidden kontrolü düzeltildi.
- [x] Sekmeye dönüş/focus/visibility bulut refresh, 15 saniye burst sınırı, açık düzenleme formunda foreground refresh atlama; hata retry durumunu koruma ve görünür liste güncelleme. Otomatik uzak değişim/draft/CAS conflict kabulü geçti; gerçek fiziksel iki cihaz testi bekliyor.
- [x] Private wordverse-avatars bucket (2 MiB, JPEG/PNG/WebP), folder+owner_id RLS ve geniş izinli policy karşısında restrictive guard hedefte uygulandı; iki hesap/anon/owner reassignment rollback testi ve Dashboard limit kanıtı geçti.
- [x] Avatar client helper (sahip/path/tür/imza/boyut, upload/upsert/private download/tek nesne remove ve late session guard), 10 unit + izole gerçek SDK transport e2e/manual. 81 unit/38 e2e; üretim profil entegrasyonu ve gerçek Storage API kabulü değildir.
- [ ] Gerçek Storage API upload/upsert/delete, boyut ve MIME reddi kabulü (profil UI henüz yok).
- [x] ENVIRONMENT yedek/kurtarma planı, private-backups Git dışlama. RPO/RTO hedef; zamanlanmış dump ve restore tatbikatı henüz yok.
- [ ] Prod auth duman testi; gerçek e-posta ve üç dil şablon kabulü.
- [x] Windows Codex/Claude ortak yönlendirme ve HANDOFF; iki CLI/giriş ve GitHub pull/push/admin/dry-run doğrulandı. setup:device, doctor, resume komutları ve Mac bootstrap hazırlanıp Windows/sözdizimi kontrolleri geçti.
- [ ] Gerçek MacBook ilk kurulum: hesap girişleri, doctor push-check, test/görsel doğrulama. CROSS_DEVICE/SERVICE_ACCESS adımlarından ilerle; sırları cihazlar arasında kopyalama.
- [x] Vercel env'li preview gerçek Google girişinde ayrı origin'den 6 kayıt/2 galaksi, yalnız bulut seçimi ve reload doğrulandı.

## Faz 3 · kalan işler ertelendi (görsel öncelik, ADR013) · `phase/3-profile` · codex/claude

- [x] Salt okunur evren istatistik çekirdeği: toplamlar, dil dağılımı, tarihli en eski/son 5 kayıt; input/çıktı ayrımı, invalid/future date ve deleted kayıt sınamaları.
- [x] Hesap menüsünde TR/EN/ES profil ekranı; mevcut açık evrenle sınırlı, aç/kapat. 1440/768/390 tema/hareket/taşma ve literal HTML text güvenliği e2e; gerçek hesapta manual + yapay fixture kanıtı.
- [ ] Profil açıkken hesap değişimi ve aynı hesap token refresh kabulü; düzenleme formunda eski owner verisi/draft korunma sınırları.
- [ ] Görünen ad/kullanıcı adı ve tercihler veri modeli + owner sync/guest ayrımı; unique/public handle politikası belirlenmeli.
- [ ] Takvim, seri ve en eski yıldız; tarih/saat dilimi ve silme/import etkileriyle tutarlı hesaplama.


- [ ] Profil alanları, avatar, istatistik/ısı haritası, tekrar güçlü-zayıf analizi.
- [ ] Hedef/ayarlar, rozetler, JSON+CSV, kalıcı hesap silme, varsayılan gizli paylaşım.

> **Güncellik notu:** Aşağıdaki Faz 4 eski tamamlanmış adımları/talepleri tarihsel kayıt olarak tutar. En uzak300galaksi ve ≥100bulutsu şartı son kullanıcı talimatıyla değişti. Güncel aktivasyon/sayı/kalite ve kabul aşağıdaki “Güncel görsel yönlendirme” son bloğunda ve HANDOFF/CLAUDE_BRIEF içindedir. Eski [x] aktif sahne kabulü değildir.

## Faz 4 · `phase/4-universe` · codex/claude

- [x] İlk 5 kaynaklı galaksi, ayrı arka plan katmanı, üç dil katalog/odak/eve dön ve yumuşak zoom görünürlük geçişi; 88 unit/48 e2e + manuel katalog/sahne kanıtı.
- [x] İlk kullanıcı X referansı sağ taraf 00:10–00:15: yakın yıldız/gaz içinden uçuş, uzak görünümde 200–300 ayrı gerçek galaksi. OpenNGC kaynak/lisans ve 300 kayıt, atlas/instancing/LOD, kamera derinliği ve görünür sayım kabulü.

- [~] Kaynak/lisans kayıtlı galaksi sayısı 300; 100 bulutsu, 250 gezegen, 25 takımyıldızı ve tam uzaklık/fiziksel yerleşim kabulü kaldı.
- [x] 8 morfoloji/32 atlas varyasyonu, galaksiye göre yakın yıldız/gaz, merkezde kişisel kelime düzeni ve büyüme/dönüş pivot koruması; depodaki koordinatlar değişmedi.
- [ ] Gerçek galaksiye bağlı koleksiyon migrasyonu, morfoloji, LOD ve kesintisiz zoom.
- [ ] Kamera ve dokunmatik; yıldız/gezegen sürükleme, kalıcı konum ve otomatik düzen.

## Faz 5 · `phase/5-memory` · codex/claude

- [ ] Tür kayıt sistemi ve genişletilebilir Entry modeli; `docs/EXTENDING.md`.
- [ ] Gerçekçi yıldız görünümü ve yaşa bağlı geri dönüşsüz evrim; kelimeler kalıcı.
- [ ] FSRS, hafıza görseli, rastgele/günlük/ters tekrar ve telaffuz.

## Faz 6 · `phase/6-events` · codex/claude

- [ ] Fizik referanslı iki kuyruklu kuyruklu yıldız ve sakin nadirlik dağılımı.
- [ ] ≥50 olay, üç dilde kaynaklı bilgi kartları ve gözlem günlüğü.

## Faz 7 · `phase/7-brand` · codex/claude

- [ ] Logo, favicon/PWA/OG/banner görselleri; `BRAND.md`, atıflar ve optimizasyon.

## Faz 8 · `phase/8-showcase` · codex/claude

- [ ] Üç dil README, GIF/video, mimari ve kurulum; lisans/topluluk/şablonlar.
- [ ] Repo açıklaması, topics, önizleme, `good first issue`; platforma özgü lansman taslakları.

## Faz 9 · `phase/9-polish` · codex/claude

- [ ] 5.000 yıldız stres ve Lighthouse; 60/30 FPS bütçesi, LOD ve yükleme.
- [ ] WebGL fallback, klavye/ekran okuyucu, kontrast, hareket azaltma.
- [ ] Çevrimdışı PWA, isteğe bağlı analitik, yüksek çözünürlüklü galaksi indirme.

## Güncel görsel yönlendirme (2026-10-03)

- [~] Tek kâinat: en uzak zoom yalnız yıldız alanı; galaksiler yaklaşınca görünür. Önceki en uzakta 300 galaksi şartı kullanıcı tarafından değiştirildi; 300 ara ölçekte kalır.
- [~] Sabit galaksi dünya konumları, pointer zoom/derinlik çıkışında hedef sürekliliği, akıtılan yıldız bölgeleri; 3 prosedürel bulutsu ve yakın 3B asteroid ilk katmanı. Test/manual kanıt ve checkpoint CI tamamlanmalı.
- [ ] Bulutsuların üç dil etkileşimli katalog kartları; ≥100 bulutsu, ≥250 gerçek parametreli gezegen ve bilimsel asteroid/atmosferik meteor ayrımıyla ≥50 olay kabulü.

### Son talimat: önce yıldız temeli

- [~] Tüm galaksi görselleri/katalog ana uygulamadan çıkarıldı; kullanıcı kelime/koleksiyon verileri korunur. Yalnız uzak gök + yakın deterministik yıldız bölgeleri, kesintisiz kamera etkileşimi.
- [~] 9 star-cosmos e2e + manual yapay yıldız sahnesi; son gate ve CI checkpoint doğrulanmalı. Galaksi testleri tests/deferred altında, kapsam ertelendi.
- [ ] Yıldız temeli tamamlandıktan sonra bulutsu/asteroid/meteor ve galaksileri dahil et. Galaksileri hemen yeniden açma.

## Güncel görsel yönlendirme · 2026-10-03

- [x] Galaksisiz yıldız temeli: 087f328 CI37141874755/Vercel geçti.
- [x] 200 gerçek OpenNGC bulutsu: kaynak/arama/odak/reset ve otomatik katman kontrolü geçti; profesyonel görsel kalite ayrı açık görev.
- [x] Toplam ≥1000 asteroid/meteor kaynak/katman otomatik kabulü:1000 MBA asteroid +1000 tarihsel gözlem, orbit/arama/odak/reset; son npm run check98unit/66e2e. Son manuel kalite/FPS kabulü açık.
- [~] ≥150 farklı gerçek galaksi: mevcut 300 kayıt; aşama 3 yeniden aktivasyon ve geçiş kabulü bekliyor.
- [ ] En uzak ölçekte ultra gerçekçi yıldız alanı, parlama/patlama/dalga: kullanıcı son yönlendirmesi, ayrı görsel ve reduced-motion/performance kabulü. Galaksiler o ölçekte gizli.

- [ ] Kullanıcı yıldız/galaksileri amatör buldu: profesyonel ışık, gaz/toz/morfoloji/ölçek-geçiş yeniden çalışması; mevcut atlas görsel kabul sayılmaz.

## Son devir paketi · 2026-10-03

- [x] CLAUDE_BRIEF: bütün proje, mimari/veri/servis/faz/karar ve gerçek kabul sınırlarını tek rehberde toplama.
- [ ] Kademe2 son hacim/kaya/doğal Dünya düzeltmeleri: manual/responsive tema/hareket ve profesyonel görünüm kabulü; sayısal otomatik kabul bunun yerine geçmez.
- [ ] Desktop MD tam metin/binary ZIP snapshot ve hazır Claude promptu üret; dosya/satır/hash manifestini doğrula.
