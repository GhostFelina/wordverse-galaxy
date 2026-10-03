# Devir durumu

## Güncel devam noktası · 2026-10-03 15:54 · Codex / Windows

- Aktif dal `phase/2-auth-sync`; Faz 0/1 bitti, Faz 2 sürüyor. Önceki devir `d057d6f` CI geçti. Güncel hash `git log -1 --oneline`; production hâlâ v1.11.0.
- Avatar bucket artık **hedef Wordverse projesinde kurulu**: private, 2 MiB, JPEG/PNG/WebP; `20261003123923_private_avatars.sql`. Folder+owner_id politikası ve restrictive guard; `supabase/checks/avatar-isolation.sql` iki kullanıcı/anon/sahip değiştirme rollback testi geçti. Dashboard kanıtı evidence'da. API upload/upsert/delete ve MIME/boyut reddi henüz kabul edilmedi.
- Hesap JSON export + legacy v3 import + reload + misafir ayrımı yeni e2e geçti. Kısa ekranda yedek düğmesi erişimi galaxy-panel kaydırması ile düzeltildi. Yerelde gerçek Google hesabı JSON indirildi; gerçek veri değiştirilmedi. Local `http://127.0.0.1:5360/` sekmesi açık; tarayıcı bağlantısı çalışıyor ve viewport override reset edildi.
- `ENVIRONMENT.md` yedek stratejisini içerir. Otomatik dump/özel kopya ve restore tatbikatı henüz uygulanmadı. Güncel Security Advisor **0 hata / 1 uyarı: leaked-password protection kapalı** (Pro+ gerekiyor, ücretli plan açılmadı); aşağıdaki eski 0 uyarı kaydı tarihseldir.
- Son tam kontrol **67 birim + 30 Playwright**, lint/typecheck/build/format ve Windows doctor iki CLI/GitHub push-check geçti. Oturum: `sessions/2026-10-03-1540-codex.md`.
- **Sıradaki ilk 3 adım:** (1) Son push CI/preview doğrula. (2) TR/EN/ES e-posta şablonlarını hazırla, hedef Dashboard'a uygula ve gerçek doğrulama/sıfırlama için kullanıcı parola adımını devret; JSON tombstone restore kabulünü ekle. (3) Doğru CLI hesap erişimi/history repair, Storage API kabulü ve Google ortak Cortexia consent etkisini çöz; Faz 2 tüm kabulden sonra release.
- **Mac pause sürüyor.** `/Users/felina/Projects/wordverse-galaxy` korunur; `checkpoint/mac-2026-10-03-paused` SQL'i kullanılmaz. Gerçek Mac ortak kurulum ve iki fiziksel cihaz senkron kabulü bekliyor. Son push sonrası clean pull ile aynı noktadan Codex/Claude devam eder.

## ▶ Windows'a devir — MacBook durduruldu (2026-10-03)

- Kullanıcının son talimatı: **MacBook'ta dur; bundan sonra Windows'ta devam edilecek.** Mac ajanı işi bıraktı; aynı dalda eşzamanlı Mac geliştirmesi yapılmamalı.
- Windows'ta mevcut klasörü koru: `C:\Users\User\Desktop\Projeler\kelime-evreni`. Önce `git status`; temiz ağaçta `git fetch origin`, `git switch phase/2-auth-sync`, `git pull --ff-only`. Ardından bu dosyanın kalanını ve `CROSS_DEVICE.md`'yi oku. Kirli ağaçta reset/force yapma.
- Güncel uygulama tabanı **`76b039f`**: Faz 2 yaklaşık %60, PR #5. Aşağıdaki önceki Windows oturumunun uygulama, test ve canlı Google giriş bilgileri geçerlidir; Mac'te bunlar tekrar doğrulanmadı.
- Mac oturumu yanlışlıkla eski `main` (`3752ff1`) üzerinden başladı. Alternatif şema/test denemesi kayıp olmaması için **`checkpoint/mac-2026-10-03-paused`**, commit **`0f94672`** altında arşivlendi. **Bu dalı birleştirme, içindeki SQL'i buluta uygulama.** Mevcut Faz 2 istemcisi farklı şema kullanıyor; doğru migration'lar aşağıda listeleniyor.
- Mac yerel test Supabase'i `wordverse-galaxy` proje kimliğiyle, veriler/yedek korunarak durduruldu. Bulut kayıtlarına ve production'a bu oturumda dokunulmadı. Mac klonu `/Users/felina/Projects/wordverse-galaxy`; node_modules eski main bağımlılıklarıdır, ileride Mac'e dönüşte `npm ci` gereklidir.
- Windows'un sıradaki işi: aşağıdaki **Yarım kalan iş / Sıradaki ilk 3 adım** listesinden Faz 2 kabulüne devam et. Mac kurulumunu tekrar başlatma. Ayrıntılı Mac kaydı: `sessions/2026-10-03-mac-paused-codex.md`.

