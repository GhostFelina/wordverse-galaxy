# Devir durumu

## Son güncelleme

2026-10-03 17:58 · Codex / Windows. Faz 2 son kod `5740cd1` CI/preview başarılı. Faz 3 ilk profil kodu `ece9b2d`: CI 37131669514 / preview CvFFycrJm7pzdXJdgVCM5cyxhZ12 geçti. Dil-label koruması 707b929 CI37131921502 misafir initial-session yarışıyla başarısız oldu; son identity-only close fix commit'i `git log -1`, uzak kontrol push sonrası. [Draft PR #6](https://github.com/GhostFelina/wordverse-galaxy/pull/6).

## Şu an aktif faz ve branch

**Faz 3 · phase/3-profile · geliştirme 1.13.0.** Production v1.11.0. Faz 0/1 tamamlandı, Faz 2 kabulü **ertelendi, tamamlanmadı**. Kullanıcı son yazma hatası işi bitince Faz 3–9'a geçilmesini ve Faz 2'ye sonra dönülmesini açıkça istedi (ADR012). Yeni dal phase/2-auth-sync temellidir; draft PR base phase/2-auth-sync, main'e erken merge/tag/prod deploy yok.

## Son oturumda yapılanlar

- Profile session close yarış düzeltmesi: INITIAL_SESSION null ve same-owner token refresh profili kapatmaz; owner transition close önce, session forwarding sonra. 2 ek unit, full **86 unit / 45 e2e**, format/lint/typecheck/build geçti; simulated late initial notification manual fixture açık kaldı, evidence/2026-10-03-profile-session.png.
- Kullanıcı yeni öncelik verdi: evren/katalog ve gök olaylarının görsel işlerini önce yap; bunlar bitince diğerlerine dön. Mevcut profil race fix commit/push sonrası Faz 4 görsel/katalog dalına geç. Faz 3 alanlar/tercihler henüz tamamlanmadı; pause/deferred görev listesinde kalır.

- Son Faz 2 yazma hatası işi: engine localSaved flag, TR/EN/ES kalıcı alert açık tut/retry/JSON yedek yönlendirmesi. Başarılı persist/hesap değişimi kapatır, network error tek başına göstermez. Mobilde buton engeli pointer-events:none ile düzeldi; 82 unit/42 e2e + responsive ek kontrol/manual. `5740cd1` CI ve preview 6ybzwxP8ByM6WzenHG2SnkB4vmqq geçti.
- Faz 3 başladı: src/profile-statistics.js salt okunur açık evren toplamları, dil dağılımı, en eski tarihli kayıt ve son 5 kayıt. Deleted kayıtlar sayılmaz; invalid/future dates eski/son listesine girmez. Girdiler ve dönen kayıtlar ayrı; kullanıcı verisi değiştirilmez.
- Son guard: dil alias Map ile lookup (constructor/prototype metinleri çökme üretmez), string olmayan dil unknown sayılır. EN responsive e2e constructor alanıyla geçti; son tam gate 84 unit/45 e2e + Go24/format başarılı.
- src/profile-ui.js/profile.css: Hesap menüsü > Profil ve istatistikler. TR/EN/ES, dialog aç/kapat, mevcut açık misafir/hesap evreni. FSRS olmadığı için tekrar başarısı uydurulmaz. Profil kimliği/tercih formu henüz yok.
- 2 yeni unit + 3 localized Playwright: toplam **84 unit / 45 e2e**, lint/typecheck/build/format geçti. 1440/768/390 tema/hareket/taşma, literal HTML text/XSS ve guest bytes koruması geçti. İlk auth testi profile button auth-link seçti; ayrı submit stiline alındı ve temiz full gate tekrar geçti.
- Gerçek 5360 hesapta profil 3 yıldız/3 gezegen/2 galaksi manual görüldü; veriler değişmedi. Paylaşılan screenshot yalnız yapay fixture: evidence/2026-10-03-profile-statistics.png. Yerel uygulama görünür açık.
- STATE/CROSS_DEVICE/ROADMAP/TASKS aktif Faz 3'e güncellendi; doctor iki CLI/GitHub/public env/aktif dal kontrollerini geçti. Mac pause sürüyor.

