# MacBook → Windows devir · 2026-10-03 · codex

Kullanıcı talimatı: “tamam bekle windowstan devam edeceğim macbookta dur bunu windows bilsin ama”.
Mac'te geliştirme durduruldu; yalnız güvenli arşiv ve devir işlemleri yapıldı.

- Mac klonu: `/Users/felina/Projects/wordverse-galaxy`.
- Başlangıçta aktif uzak faz dalı incelenmeden eski main `3752ff1` üzerinden çalışıldı.
  Devir sırasında `origin/phase/2-auth-sync` dalının dokuz commit ileride olduğu görüldü.
  Önceki kısa durum mesajı bu nedenle güncel proje ilerlemesini eksik anlatıyordu.
- Güncel uygulama `76b039f`: hesap UI, offline queue, conditional cloud writes,
  ayrı hesap depoları ve Google kabulü önceki Windows oturumunda zaten geliştirilmiş.
  Buradaki kabul bilgileri Mac'te yeniden doğrulanmadı.
- Alternatif şema ve CI denemesi `checkpoint/mac-2026-10-03-paused`, `0f94672`
  commit'iyle arşivlenip GitHub'a gönderildi. Aktif dala taşınmadı; canlı şemaya uygulanmamalı.
- Arşivdeki ilk şema sürümü: 50 pgTAP test PASS, advisors temiz.
  Son insert-trigger değişikliği ve üç yeni test çalıştırılmadı.
  Eski main lint/typecheck/20 unit/build geçti; e2e sandbox EPERM nedeniyle başlayamadı.
  Son yerel SQL güncellemesi/tam kontrol komutu kullanıcı kesintisiyle çalışmadı;
  beklenen `/private/tmp/wordverse-local-stamp.sql` oluşturulmamıştı.
- Aktif Mac dalı mevcut uzak `phase/2-auth-sync` üzerine fast-forward edildi.
  Yerel node_modules eski main'e ait; tekrar kullanılırsa npm ci gerekir.
- Yeni yerel Supabase `wordverse-galaxy` durduruldu; backup=true, veri silinmedi.
  Colima başka projelerin altyapısını etkilememek için kapatılmadı.
  Production, gerçek kullanıcı verisi, hesap güvenliği ve Google yapılandırması değiştirilmedi.
- Windows: mevcut klonu ve yerel tarayıcı verisini koru; temiz ağaçta fetch/switch/pull,
  ardından HANDOFF başındaki Windows devir bloğu ve Faz 2 kalan kabul işleri.

Bu commit dokümantasyon devridir; ürün değişikliği, yeni release veya Faz 2 tamamlanma iddiası içermez.
