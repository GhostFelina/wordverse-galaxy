# Wordverse stellar polish

## Masaüstü görsel geliştirme · 2026-10-12 · 1.15.1

Kullanıcı profesyonel görsel kaliteyi geliştirmeyi istedi; yalnız masaüstü tarayıcı. Yakın yıldız granülasyonu radyal hücre sıcaklığıyla yenilendi, limb darkening ve sıcak ince corona ayarlandı. Uzak optikler, LOD eşikleri ve kullanıcı koordinatları korunur. Detay paneli aynı production fotosferi aynı kayıt seediyle tek kare çizer; WebGL kaybında CSS fallback, restore sonrası yeniden çizim; panel/owner değişiminde temizleme. Gaz örnek sayısı değişmeden kıvrımlı anisotropik mikro lifler eklendi; Orion kaynak dosyası native1254 olarak aynı kaldı.

- Sürüm1.15.1; preview hedefi. Üretim1.14.1, main/release/tag değişmedi. U2 kullanıcı görsel kabulü açık.
- Son kaynak lint/typecheck/120unit/build/format/release geçti. 92 testlik tam yerel tarayıcı turu çalışıyor; yeni remote gate push sonrası izlenecek. Önceki91remote başarı2865d10'a aittir.
- Sentetik masaüstü before/after sekizer kadraj, manifest ve shared-stellar-preview panel kanıtı. İlk aşırı pozlama ve sert hücre sınırı denemeleri reddedildi; son karşılaştırma yumuşak hücre merkezi/kenar geçişini gösteriyor. Önizleme context loss/restore hedef testi önceki shader iterasyonunda geçti; son tam gate içindedir.
- Gerçek5360 Chrome paneli ready/yüzey olarak görüldü ve ana görünümde bırakıldı; özel ekran/kayıt Git'e alınmadı. Mobil/giriş işleri ertelendi. Donanım p95 ve bilimsel kalibrasyon yapılmadı; yan hacim sanatsal/yumuşak kalır.
- Sıradaki: son92gate/preview sonucu → masaüstü GPU p95/atlas fallback → kalıcı tekrar tasarımı. Bitmiş fazları yeniden başlatma; kapalı katalogları açma.

