# Devir durumu

## Son güncelleme

2026-10-03 10:14 · codex · son uzak Faz 2 commit'i `f438d02`; ana dal `v1.11.0`. Sonraki commit seri senkron motoru ve üç taraflı conflict birleşimini içerir.

## Şu an aktif faz ve branch

Faz 0 ve Faz 1 tamamlandı. Aktif Faz 2 · `phase/2-auth-sync` · taslak PR #5; ana dal sürümü `v1.11.0`.

## Son oturumda yapılanlar

- Galaksi başına öğrenilen dil ve anlam dili ayrıldı; v4 şeması v3/v2 yerel veri ve yedekleri koruyor.
- Ana uygulama, Hakkında sayfası, hata/boş durumlar, erişilebilirlik etiketleri, SEO ve FAQ JSON-LD TR/EN/ES sözlüklerine bağlandı. İki sayfada mobil dil seçici var.
- Açık dil URL'leri `/`, `/en/`, `/es/` ile Hakkında eşleri olarak düzenlendi. Eski `?lang=` bağlantıları da çalışıyor. Build altı statik, JavaScript olmadan okunabilen dil sayfası üretiyor; canonical ve `hreflang` bunları gösteriyor (`981ed0f`).
- Yerelde lint, typecheck, build, format, 20 birim ve 15 Playwright testi geçti. Altı prod preview sayfası JavaScript açık/kapalı tarayıcıda doğrulandı; tarihli görseller `docs/handoff/evidence/` altında. 3 dil × 1440/768/390 × iki sistem teması × iki hareket ayarı kontrol edildi.
- PR #4 `94bb7d2` ile birleşti. Main CI ve Vercel prod geçti. Canlı sitede altı dil sayfası JavaScript açık/kapalı, site haritası ve izole misafir oturumunda kelime ekleme/yenileme geçti. Yerel uygulama kullanıcı için görünür Chrome sekmesinde `http://127.0.0.1:5360/?lang=tr` adresinde açık.
- `v1.11.0` tag ve GitHub Release oluşturuldu. Faz 2 dalında Supabase CLI yerel yapılandırması başlatıldı ve ADR-007 senkron/RLS tasarımı kaydedildi.
- `src/sync-merge.js` yerel ve bulut kayıtlarının kimlik çakışmasında iki kopyayı koruyan ilk giriş çekirdeğini içeriyor; üç birim testi geçti. Uygulamaya bağlanmadı. Faz 2 geliştirme sürümü `1.12.0`. Yerel lint/typecheck/build, toplam 23 birim ve 15 Playwright testi geçti. Taslak PR #5 uzak CI ve Vercel preview geçti.

## Yarım kalan iş

