# WORDVERSE — Ana Geliştirme Görevi (Codex CLI)

> Bu dosya senin ana görev tanımın. Önce baştan sona oku. Sonra **Faz 0**'dan başla. Kendi alt fazlarını, todo listelerini ve görev dağılımını bu çerçeveye göre sen kur.
> Canlı site: https://wordverse-galaxy.vercel.app · Hakkında: https://wordverse-galaxy.vercel.app/about.html

---

## 0. Ürünü anla (kod yazmadan önce)

Wordverse, kullanıcının öğrendiği her **kelimeyi bir yıldıza**, her **bağlacı bir gezegene** dönüştüren kişisel bir "bilgi evreni"dir.

- Kullanıcı (proje sahibi) her gün ya da yeni bir şey öğrendiğinde kelime veya bağlaç girer.
- Zamanla binlerce yıldız birikir. Bu hem eğlenceli bir öğrenme günlüğü, hem de görsel bir başarı arşividir.
- **Tekrar amacı çok önemli:** Kullanıcı ara sıra uygulamayı açacak, rastgele bir yıldız veya gezegen seçecek ve "unuttum mu?" diye kendini test edecek. Bu, ürünün çekirdek davranışıdır, yan özellik değildir.
- **Gelecek:** Şu an dil öğrenimi var. İleride zaman kipleri (tense) ve başka dil terimleri, ondan sonra da not defteri, projeler, çalışmalar gibi dil dışı içerikler eklenecek. Mimariyi şimdiden **genişletilebilir** kur (bkz. §5.1).
- Mevcut durum: Statik site Vercel'de yayında. Veri localStorage'da ve ikinci bir yerel kopyada tutuluyor. JSON yedekleme ve geri yükleme var. Dil başına ayrı galaksi var (İngilizce ve İspanyolca). Yıldızlar beyazdan sıcak tonlara yaşlanıyor. En eski iki yıldız çift yıldız gibi dönüyor. Bağlaçlar NASA/JPL dokulu gezegenler olarak görünüyor.

**Altın kural:** Kullanıcının mevcut verisi kutsaldır. Hiçbir değişiklik mevcut localStorage kayıtlarını kaybettiremez. Her şema değişikliğinde versiyonlu migration yaz, eski yedek JSON'larının hâlâ içe aktarılabildiğini test et.

---

## 1. Çalışma kuralları (her fazda geçerli)

### 1.1 Otonomi
- Proje sahibi tüm izin ve onayları önceden verdi. Rutin işlerde (dosya düzenleme, paket kurma, test, build, commit, push, preview deploy) **onay isteme, soru sorma, devam et.**
- Yalnızca şu durumlarda dur ve sor: geri alınamaz veri silme (prod veritabanı, kullanıcı kayıtları), ücretli bir servis veya plan açma, hesap şifresi veya 2FA gerektiren bir adım, proje klasörü dışındaki sistem dosyalarını değiştirme.
- Belirsizlikte makul bir karar ver, `docs/handoff/DECISIONS.md`'ye gerekçesiyle yaz ve devam et.

### 1.2 Doğrulama: "Bitti" demeden önce iki kontrol
"Tamamlandı / çalışıyor / düzeldi / başarılı" dediğin her şeyi **iki ayrı yoldan** doğrula:
1. **Kod/otomatik:** Birim testi, tip kontrolü, lint, build ve Playwright e2e testi geçmeli.
2. **Görsel/manuel:** Yerel tarayıcıda uygulamayı aç ve bir insan gibi kullan (fare, klavye, zoom, sürükleme). Ekran görüntüsü al ve `docs/handoff/evidence/` altına tarihli kaydet.

Bir kontrol başarısızsa "bitti" deme. Düzelt ve iki kontrolü tekrarla. Masaüstü (1440px), tablet (768px) ve mobil (390px) genişliklerini, açık ve koyu sistem temasını, `prefers-reduced-motion` ayarını mutlaka kontrol et.

### 1.3 Tarayıcı kullanımı
- Kendi işini sürekli **yerel tarayıcıda** izle.
- Harici web sitelerinde (Google Cloud Console, Supabase Dashboard, ChatGPT) **Chrome DevTools Protocol / CDP tabanlı otomasyon kullanma.** Tarayıcıyı bir insan gibi, ekran, fare ve klavye ile kullan.
- Proje içi otomatik testler için Playwright kullanılabilir. Bu, repodaki test altyapısıdır ve yukarıdaki yasağın kapsamı dışındadır.
- Bir adımda giriş, şifre, 2FA veya CAPTCHA çıkarsa dur. Kullanıcıya tam olarak neyi yapması gerektiğini tek bir kısa listeyle yaz ve o adım tamamlanınca devam et.