## Son güncelleme

2026-10-03 15:37 · codex · uzak Mac devir commit'i `1ebbd1b`, yerel devir/CI düzeltme commit'i `284a6dc` birleştiriliyor; iki tarafın notları korunuyor. Güncel hash: `git log -1 --oneline`. Prod `v1.11.0`.

## Şu an aktif faz ve branch

Faz 0/1 tamamlandı. Faz 2 yaklaşık %60 · `phase/2-auth-sync` · taslak PR #5: https://github.com/GhostFelina/wordverse-galaxy/pull/5. Geliştirme sürümü 1.12.0; Faz 2 kabulü ve prod release henüz tamamlanmadı.

## Son oturumda yapılanlar

- Seri senkron motoru/üç taraflı conflict birleşimi `746958f` ile push edildi; CI ve Vercel preview geçti. Migration ve RLS gerçek Dashboard rollback testleri geçti; Security Advisor 0 hata/uyarı.
- `src/account-sync-ui.js` ana uygulamaya bağlandı. Misafir ve hesap depoları ayrı; ilk girişte iki tarafı koruyan merge özeti, bulut-only/misafir seçimleri, sync/offline/pending/error ve retry var. IDB ilk kayıt upload'dan önce kalıcıdır. Refresh görünür modeli IDB await öncesi uygular; sonraki düzenleme conflict kopyalarını içerir.
- `src/main.js` hesap evrenine geçiş/çıkış ve boş hesapta sentetik galaksi oluşturmama; `src/auth-ui.js` merge/sync açma ve evrene dönüş; `src/auth.css` masaüstü menü çakışması ve mobil sync yerleşimi düzenlendi.
- `e2e/account-sync.spec.js`: ID çakışmasında iki tarafı koruma/upload, reload, çıkışta aynı misafiri geri getirme, boş bulut hesabı, offline ekleme/reconnect/reload. Son tam kontrol 63 birim + 28 Playwright, lint/typecheck/build geçti; format geçti. Cihaz kurulum testleri eklendikten sonraki sonucu aşağıdaki oturum dosyasında kontrol et.
- Kullanıcı Google Secret aktarımını tamamladı. Public auth ayarı Google=true; gerçek kopukfad@gmail.com hesabıyla giriş, 5 kayıt (2 yıldız/3 gezegen)/2 galaksi upload, “Eşitlendi”, reload, çıkış/misafir dönüşü ve yeniden giriş manuel denendi. Secret okunmadı/kaydedilmedi.
- Vercel Production/Preview/Development ortamlarına VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY ve VITE_GOOGLE_AUTH_ENABLED eklendi. `.env.local` mevcut token'ları korunarak Google etkinleştirildi. Yeni push preview bu env'i kullanacak; eski prod kodu hâlâ Faz 1.
- Kullanıcının verdiği veri sorumlusu adı Mustafa Kılıç ve iletişim kopukfad@gmail.com üç dil hukuki taslağa işlendi. FAQ hesap/çevrimdışı senkron davranışıyla güncellendi. Saklama/aktarım bölümleri hâlâ taslak.
- 36 auth görseli (3 dil × 1440/768/390 × tema × reduced-motion) yenilendi. Gerçek Google kanıtı: `evidence/2026-10-03-google-account-synced.png` ve `2026-10-03-google-signout-guest.png`. Yerel kullanıcı sekmesi `http://127.0.0.1:5360/` açık.
- Kullanıcı MacBook'ta “wordverse kaldığın yerden devam et” ile sürdürmek istedi. `CROSS_DEVICE.md`, `scripts/setup-device.mjs`, global Codex yönlendirmesi ve Node sürüm dosyaları eklendi. Windows'taki yol taşınmadı. MacBook'a uzaktan erişim yok; ilk Mac kurulumu ve gerçek macOS doğrulaması bekliyor.

