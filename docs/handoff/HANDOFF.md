# Devir durumu

## ▶ Windows'a devir — MacBook durduruldu (2026-10-03)

- Kullanıcının son talimatı: **MacBook'ta dur; bundan sonra Windows'ta devam edilecek.** Mac ajanı işi bıraktı; aynı dalda eşzamanlı Mac geliştirmesi yapılmamalı.
- Windows'ta mevcut klasörü koru: `C:\Users\User\Desktop\Projeler\kelime-evreni`. Önce `git status`; temiz ağaçta `git fetch origin`, `git switch phase/2-auth-sync`, `git pull --ff-only`. Ardından bu dosyanın kalanını ve `CROSS_DEVICE.md`'yi oku. Kirli ağaçta reset/force yapma.
- Güncel uygulama tabanı **`76b039f`**: Faz 2 yaklaşık %60, PR #5. Aşağıdaki önceki Windows oturumunun uygulama, test ve canlı Google giriş bilgileri geçerlidir; Mac'te bunlar tekrar doğrulanmadı.
- Mac oturumu yanlışlıkla eski `main` (`3752ff1`) üzerinden başladı. Alternatif şema/test denemesi kayıp olmaması için **`checkpoint/mac-2026-10-03-paused`**, commit **`0f94672`** altında arşivlendi. **Bu dalı birleştirme, içindeki SQL'i buluta uygulama.** Mevcut Faz 2 istemcisi farklı şema kullanıyor; doğru migration'lar aşağıda listeleniyor.
- Mac yerel test Supabase'i `wordverse-galaxy` proje kimliğiyle, veriler/yedek korunarak durduruldu. Bulut kayıtlarına ve production'a bu oturumda dokunulmadı. Mac klonu `/Users/felina/Projects/wordverse-galaxy`; node_modules eski main bağımlılıklarıdır, ileride Mac'e dönüşte `npm ci` gereklidir.
- Windows'un sıradaki işi: aşağıdaki **Yarım kalan iş / Sıradaki ilk 3 adım** listesinden Faz 2 kabulüne devam et. Mac kurulumunu tekrar başlatma. Ayrıntılı Mac kaydı: `sessions/2026-10-03-mac-paused-codex.md`.

## Son güncelleme

2026-10-03 10:47 · codex · son uzak commit `746958f`; bu güncelleme hesap UI entegrasyonu ve cihazlar arası kurulum commit'ine dahildir. Güncel hash: `git log -1 --oneline`. Prod `v1.11.0`.

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