### 1.4 Git, sürüm, deploy
- Küçük ve anlamlı commit'ler at, Conventional Commits kullan (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`, `test:`, `chore:`).
- Her faz için bir branch aç. Faz bitince main'e merge et.
- SemVer kullan. Her faz sonunda `CHANGELOG.md`'yi güncelle, git tag ve GitHub Release oluştur.
- Her push'ta Vercel preview deploy oluşsun. Prod'a yalnızca §1.2'deki iki kontrol geçtikten sonra çık.
- Prod deploy'dan sonra canlı URL'de duman testi yap (sayfa açılıyor mu, kelime ekleniyor mu, yenileyince duruyor mu, giriş çalışıyor mu).

### 1.5 Güvenlik ve sırlar
- **Hiçbir sırrı repoya, koda, commit mesajına, handoff dosyasına veya log'a yazma.**
- `.env.local` kullan (gitignore'da olmalı). `.env.example` dosyasında yalnızca anahtar isimleri dursun.
- Supabase `service_role` anahtarı ve veritabanı şifresi asla istemci koduna girmez.
- Google OAuth Client Secret yalnızca Supabase Dashboard'a (Auth → Providers → Google) girilir, repoya girmez.
- Vercel ortam değişkenlerini Vercel CLI veya Dashboard üzerinden tanımla.
- Repoda bir sır bulursan hemen kaldır, git geçmişini temizle ve kullanıcıya anahtarı yenilemesini söyle.

### 1.6 Lisans ve kaynak dürüstlüğü
- Kullandığın her görsel, doku, veri seti ve kod parçası için `ATTRIBUTIONS.md`'ye kaynak, lisans ve gereken atıf metnini yaz.
- NASA görselleri genellikle serbesttir ama atıf ister. NASA logosu ve kurum amblemleri kullanılamaz.
- ESA/Hubble ve ESA/Webb görselleri genellikle CC BY 4.0 lisanslıdır ve atıf zorunludur. Her görselin lisansını tek tek doğrula.
- SpaceX görsellerinin lisansını tek tek kontrol et. Emin değilsen kullanma.
- GitHub'dan kod alıyorsan lisansı uyumlu olmalı (MIT, Apache, BSD). GPL kodu projenin lisansını etkiler, dikkat et.
- Reddit ve forumlar yalnızca fikir ve teknik çözüm kaynağıdır, oradan içerik kopyalama.
- "Birebir gerçek" diye sunduğun her nesne gerçek bir katalog kaydına dayanmalı (Messier, NGC, IC, Sharpless, NASA Exoplanet Archive vb.). Gerçek görüntüsü olmayan nesneleri (örneğin çoğu ötegezegen) **gerçek parametrelerden üretilmiş prosedürel görselleştirme** olarak etiketle. Uydurma görüntüyü "gerçek fotoğraf" diye sunma.

---

## 2. Devir (handoff) sistemi — Faz 0'da ilk iş bunu kur

Proje Codex ve Claude Code arasında dönüşümlü geliştirilecek (örneğin Codex'in 5 saatlik limiti bitince Claude Code devam edecek, sonra tersi). İki ajan da sıfır bağlamla gelip 2 dakikada nerede kalındığını anlayabilmeli.

Kurulacak yapı:

```
AGENTS.md                  ← Codex bunu otomatik okur. Kısa giriş ve docs/handoff'a yönlendirme.
CLAUDE.md                  ← Claude Code bunu otomatik okur. AGENTS.md ile aynı yönlendirme.
docs/handoff/
  HANDOFF.md               ← TEK GERÇEK KAYNAK: şu anki durum, son yapılanlar, tam sıradaki adım
  ROADMAP.md               ← Fazlar, kabul kriterleri, ilerleme yüzdeleri
  TASKS.md                 ← Ayrıntılı todo: [ ] / [~] / [x], sahibi (codex/claude), branch
  DECISIONS.md             ← Mimari kararlar (ADR formatı: bağlam, karar, alternatifler, sonuç)
  KNOWN_ISSUES.md          ← Açık hatalar, geçici çözümler, teknik borç
  ENVIRONMENT.md           ← Kurulum, komutlar, env anahtar İSİMLERİ (değerleri değil), servis bağlantıları
  sessions/YYYY-MM-DD-HHMM-<agent>.md  ← Her oturumun özeti
  evidence/                ← Doğrulama ekran görüntüleri
```

Kurallar:
- `AGENTS.md` ve `CLAUDE.md` kısa olsun ve ikisi de `docs/handoff/HANDOFF.md`'ye yönlendirsin. İçerik tekrarlanmasın.
- **Her anlamlı adımdan sonra** (en geç 30-45 dakikada bir) `HANDOFF.md` ve `TASKS.md`'yi güncelle ve commit et. Limit her an bitebilir, bu yüzden handoff'u oturum sonuna bırakma.
- `HANDOFF.md` şu başlıkları içersin: Son güncelleme (tarih, ajan, commit hash) · Şu an aktif faz ve branch · Son oturumda yapılanlar · Yarım kalan iş (dosya ve satır düzeyinde) · **Sıradaki ilk 3 adım** · Dikkat edilmesi gerekenler · Doğrulanmamış iddialar.
- Bir oturuma başlarken: `git pull`, `HANDOFF.md`'yi oku, `KNOWN_ISSUES.md`'yi oku, testleri çalıştır ve sonra devam et.

---

## 3. Fazlar

Her fazın sonunda: §1.2 iki kontrolü, commit, tag, deploy, handoff güncellemesi.

### Faz 0 — Denetim ve altyapı
- Mevcut kodu, teknoloji yığınını, veri formatını, render yöntemini (Canvas 2D / WebGL / Three.js) ve performansı analiz et. Bulguları `docs/handoff/AUDIT.md`'ye yaz.
- Hedef mimariyi seç ve gerekçesini ADR olarak yaz. Mevcut çalışan şeyi gereksiz yere baştan yazma. Ama ölçek hedefleri (§6) ve auth/sync gereksinimleri mevcut yapıyla karşılanamıyorsa geçiş planı çıkar. Muhtemel yön: Vite + TypeScript, render için Three.js/WebGL (instancing, shader, LOD), Supabase JS istemcisi.
- Test altyapısını kur (Vitest + Playwright), lint ve format araçlarını kur, GitHub Actions CI'ı kur (lint, test, build).
- Handoff sistemini kur (§2).
- Mevcut localStorage verisinin otomatik yedeğini alan ve şema versiyonunu tutan bir migration katmanı yaz.

### Faz 1 — Çok dilli arayüz (TR / EN / ES)
- Tüm UI metinlerini çeviri dosyalarına taşı (`locales/tr.json`, `en.json`, `es.json`). Bu, about sayfasını, hata mesajlarını, boş durumları, tooltip'leri, e-posta şablonlarını, meta ve OG etiketlerini de kapsar.
- Dil seçici: Üst barda, profil ve ayar alanına yakın, estetik ve kompakt bir seçici (örneğin `TR · EN · ES` segmentli kontrol veya küre ikonlu menü). Mobilde de rahat erişilebilir olsun.
- Dil sırası: kullanıcı tercihi (profil) → localStorage → tarayıcı dili → TR.
- Çoğul ekler, tarih ve sayı formatları `Intl` API ile her dilde doğru görünsün.
- `hreflang` ve dil başına meta etiketleri ekle.
- **Önemli ayrım:** Arayüz dili ile öğrenilen dil ve anlam dili ayrı kavramlardır. Şu an anlam alanı "Türkçe anlamı" olarak sabit. Bunu galaksi başına yapılandırılabilir yap (örneğin "öğrenilen: İngilizce → anlam dili: Türkçe").
- Test: Her dilde tüm ekranları dolaş, eksik çeviri anahtarı kalmasın. Eksik anahtarı yakalayan bir CI testi yaz.

### Faz 2 — Hesap, giriş ve bulut senkronu (Supabase)
**Auth:**
- E-posta + şifre ile kayıt ve giriş, e-posta doğrulama, şifre sıfırlama, magic link (isteğe bağlı) ve **Sign in with Google**.
- Estetik bir giriş ve kayıt ekranı tasarla (evren temasıyla uyumlu, erişilebilir, üç dilde).
- **Misafir modu korunmalı.** Giriş yapmadan kullanım devam etmeli (yerel kayıt). İlk girişte yerel veriyi buluta taşıma ve birleştirme akışı sun (çakışmada iki tarafı da koru, kullanıcıya özet göster).

**Google OAuth kurulumu (tarayıcıyı insan gibi kullanarak):**
- Google Cloud Console'da **kopukfad@gmail.com** hesabıyla çalış. Proje: `cortexia-language`.
  Başlangıç URL'si: https://console.cloud.google.com/cloud-hub/home;board-filter=type:rlabel,key:project_id,val:cortexia-language%2Btype:APP_HUB,key:application_name?authuser=1&project=cortexia-language
- Adımlar: OAuth consent screen'i yapılandır (uygulama adı Wordverse, logo, destek e-postası, gizlilik politikası URL'si, kullanım koşulları URL'si, yetkili alan adları). Sonra OAuth Client ID (Web application) oluştur.
  - Authorized JavaScript origins: `https://wordverse-galaxy.vercel.app`, `http://localhost:<port>` (özel alan adı eklenirse onu da ekle).
  - Authorized redirect URI: `https://mrkmtcpzyvooreeokmkp.supabase.co/auth/v1/callback`
- Client ID ve Secret'ı Supabase Dashboard → Authentication → Providers → Google'a gir. Secret'ı başka hiçbir yere yazma.
- Supabase → Authentication → URL Configuration: Site URL (prod), Redirect URLs (prod, Vercel preview wildcard'ı, localhost).
- Consent screen "Testing" durumundaysa kullanıcıya üretime almak için neyin gerektiğini `KNOWN_ISSUES.md`'ye yaz.
- Bunun için gerekli `/privacy` ve `/terms` sayfalarını üç dilde oluştur. KVKK ve GDPR'a uygun, sade ve dürüst metinler yaz.

**Supabase:**
- Proje URL'si: `https://mrkmtcpzyvooreeokmkp.supabase.co`
- Publishable key: `sb_publishable_pr86iEebiy7GTsFqnw5tMQ_Loa7dd5R` (istemcide kullanılabilir, `.env.local` ve Vercel env'e koy)
- CLI: `supabase login` → `supabase init` → `supabase link --project-ref mrkmtcpzyvooreeokmkp`
- Veritabanı şifresi gerekiyorsa kullanıcıdan iste ve yalnızca yerel ortam değişkeninde tut.
- Tüm şema değişiklikleri `supabase/migrations/` altında versiyonlu SQL olsun.
- **Her tabloda Row Level Security açık olsun** (kullanıcı yalnızca kendi satırlarını görür ve değiştirir). RLS politikalarını test et (başka kullanıcının verisine erişim denemesi başarısız olmalı).
- Avatar için Supabase Storage bucket kur (boyut ve tip limitli).

**Senkron:**
- Offline-first: Yerel depo IndexedDB olsun (localStorage'dan migration ile), bulut arka planda eşitlensin.
- `updated_at` ve soft delete (`deleted_at`) ile çakışma çözümü yap. Çevrimdışı eklenenler bağlantı gelince gönderilsin.
- Senkron durumu UI'da sade bir göstergeyle görünsün (eşitlendi, bekliyor, çevrimdışı, hata).
- JSON yedek/geri yükleme hem misafir hem hesaplı modda çalışmaya devam etsin.

### Faz 3 — Profil sistemi
Profilde en az şunlar olsun:
- Görünen ad, kullanıcı adı, avatar (yükleme + otomatik oluşturulan yıldız avatarı), arayüz dili, varsayılan anlam dili.
- **İstatistikler:** Toplam yıldız, gezegen ve galaksi sayısı, dil başına dağılım, günlük seri (streak), en uzun seri, öğrenme takvimi (GitHub tarzı ısı haritası), son eklenenler, en eski yıldız, hatırlama başarı oranı.
- **Tekrar istatistikleri:** Bugün tekrar edilecekler, zayıf kelimeler, güçlü kelimeler.
- Hedefler: Günlük ve haftalık kelime hedefi, hatırlatma tercihi.
- Ayarlar: Animasyon yoğunluğu (performans ve batarya modu), hareketi azalt, ses açık/kapalı, varsayılan galaksi.
- Veri: Tüm veriyi dışa aktarma (JSON + CSV), içe aktarma, **hesabı kalıcı silme** (onaylı, KVKK/GDPR uyumlu).
- Rozetler ve kilometre taşları (ilk yıldız, 100. yıldız, ilk süpernova vb.). Abartısız ve evren temalı olsun.
- Herkese açık profil ve paylaşım bağlantısı opsiyonel olsun, **varsayılan olarak kapalı.**

### Faz 4 — Evren motoru ve gerçek gök kataloğu
**Kavram ayrımını iyi anla:**
- **Arka plan evreni:** Gerçek galaksiler, bulutsular, takımyıldızlar, gezegenler ve olaylar. Atmosfer ve keşif katmanıdır.
- **Kullanıcı galaksisi:** Kullanıcının kelime yıldızları ve bağlaç gezegenleri. Ana etkileşim katmanıdır.
- Kullanıcı yeni bir dil koleksiyonu açarken **gerçek bir galaksi seçer** (örneğin "Andromeda (M31)", "Girdap (M51)", "Sombrero (M104)"). Sağ üstteki seçicide "İngilizce Galaksisi" yerine seçilen gerçek galaksinin adı ve küçük bir etiket olarak dili görünür (örneğin **Andromeda** · İngilizce). Kelimeler o galaksinin içinde, onun yapısına (sarmal kollar, eliptik dağılım vb.) uygun konumlarda doğar. Kullanıcı başka bir galaksiyi seçip İspanyolca, Korece veya istediği başka bir dili orada başlatabilir. Mevcut İngilizce ve İspanyolca galaksileri migration ile birer gerçek galaksiye bağlanır (kullanıcı sonra değiştirebilir).

**Minimum katalog (her biri gerçek katalog kaydına dayalı, `src/data/catalog/` altında JSON, kaynak ve lisans alanlarıyla):**
- **≥50 gerçek galaksi:** Messier ve NGC kayıtları. Tür (sarmal, çubuklu, eliptik, düzensiz, etkileşen), gerçek göreli konum ve uzaklık, gerçek görüntü dokusu (lisanslı) veya gerçek morfolojiye sadık prosedürel render.
- **≥100 gerçek bulutsu:** Emisyon, yansıma, planetar, karanlık, süpernova kalıntısı. Örnekler: Orion M42, Kartal M16, Yengeç M1, Karina, Halka M57, Helis, Atbaşı, Lagün, Trifid. Hubble ve JWST görüntüleri lisansı doğrulanarak kullanılsın.
- **≥250 farklı gezegen:** Güneş Sistemi gezegenleri, cüce gezegenler ve büyük uydular gerçek dokularla. Geri kalanı NASA Exoplanet Archive'dan gerçek ötegezegenler, **gerçek parametrelerinden** (yarıçap, kütle, denge sıcaklığı, yörünge) türetilen prosedürel görünümle ve açıkça "sanatsal yorum" etiketiyle. Bağlaç gezegenleri bu havuzdan seçilebilir ve seçim kalıcı olur.
- **≥25 takımyıldızı:** Gerçek yıldız konumları HYG veya Yale Bright Star kataloğundan. Çizgiler ve adlar üç dilde.
- **≥50 farklı gök olayı türü** (§4.3).

**Render ve kamera:**
- Gerçekçi derin uzay: Çok katmanlı parallax arka planı, yıldız alanı, toz şeritleri, ince renk gradyanları.
- **Zoom seviyelerine göre LOD:** Uzaklaştıkça daha fazla galaksi, bulutsu ve olay görünür; yaklaştıkça kullanıcı galaksisi ve yıldız detayları belirginleşir. Geçişler pürüzsüz olsun (tek sahnede sürekli zoom, sıçrama yok).
- Kamera: Atalet ve yumuşatma (damping), sınırlar, "eve dön" butonu, bir yıldıza odaklanma animasyonu, klavye kısayolları.
- Dokunmatik: Pinch-zoom, iki parmakla kaydırma, uzun basışla tutma.
- **Yıldız ve gezegen tutma:** Yakın zoom'da fareyle veya dokunarak bir yıldızı ya da gezegeni tutup sürükleyebilmeli. Bırakınca fizik tabanlı yumuşak bir yerleşme olsun. Konum kalıcı olarak kaydedilsin, "otomatik düzene dön" seçeneği de olsun.

### Faz 5 — Yıldız evrimi, görünüm ve hafıza (ÇEKİRDEK)
**Gerçekçi yıldız görünümü:**
- Çekirdek parlaklığı, korona ve glow (bloom), teleskop difraksiyon sivri uçları (JWST tarzı 6+2 ve Hubble tarzı 4 uçlu, ayarlanabilir), hafif titreşim (scintillation).
- Uzaktan nokta ışık, yakından detaylı fotosfer (granülasyon, limb darkening, yüzey aktivitesi).
- Renk, gerçek siyah cisim sıcaklığından hesaplansın (Kelvin → RGB).

**Zamanla evrim (kullanıcının istediği mantık):** Güneş gibi bir yıldız zamanla kızıl deve dönüşür. Bu mantığı profesyonelce uygula. Gerçek evre sırasını izleyen ama kullanıcı zaman ölçeğine sıkıştırılmış bir yaşam döngüsü kur:

| Kelime yaşı (örnek, ayarlanabilir) | Evre | Görünüm ve davranış |
|---|---|---|
| 0–1 gün | Ön yıldız / doğum | Gaz bulutundan yoğunlaşma animasyonu, mavimsi-beyaz parıltı |
| 1 gün – 1 ay | Ana kol (genç) | Beyaz-mavi, sabit ve parlak |
| 1–3 ay | Ana kol (olgun) | Sarı-beyaz, Güneş benzeri |
| 3–6 ay | Alt dev | Hafif şişme, turuncuya kayma |
| 6–12 ay | Kızıl dev | Büyük, turuncu-kırmızı, yavaş pulsasyon, dış katman dalgalanması |
| 12+ ay | Geç evre | Kütleye göre dallanma (bkz. aşağıda) |

- **Yıldızın "kütlesi"** kelimenin önemine veya zorluğuna göre belirlenebilir (kullanıcı işaretler ya da tekrar verisi belirler). Kütleli yıldızlar daha hızlı evrilir ve süpernova olabilir; düşük kütleli yıldızlar beyaz cüce olur ve bir **planetar bulutsu** bırakır. Böylece evrenin dramatik olayları kullanıcının kendi geçmişinden doğar.
- **Hiçbir kelime yok olmaz.** Geç evredeki yıldızlar da görünür ve tıklanabilir kalır (beyaz cüce, nötron yıldızı, kalıntı bulutsusu içindeki parlak çekirdek).
- Bağlaç gezegenleri de zamanla evrilir: Atmosfer değişimi, halka oluşumu, uydu kazanma, yüzey renginin değişmesi.
- Evreler arası geçişler animasyonlu olsun. Bir yıldız evre değiştirdiğinde kullanıcı uygulamayı açınca nazik bir bildirim çıksın ("**serendipity** kızıl deve dönüştü").
- Zaman ölçeği ayarlardan değiştirilebilsin (hızlı, normal, yavaş). Mevcut "bilimsel değildir, sıkıştırılmış görsel yaşam döngüsü" açıklaması güncellenip korunsun.

**Hafıza ve tekrar sistemi (kullanıcının asıl amacı):**
- **İki ayrı eksen kur:** **Yaş** (geri dönüşsüz evrim, yukarıdaki tablo) ve **hafıza gücü** (tekrarla değişir).
- Hafıza gücü görsel olarak parlaklık, keskinlik ve titreşimle ifade edilsin. Uzun süredir tekrar edilmeyen yıldız soluklaşır ve bulanıklaşır. Doğru hatırlanan yıldız kısa bir parlama ile güçlenir.
- Aralıklı tekrar algoritması kullan (FSRS veya SM-2; FSRS tercih edilir). Her kelimenin bir sonraki tekrar tarihini hesapla.
- **"Rastgele yıldız" modu:** Kamera rastgele (veya tekrarı yaklaşan ve zayıf kelimelere ağırlık vererek) bir yıldıza uçar. Anlam gizli olur. Kullanıcı düşünür, "göster"e basar ve kendini puanlar (Unuttum / Zor / Hatırladım / Kolay).
- **Günlük tekrar seansı:** Bugün tekrar edilecek yıldızlar takımyıldız gibi bağlanarak gösterilir.
- Ters yön testi: Türkçe anlamdan kelimeyi tahmin etme.
- İsteğe bağlı telaffuz: Web Speech API ile kelimeyi seslendirme.

### Faz 6 — Gök olayları ve kuyruklu yıldızlar
**Kuyruklu yıldız (şu anki hâli amatör, baştan yap):**
- Gerçek fizik referanslı: Çekirdek, koma, **iki ayrı kuyruk** (Güneş'ten uzağa bakan düz mavi iyon kuyruğu ve yörünge boyunca kıvrılan sarımsı toz kuyruğu). Parçacık sistemi, yörüngesel eğri hareket ve parlaklık değişimi olsun.
- Rastgele konumlarda ve rastgele zamanlarda ortaya çıksın (ayarlanabilir sıklık). Nadiren büyük ve görkemli bir kuyruklu yıldız gelsin.

**≥50 olay türü** (her biri ayrı ve gerçekçi animasyonla, araştırarak tamamla). Başlangıç listesi:
Tip Ia, Tip II ve Tip Ib/c süpernovalar, hipernova, kilonova (nötron yıldızı çarpışması), kara delik birleşmesi (kütleçekim dalgası görsel efekti), galaksi çarpışması ve birleşmesi, gelgit kuyrukları, yıldız doğumu (protostar, Herbig-Haro jetleri), novalar, cüce nova, manyetar parlaması, pulsar ışıması, gama ışını patlaması, hızlı radyo patlaması, gelgit bozulması olayı (kara deliğin yıldızı parçalaması), kuasar jeti, aktif galaksi çekirdeği parlaması, yığılma diski, Einstein halkası ve kütleçekimsel merceklenme, meteor yağmurları, bolid ve ateş topu, asteroit geçişleri, asteroit çarpışmaları, kuyruklu yıldız parçalanması, Güneş patlaması (flare), koronal kütle atımı, auroralar, değişen yıldızlar (Sefe, Mira), örten çift yıldızlar, planetar bulutsu oluşumu, beyaz cüce yığılması, kahverengi cüce, serseri gezegen geçişi, ötegezegen transiti, gezegen hizalanması, ışık yankısı, kozmik toz fırtınası, molekül bulutu çökmesi, yıldız rüzgârı kabarcığı, Wolf-Rayet yıldızı, kaçak (runaway) yıldız, küresel yıldız kümesi, açık küme dağılması vb.

- Olaylar **oransal ve sakin** olsun: Ekran sürekli patlamalarla dolmasın. Nadirlik seviyeleri (sık, ara sıra, nadir, çok nadir) ve görüş alanına göre tetikleme olsun.
- Kullanıcının kendi yıldızlarından doğan olaylar (§5'teki süpernova ve planetar bulutsu) öncelikli ve özel işaretli olsun.
- Bir olayın üzerine tıklayınca kısa ve doğru bir bilgi kartı açılsın (üç dilde, kaynaklı).
- "Gözlem günlüğü": Kullanıcının gördüğü nadir olayların listesi (ufak bir keşif oyunu).

### Faz 7 — Marka, logo ve görsel varlıklar
- Tarayıcıda ChatGPT'yi aç ve görsel üretim modelini (**image2** / mevcut en güncel model) kullanarak üret: logo (ikon ve wordmark, açık ve koyu versiyon), favicon seti, uygulama ikonları (PWA 192/512, maskable), OG ve sosyal paylaşım görselleri (üç dilde), README banner'ı, gerekirse yıldız, gezegen ve bulutsu dokuları için yardımcı görseller.
- Marka kılavuzu yaz: `docs/brand/BRAND.md` (renk paleti, tipografi, logo kullanım kuralları, ses tonu, motto). Motto için üç dilde öneriler üret ve en iyisini seç.
- Üretilen görselleri optimize et (WebP/AVIF, uygun boyutlar) ve kaynağını `ATTRIBUTIONS.md`'ye yaz.
- Ses tasarımı (opsiyonel, varsayılan kapalı): Ambient uzay sesi, yıldız doğum sesi, hatırlama parlaması. Lisanslı veya kendi üretimin olsun.

### Faz 8 — GitHub vitrini (yüksek yıldız hedefi)
- **README** (EN ana dil, ayrıca `README.tr.md` ve `README.es.md`): Hero banner, tek cümlelik değer önerisi, canlı demo linki, GIF ve kısa video demolar (zoom, yıldız doğumu, süpernova, rastgele tekrar), özellik listesi, ekran görüntüleri, teknoloji rozetleri, hızlı başlangıç, mimari diyagramı (Mermaid), yol haritası, katkı rehberi linki, atıflar, lisans.
- `LICENSE` (MIT önerilir, ADR'ye yaz), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue ve PR şablonları, `good first issue` etiketleri.
- Repo ayarları: Açıklama, topics (`language-learning`, `vocabulary`, `threejs`, `webgl`, `space`, `astronomy`, `spaced-repetition`, `supabase` vb.), sosyal önizleme görseli, website alanı.
- GitHub Pages veya docs sitesi opsiyonel.
- Tanıtım videosu: 30-60 saniyelik, ekran kaydı ve kurgu tabanlı demo. `docs/media/` altına koy, README'ye ekle.
- Lansman metin taslakları (`docs/launch/`): Show HN, Reddit (r/languagelearning, r/webdev, r/threejs, r/space, r/InternetIsBeautiful — her birinin kurallarına uygun), Product Hunt, X ve LinkedIn. **Yalnızca taslak yaz, paylaşımı kullanıcı yapacak.** Sahte yıldız, bot veya spam yöntemleri kesinlikle yasak.

### Faz 9 — Cila, performans, erişilebilirlik, PWA
- **Performans bütçesi:** Orta seviye masaüstünde 60 FPS, orta seviye mobilde ≥30 FPS. 5.000 kullanıcı yıldızıyla stres testi yap (instancing, GPU parçacıkları, texture atlas, frustum culling, LOD, görünür olmayan sekmede render'ı durdurma). İlk yükleme hızlı olsun (ağır dokular tembel yüklensin, progressive loading). Lighthouse skorlarını raporla.
- **Cihaz uyumu:** WebGL desteklemeyen veya zayıf cihazlarda düşük kalite moduna geç, uygulama çökmesin.
- **Erişilebilirlik:** Klavye ile tam kullanım, odak göstergeleri, ARIA etiketleri, ekran okuyucu için kelime listesi alternatifi, renk kontrastı, `prefers-reduced-motion` desteği (patlamalar ve titreşim azaltılsın).
- **PWA:** Kurulabilir, çevrimdışı çalışır (service worker), uygulama ikonu.
- **Gizlilik dostu analitik** (opsiyonel, örneğin Vercel Analytics) ve hata izleme.
- **Paylaşım:** "Galaksimin görüntüsünü indir" (yüksek çözünürlüklü PNG, istatistik kartıyla). Sosyal medya için çok iyi bir içerik malzemesi olur.

---

## 4. Ek ilkeler

### 4.1 Hareket ve animasyon kalitesi
- Her hareket fiziksel hissettirmeli: Easing eğrileri, atalet, yay (spring) dinamikleri, hiçbir şey ani başlayıp ani durmasın.
- Gerçekçilik önceliklidir ama okunabilirlik bozulmamalı: Kullanıcının kelime yıldızları arka plan evreninden her zaman ayırt edilebilir olmalı (hafif etiket, hover vurgusu, seçili halka).
- Sinematik anlar (yıldız doğumu, süpernova, rastgele yıldıza uçuş) kısa ve atlanabilir olsun.

### 4.2 Bilimsel doğruluk tonu
- Bilgi kartları ve about sayfası kısa, doğru ve kaynaklı olsun. Sanatsal yorumlar açıkça etiketlensin (mevcut dürüst ton korunsun).
- Referans kaynakları: NASA (Exoplanet Archive, APOD, JPL), ESA/Hubble, ESA/Webb, Messier ve NGC katalogları, HYG yıldız veritabanı, hakemli makaleler (yıldız evrimi, kuyruklu yıldız fiziği). Kullandığın kaynakları `docs/RESEARCH.md`'de listele.

### 4.3 Genişletilebilir veri modeli (geleceğe hazırlık)
Şimdiden şu soyutlamayı kur:
- `Universe` → `Collection` (bir gerçek galaksiye bağlı, bir dil çiftine veya ileride bir konuya ait) → `Entry`.
- `Entry` alanları: `id`, `type` (`word`, `conjunction`; ileride `tense`, `phrase`, `idiom`, `note`, `project`…), `content` (türe özel JSON), `created_at`, `updated_at`, `deleted_at`, `review_state` (FSRS alanları), `visual_state` (konum, sabitlenmiş mi, seçilen gezegen dokusu), `tags`.
- **Entry type registry:** Her tür kendi giriş formunu, görsel temsilini (yıldız, gezegen, ileride kuyruklu yıldız, ay, bulutsu…) ve tekrar mantığını kaydeder. Yeni bir tür eklemek tek bir modül eklemekle mümkün olsun. `docs/EXTENDING.md`'de nasıl tür ekleneceğini anlat.
- Yeni girişlerde etiket ve kategori desteği olsun. Kelime girişinde isteğe bağlı alanlar: telaffuz, kelime türü, eş anlamlılar, not.

### 4.4 Kullanıcının söylemeyi unutmuş olabileceği diğer şeyler (değerlendir, mantıklı olanları uygula)
- Arama, filtreleme ve sıralama (Kelimelerim listesinde ve evrende "yıldızı bul ve uç").
- Toplu kelime içe aktarma (CSV veya yapıştırılmış liste).
- Yinelenen kelime uyarısı.
- Geri al / yinele (silme işlemi için en azından geri al bildirimi).
- Boş durum tasarımları ve ilk kullanım turu (onboarding, 3-4 adım, atlanabilir).
- Klavye kısayolları paneli (`?` tuşu).
- Hata sınırları (error boundaries): WebGL çökerse bile kullanıcı verisi ve liste görünümü erişilebilir kalsın.
- Statik HTML'deki demo değerlerin (örneğin "06 YILDIZ", "Serendipity") gerçek veriyle yüklenmeden önce yanlış bilgi göstermemesi (iskelet veya yükleme durumu).
- Rate limit ve kötüye kullanım koruması (auth uç noktaları için Supabase ayarları).
- Veritabanı yedekleme stratejisi (`ENVIRONMENT.md`'de belgele).

---

## 5. Kabul kriterleri (proje "tamam" sayılmadan önce)
- [ ] Mevcut kullanıcı verisi kayıpsız taşındı. Eski JSON yedekleri içe aktarılabiliyor.
- [ ] Sayfa yenileme, tarayıcıyı kapatıp açma, çevrimdışı kullanım ve cihazlar arası giriş sonrasında veri kaybolmuyor.
- [ ] TR, EN ve ES'de tüm ekranlar eksiksiz. Eksik anahtar testi CI'da geçiyor.
- [ ] E-posta ve Google ile kayıt ve giriş prod'da çalışıyor. RLS testleri geçiyor.
- [ ] Profil, istatistik, hesap silme ve dışa aktarma çalışıyor.
- [ ] Katalog sayıları karşılandı: ≥50 galaksi, ≥250 gezegen, ≥100 bulutsu, ≥25 takımyıldızı, ≥50 olay türü. Hepsi kaynak ve lisans kayıtlı.
- [ ] Yıldız evrimi ve hafıza eksenleri çalışıyor. Rastgele yıldız tekrar modu ve FSRS çalışıyor.
- [ ] Zoom seviyelerine göre LOD pürüzsüz. Yıldız ve gezegen tutup sürükleme çalışıyor ve kalıcı.
- [ ] Performans bütçesi 5.000 yıldızla karşılandı.
- [ ] README, görseller, demo videosu, lisans ve topluluk dosyaları hazır.
- [ ] Handoff dosyaları güncel. Başka bir ajan sıfırdan devam edebilir durumda.
- [ ] Her şey §1.2'deki iki yoldan doğrulandı ve kanıtı `evidence/` altında.

---

## 6. Başla
1. Bu dosyayı `docs/handoff/MASTER_PROMPT.md` olarak repoya kaydet.
2. Faz 0'ı başlat: Denetim yap, handoff sistemini kur, `ROADMAP.md` ve `TASKS.md`'yi bu dokümana göre ayrıntılı oluştur.
3. Kullanıcıya yalnızca §1.1'de sayılan durumlarda soru sor. Diğer her şeyde karar ver, belgele ve ilerle.
