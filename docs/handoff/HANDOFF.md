# Devir durumu

## Son güncelleme

2026-10-03 16:39 · Codex / Windows · son doğrulanmış uzak kod `b2d67c2` (CI 37126838495 ve Vercel preview geçti). Son dokümantasyon hash'i `git log -1 --oneline`; kod kabulünü bu commit ve session kaydı gösterir.

## Şu an aktif faz ve branch

Faz 0/1 tamamlandı; Faz 2 sürüyor · `phase/2-auth-sync` · geliştirme 1.12.0 · [taslak PR #5](https://github.com/GhostFelina/wordverse-galaxy/pull/5). Production hâlâ v1.11.0. SMTP/giriş/hukuki adımlar beklerken bağımsız Faz 2 kod/kabul işlerine devam et; kullanıcı bu adımları sonraya bıraktı, tekrar aynı soruları sorma.

## Son oturumda yapılanlar

- JSON import aynı kimlikli farklı içeriği artık sessizce atlamaz. `src/record-merge.js` ilk giriş ve import için ortak kayıpsız birleşim; galaksi/kelime çatışması kopyaları, olay ve snapshot referansları remap edilir. Tekrar import aynı içeriği çoğaltmaz. Property sırası/undefined JSON alanları sahte conflict oluşturmaz; eski galaksi anlam dili varsayılan TR ile uyumludur.
- `src/universe-data.js:mergeUniverse` yeni sonucu clone üzerinde hesaplar, sonra uygular; bozuk tekrarlı kimlikli yedek kısmen uygulanmadan reddedilir. Şema v4 değişmedi; v2/v3 yedekler korunur. Aynı yedek farklı, sonradan düzenlenmiş bir kopya içerirse o yeni sürüm de korunur.
- `tests/migration-archive.test.js` üç ek veri koruma testi; `e2e/account-sync.spec.js` hesabın çakışan yedek import/sync/reload/tekrar import kabulü. Son tam kontrol **71 birim + 37 Playwright**, lint/typecheck/build/format geçti. Yeni merge ve email generator/preview dosyaları format gate'e dahil.
- Gerçek yerel hesap 5360'da **6 kayıt / 2 galaksi / Eşitlendi** kaldı. Ayrı **5371 misafir test origin**'inde `tests/fixtures/backups/current.json`, `historic.json` UI ile içe aktarıldı; iki anlam ayrı yıldızda görüldü, tekrar yükleme 2 kayıt olarak kaldı. Masaüstü kanıtları `evidence/2026-10-03-backup-conflict-{current,historic}.png`; gerçek kullanıcı verisi değiştirilmedi.
- Önceki tamamlanan işler: owner IndexedDB cache/kalıcı kuyruk, CAS/üç taraflı conflict, misafir ayrımı/ilk giriş özeti, offline reconnect, tombstone/explicit restore, foreground refresh (15 saniye burst sınırı/açık edit-rename formu korunur), gerçek Google local/preview kabulü ve hesap JSON export.
- Private avatar bucket hedefte kurulu: `wordverse-avatars`, 2 MiB, JPEG/PNG/WebP, folder+owner_id RLS ve restrictive guard. İki hesap/anon/sahip değiştirme rollback SQL kabulü geçti. Security Advisor son kontrol **0 hata / 1 Auth uyarısı**, leaked password protection Pro+ gerektiriyor; plan açılmadı.
- Üç dil confirmation/recovery Go şablonları ve altı preview hazır; build üretir. Hosted'e uygulanmadı (custom SMTP gerekiyor). ENVIRONMENT yedek/kurtarma hedefleri belgelendi; gerçek otomatik dump/restore tatbikatı yok.

## Yarım kalan iş (somut devam noktaları)

- `supabase/checks/avatar-isolation.sql` yalnız metadata/RLS kabulüdür. Gerçek Storage API upload/upsert/delete ve 2 MiB/MIME reddi henüz denenmedi. SQL DELETE'i storage.protect_delete engeller; korumayı kapatma.
- `supabase/templates/{confirmation,recovery}.html` hosted SMTP, gerçek Go render ve posta teslimatı bekliyor. `supabase/config.toml` local Docker/Auth runtime sınanmadı; hazır HTML preview teslimat sayılmaz.
- CLI/MCP başka Supabase hesabında. Hedef **yalnız mrkmtcpzyvooreeokmkp**. Dashboard'da uygulanan üç migration: `20261002181057_initial_user_data.sql`, `20261003064254_conditional_sync_writes.sql`, `20261003123923_private_avatars.sql`. Doğru hesap erişimi/history repair bekliyor; aynı SQL'i db push ile tekrar uygulama.
- Google ortak `cortexia-language` consent markası Cortexia adı/linklerini kullanıyor; Wordverse ayrı istemcisi gerçek girişte çalışıyor. Ortak markayı körlemesine değiştirme. Mustafa Kılıç / kopukfad@gmail.com hukuki taslakta; saklama/aktarım güvenceleri ve prod legal URL'leri tamamlanmadı.
- Gerçek iki fiziksel cihaz senkronu/Mac ortak kurulum ve prod Faz 2 auth kabulü bekliyor. Önce Faz 2 kabulü; sonra Faz 3 profil.

## Sıradaki ilk 3 adım

1. Başlangıç OS/git/pull/doctor/test kontrolünden sonra HANDOFF/TASKS ve en son session'ı birlikte kullan. `b2d67c2` kod CI/preview kabulü geçti; bu işi tekrar başlatma. Yerel uygulamayı **http://127.0.0.1:5360/** görünür açık tut.
2. Kullanıcı girişine bağlı olmayan Faz 2 kabul işlerini sürdür: Storage API için izole fixture kabul akışını hazırla; gerçek hesap verisini değiştirme. Kalan email/CLI/physical-device testlerini doğrulanmış diye işaretleme.
3. Kullanıcı ertelenen SMTP/giriş/hukuki adımlara döndüğünde tamamla. Tüm kabul geçince Faz 2 main merge/changelog/tag/release/prod smoke; ardından Faz 3.

## Dikkat edilmesi gerekenler

- Türkçe iletişim, otonom ilerleme, her anlamlı adımda HANDOFF/TASKS/session ve küçük commit/push. Her başlangıçta gerçek OS/kabuk, git; temizse pull --ff-only. STATE aktif dalı belirler.
- Windows proje **C:\Users\User\Desktop\Projeler\kelime-evreni**; taşıma. **Mac pause sürüyor**, aynı dalda eşzamanlı geliştirme başlatma. Mac mevcut `/Users/felina/Projects/wordverse-galaxy` klonu korunur; kullanıcı yeniden Mac'e dönerse temiz pull/npm ci/doctor/test ile devam.
- Yanlış eski-main Mac denemesi `checkpoint/mac-2026-10-03-paused` (`0f94672`) yalnız arşivdir: merge veya SQL uygulama. Mac local Supabase yedek korunarak durduruldu. [Mac pause kaydı](sessions/2026-10-03-mac-paused-codex.md), [cihaz kurulumu](CROSS_DEVICE.md), [servis erişimi](SERVICE_ACCESS.md).
- Misafir localStorage v4/v3/v2/arşivler, wordverse-offline ve yerel mirror korunur. Hesap wordverse-accounts sahibiyle ayrı. Testler gerçek 5360 origin'ini değiştirmez. Auth sırları cache/export/commit/log'a girmez.
- Secret/service_role/DB şifresi/token ve gerçek JSON yedek Git dışıdır. Git kod/devir taşır; cihaz sırlarını veya tarayıcı verisini otomatik taşımaz.
- Ayrıntılı tarihsel tekrarlar [arşivde](sessions/2026-10-03-1618-handoff-archive.md); güncel görev kaynağı bu dosyadır. Önceki oturum [1600 kaydı](sessions/2026-10-03-1600-codex.md).

## Doğrulanmamış iddialar

Mac runtime, fiziksel iki cihaz, email teslimat/Go render, Storage API dosya kabulü, otomatik yedek/restore, prod Faz 2 auth, gerçek IDB engelli tarayıcı kabulü, KVKK/GDPR uyumu ve 5.000 yıldız FPS hedefi tamamlandı sayılmaz. Mevcut tasarım koyu palet kullanır; açık sistem tema testi açık palet tasarımı anlamına gelmez.