## Yarım kalan iş

- Auth e-posta doğrulama/sıfırlama gerçek mail ile kabul edilmedi; üç dil e-posta şablonları hazırlanacak. Şifre/2FA gereken adımı kullanıcı yapar.
- Avatar private bucket/boyut ve MIME limitleri/sahiplik RLS henüz kurulmadı.
- JSON import/export mevcut ana uygulama işlevlerini kullanır; hesap modundaki merge/restore ve tombstone kabulü ayrıca sınanacak. Veritabanı yedek stratejisi ENVIRONMENT'e yazılacak.
- Google consent `cortexia-language` ortak markasında Cortexia adı/linkleri kalmış; Wordverse ayrı istemcisi çalışıyor. Ortak markayı körlemesine değiştirme, mevcut Cortexia'yı etkileme konusu çözülmeli. Wordverse legal sayfalar prod'da henüz yok.
- Dashboard'da iki migration uygulanmış durumda: `20261002181057_initial_user_data.sql`, `20261003064254_conditional_sync_writes.sql`. CLI/MCP başka hesapta; doğru proje link ve migration repair henüz yapılmadı. Aynı SQL'i db push ile tekrar uygulama.
- Başka cihazdaki yeni bulut değişiklikleri başlangıç/reconnect/manuel retry ile alınır; periyodik/focus yenileme henüz yok.
- Faz 3 gerçek profil/dil tercihi modeli, Faz 4+ katalog/render ve Faz 5 tekrar/FSRS sırada. Önce Faz 2 kabulünü bitir.

## Sıradaki ilk 3 adım

1. Bu commit'i push et; PR #5 CI/Vercel preview kontrolü ve env'li preview auth/merge akışını doğrula. İlk Mac oturumunda CROSS_DEVICE'e göre kur, kontrolleri çalıştır, macOS kanıtını ekle. Windows'ta yerel 5360 sekmesini koru.
2. Üç dil Supabase e-posta şablonları, private avatar bucket + owner RLS + rollback testleri ve yedek stratejisini tamamla; hesap modunda JSON import/export'u otomatik/manuel kabul et.
3. Gerçek mail/preview/prod auth ve Google Wordverse consent/hukuki gereksinimlerini tamamla. Faz 2 tüm kabul kanıtları geçince main merge, changelog/tag/release/prod smoke; sonra Faz 3.

## Dikkat edilmesi gerekenler