- `supabase/migrations/20261002181057_initial_user_data.sql` hedef Wordverse projesinde Dashboard SQL Editor üzerinden uygulandı. Dört tabloda RLS, üç sahiplik politikası, anonim erişim yasağı ve authenticated doğrudan silme yasağı doğrulandı. `supabase/checks/rls-isolation.sql` iki hesapla okuma/ekleme/güncelleme/sahiplik değiştirme testlerini geçti; bütün test kayıtları ROLLBACK ile geri alındı. Security Advisor: 0 hata/uyarı. Performance Advisor: 0 hata/uyarı, yeni entries/events tablolarında henüz kullanılmamış iki indeks önerisi; FK ve gelecek senkron için korundu. CLI/MCP başka hesaplarda; migration geçmişi CLI ile henüz eşleştirilmedi.
- `src/local-primary.js` IndexedDB'yi birincil yerel depo yapıyor; localStorage eşzamanlı kurtarma kopyası, eski `src/storage-mirror.js` arşiv/ayna olarak kalıyor. Toplam 26 birim ve 16 Playwright testi geçti; yerel kullanıcı sekmesinde sayılar yenileme sonrası korundu. Bulut senkron ve offline kuyruk henüz yok.
- `src/auth-ui.js`, `src/supabase-client.js` üç dilde native dialog giriş/kayıt/sıfırlama/yeni şifre/yerel çıkış akışını içeriyor. İstemci 2.117.2 tam sürümle kuruldu, public ayarlar endpoint'i 200/email açık/Google kapalı. `.env.local` gerekli public yapılandırmayı içeriyor; sır değerleri belgelerde yok. Misafir evreni giriş/çıkışta değiştirilmez. Mock API tarayıcı kontrolleri gerçek e-posta göndermez. Gerçek doğrulama maili ve prod giriş henüz sınanmadı.
- `/privacy`, `/terms` ve EN/ES eşleri dev ve statik build'de mevcut; auth penceresinden erişilir. Hukuki kimlik, saklama süreleri ve yurt dışı aktarım güvenceleri tamamlanmamış taslaktır; KVKK/GDPR uyumu tamamlandı denmez.
- `src/cloud-universe.ts` sahiplik/şema/kimlik kontrolü, tombstone görünürlüğü, kayıpsız payload ve 500 satırlı sayfalı bulut okuma içerir. `src/account-cache.ts` hesap başına görünür evren ve bekleyen işlem listesini tek IndexedDB transaction'ında korur; misafir deposuna veya auth sırlarına dokunmaz. Bu iki modül henüz UI/senkron yazma motoruna bağlı değil. Son kontrol: 35 birim + 24 e2e, lint/typecheck/build/format geçti.
- Supabase Site URL prod adresine ayarlandı; prod, yalnız Wordverse Vercel preview kapsamı ve localhost/127.0.0.1 5350/5360 için altı dönüş kalıbı kaydedildi. Google Console doğru hesap/projede açıldı. Aynı projede Cortexia Language Web istemcisi ve Cortexia marka bilgisi var; mevcut istemci değiştirilmedi. Wordverse Web oluşturma formu 5 origin + hedef Supabase callback ile hazır, henüz Create basılmadı. Kullanıcıdan Client Secret'ı yalnız Supabase Google formuna aktarması istendi (tarayıcı kimlik doğrulama sırrı kuralı); sır alınmadı/kaydedilmedi. Google provider henüz kapalı.
- `src/sync-queue.ts` çevrimdışı değişiklikleri ve soft delete işaretlerini son onaylı bulut sürümüne göre üretir. Ağ isteği sürerken yapılan yeni düzenleme onay geldiğinde kuyrukta kalır; yerel geri alma da kaybolmuş yanıt olasılığına karşı yeniden yazılır. `src/cloud-write.ts` sahiplik ve kimliği doğrulayarak RPC kullanır. UI bağlantısı henüz yok.
- `20261003064254_conditional_sync_writes.sql` hedef Dashboard'da uygulandı. SECURITY INVOKER RPC JWT sahibi ile gönderilen ownerId eşleşmesini zorunlu tutar, satırı kilitler, beklenen server revision farklıysa conflict döndürür; server zamanı üretir. Eksik JSON kimliğinin SQL CHECK NULL nedeniyle kabul edilmesi de kapatıldı. `supabase/checks/conditional-writes.sql` gerçek Dashboard'da insert/update/stale conflict/tekrar insert/yanlış sahip/tablo whitelist/iki hesap/settings/tombstone/anon execute testlerini geçti; tüm test verisi ROLLBACK ile geri alındı. Son yerel kontrol: 44 birim + 24 e2e, lint/typecheck/build/format geçti.
- `src/sync-engine.ts` tek hesap için seri drain/refresh, ağ sırasında yerel kalıcı düzenleme, depolama hatasında upload engeli, lost-ack eş içerik onayı ve stop sonrası geç yanıt koruması içerir. Bulut okuyucu pagination öncesi/sonrası oturum sahibini doğrular. `src/sync-reconcile.ts` değişmeyen kayıtları buluttan alır, pending local niyeti korur; canlı farklı uzak kayıtları yeni kimliklerle, galaksi çocukları ve olay snapshot referanslarıyla kopyalar. Uzak silme işaretleri korunur; değişen settings karşı sürümü payload arşivinde kalır. Silinmiş parent nedeniyle görünmeyen child artık gereksiz tombstone üretmez.
- Son çekirdek kontrolü 63 birim + 25 Playwright, lint/typecheck/build/format. Ayrı `wordverse-sync-verification` IDB kullanan `tests/fixtures/sync-lab.html` gerçek Chrome'da elle çalıştırıldı: offline iki değişiklik kalıcı, conflict iki sürüm + offline yeni yıldız = üç kayıt, seri drain sonrası sıfır pending, başka hesap cache'i boş. Kanıt `2026-10-03-sync-lab-desktop.png`. Bu bir test ekranıdır; ana uygulama hâlâ misafir deposunu kullanır ve hesap senkron UI bağlantısı yapılmadı.
- `b8bb875`, `d78733f`, `88bfcf4` ve `f438d02` için GitHub CI ve Vercel preview geçti. Yeni migration sonrası Security Advisor yeniden çalıştırıldı: 0 hata/uyarı. Prod hâlâ v1.11.0; Faz 2 kabulü tamamlanmadı.
- `src/i18n.js` profil dilini öncelik sırasına alabiliyor, fakat gerçek profil veri modeli Faz 3'te kurulacak. Şimdilik URL→localStorage→tarayıcı→TR çalışıyor.
- E-posta şablonları Faz 2 auth ile oluşturulacak; şu an üründe e-posta gönderme yok.

## Sıradaki ilk 3 adım

1. Seri motor/birleşim değişikliklerini commit/push edip PR #5 kontrollerini doğrula; CLI migration geçmişini yanlış projede değiştirme.
2. Hesap oturum controller'ını main/auth UI'a bağla: ayrı misafir/hesap depo, ilk giriş birleşim özeti, pending/offline/error gösterge ve retry. Refresh sonucunu UI'a **persist beklemeden aynı senkron adımda** uygula; bu sayede ağ/IDB sırasında sonraki kullanıcı düzenlemesi yeni conflict kopyalarını içerir. Eski cache onState bildirimleriyle daha yeni UI düzenlemesinin üzerine yazma. Hesap değişiminde engine.stop + generation guard kullan, misafir evrenini geri getir. İlk kez oluşturulan cache upload'dan önce IDB'ye kaydedilmeli.
3. Kullanıcının Google Client Secret adımı tamamlanırsa public provider ayarını kontrol et; Google flag, e-posta şablonları, gerçek mail/prod kabul ve hukuki kimlik/aktarım bilgilerini tamamla. CLI erişilebilir olduğunda migration geçmişini eşleştir.

## Dikkat edilmesi gerekenler

- `main` artık v4 anahtarına yazar. Eski v3/v2 anahtarlarını ve arşivlerini silme.
- `.env.local` repoya eklenmez. Gerçek yerel veriye test sırasında dokunma; testler ayrı localhost origin kullanmalı.
- Vercel preview SSO korumalı; dağıtım kontrolü geçti, anonim HTTP duman testi prod üzerinde yapılır.

## Doğrulanmamış iddialar

- 5.000 kayıt/60 FPS hedefi ölçülmedi. IndexedDB engelli gerçek tarayıcı senaryosu manuel sınanmadı.