## Yarım kalan iş

- Faz 3: owner'a bağlı görünen ad/kullanıcı adı/tercihler modeli ve kalıcı form. Kullanıcı adı henüz herkese açık/unique diye sunulmaz. Profil, istatistik/heatmap, seri/hedef/ayar/rozet, JSON+CSV ve onaylı hesap silme/parçalı public sharing işleri TASKS'ta.
- Faz 2 ertelenen kabul: SMTP/mail/hosted Go render, gerçek Storage API dosya limit/RLS, doğru CLI hesabı/migration history, fiziksel iki cihaz/Mac runtime, hukuki saklama/transfer/consent marka ve prod auth. Kullanıcı erteledi; tekrar soru sorma.
- Yalnız Supabase mrkmtcpzyvooreeokmkp. Dashboard'da uygulanan migrations 20261002181057_initial_user_data, 20261003064254_conditional_sync_writes, 20261003123923_private_avatars. MCP/CLI başka hesap; kör db push/history repair yok. Avatar SQL metadata/RLS kabulü Storage API kabulü değildir; storage.protect_delete kapatma.

## Sıradaki ilk 3 adım

1. Gerçek OS/shell/git; temiz pull, STATE aktif dalı phase/3-profile; doctor. Son profil/statistics kodunu tekrar başlatma. 5360'ı görünür açık tut.
2. Faz 3 profil alanları/tercihleri: mevcut settings JSON/CAS altyapısını ve unknown fields korunmasını incele; owner/guest izolasyonu ve conflict testleriyle ilerle. Auth user_metadata izin yetkisi için kullanılmaz. Public sharing varsayılan kapalı kalır.
3. Faz 3'ü bağımsız bölümlerle tamamla, ardından Faz 4–9 sırasıyla. Faz 2 kalan kabulüne sonra dön; erteleme prod kabulü değildir. Commit/push/PR/CI ve devir belgelerini her anlamlı adımda güncelle.

## Dikkat edilmesi gerekenler

- Türkçe, otonom geliştirme, Durum Analiz = güncel Durum/İş/Sonuç-kalan-adım tablosu. Faz 0/1'i yeniden yapma; fazların tamamlanmasını uydurma.
- Windows C:\Users\User\Desktop\Projeler\kelime-evreni; taşıma. Mac /Users/felina/Projects/wordverse-galaxy mevcut klon korunur. Mac pause sürer. Eski yanlış-main checkpoint/mac-2026-10-03-paused 0f94672 merge/SQL uygulanmaz.
- Gerçek hesap 6 kayıt/2 galaksi, misafir 13 kayıt ve v4/v3/v2 arşivler korunur. Testler yapay kayıt/ayrı namespace/origin kullanır. Sır, token, gerçek JSON yedek Git/log'a girmez.
- Yerel yazma hatasında retry öncesi memory değişikliği reload korunmaz; persistent warning ve JSON yedek yönlendirmesi vardır. Tarayıcı verisi/sırlar cihazlar arasında otomatik eşitlenmez.
- Geçmiş Faz 2 ayrıntıları sessions/2026-10-03-pre-profile-handoff.md, 1742/1749 session'lar ve TASKS'ta. Güncel görev kaynağı bu dosyadır.

## Doğrulanmamış iddialar

Profil alanları/avatar entegrasyonu/seri/heatmap/hedef/CSV/hesap silme/paylaşım; FSRS/recall oranı; gerçek Mac/fiziksel cihazlar; hosted mail/Storage API; otomatik backup/restore; prod Faz 2; gerçek privacy-policy IDB engeli veya fiziksel disk kotası; KVKK/GDPR; 5.000 yıldız FPS tamamlandı sayılmaz.