- Kullanıcı Türkçe iletişim, otonom ilerleme ve yerelde görünür proje istiyor. Her cihazda gerçek OS/kabuk kontrol edilir. Cihazlar arası Git/handoff aktarımı; konuşma veya `.env.local` otomatik eşitlenmez.
- Misafir `wordverse.universe.v4`, eski v3/v2/arşivler, IDB `wordverse-offline` ve `wordverse-local-backup` korunur. Hesap `wordverse-accounts` sahibiyle ayrı. Tarayıcı testleri gerçek kullanıcı origin'ine/verisine dokunmaz.
- Supabase hedef yalnız `mrkmtcpzyvooreeokmkp`. Gerçek Google hesabı artık bulutta kullanıcı verisine sahip; bunu silme. SQL kabul testleri izole fixture + ROLLBACK olmalı.
- `.env.local`, Google Secret, service_role, DB şifresi ve auth token'ları commit/log/handoff'a girmez. setup:device yalnız MASTER'de verilen public client yapılandırmasını kullanır.
- Preview SSO korumalı. Production env eklenmiş olması yeni kodun prod'da olduğu anlamına gelmez.
- Bitmiş fazları tekrar başlatma. Her anlamlı adımda HANDOFF/TASKS/session güncelle ve commit/push yap; diğer cihazda başlamadan önce temiz ağaçta pull --ff-only.

## Doğrulanmamış iddialar

- Gerçek MacBook kurulumu, iki fiziksel cihaz senkron kabulü ve prod Faz 2 auth henüz doğrulanmadı.
- 5.000 kayıt / 60 FPS hedefi ölçülmedi. IndexedDB engelli gerçek tarayıcı senaryosu manuel sınanmadı. KVKK/GDPR uyumu tamamlandı denmez.

## 11:08 cihaz/ajan devri ek durumu

- Son uzak commit 76b039f. Codex/Claude global yönlendirmeleri Windows'ta kaydedildi; doctor push-check tüm kontrolleri geçti. GitHub GhostFelina hesabında pull/push/admin izinleri mevcut. STATE.json aktif dal; SERVICE_ACCESS somut kurulum/giriş rehberidir.
- setup-mac.sh ilk Mac kurulumu için hazır; gerçek Mac runtime henüz denenmedi. resume:codex / resume:claude aynı güncel HANDOFF ile ajanı proje kökünde açar. İlk cihaz girişlerini kullanıcı tamamlar.
- 76b039f preview geçti. Gerçek Google, yalnız bulut seçimi, 6 kayıt (3 yıldız/3 gezegen)/2 galaksi ve reload ayrı preview origin'inde doğrulandı; preview-google-synced.png.
- 76b039f CI TR/ES odak kaybını yakaladı: pageshow gecikmeli scroll reset blur kaldırıldı ve pageshow regression e2e eklendi. 390/768/958 sync/evren düğmesi çakışması giderildi. Yerel 67 unit, tam 28 e2e ve ayrıca dört hesap e2e (yeni toplam 29) geçti. Son push CI sonucu doğrulanmalı.
11:14 son kabul: 67 birim + 29 tam Playwright, lint/typecheck/build/format geçti. Mac betiği Git Bash bash -n sözdizimi kontrolünü geçti. Chrome ChatGPT eklentisi güncelleme istiyor; son viewport reset çağrısı bu engelden dolayı çalışmadı. Bir sonraki tarayıcı oturumunda geçici viewport override reset edilmeli. Önceki gerçek Google/local/preview kanıtları mevcut; macOS gerçek cihaz testi hâlâ bekliyor.

## 15:37 Windows devam / uzak Mac devrini birleştirme

- Kullanıcının devam talimatı bu Windows oturumunda sürdürülüyor. Uzak 1ebbd1b yalnız Mac pause/devir belgelerini getirdi; mevcut uygulama ve ortak CLI kurulum çalışması 284a6dc korunarak merge edildi. checkpoint/mac-2026-10-03-paused dalı birleştirilmedi, SQL'i uygulanmadı.
- Mac mevcut /Users/felina/Projects/wordverse-galaxy klonu korunur; kurulum betiği bu konumu da bulur. Mac yeni ortak kurulumu ve Claude yönlendirmesi henüz doğrulanmadı; yalnız eski main denemesi olmuş. Mac'e dönme kullanıcı talimatına bağlıdır.
- Yerel tam kabul 67 birim + 29 e2e, lint/typecheck/build/format. Windows doctor iki CLI/giriş/yönlendirme ve GitHub push dry-run geçti. Son merge push CI/preview sonucu bekleniyor.
