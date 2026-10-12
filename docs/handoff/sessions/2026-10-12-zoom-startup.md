# Zoom/startup checkpoint

## Zoom ve açılış düzeltmeleri · 2026-10-12 · 1.16.1

Son kullanıcı önceliği: zoom yıldızları kaybediyor, kadraj başka yere kayıyor, ilk tekerlek takılıyor ve açılış siyah/boş görünüyor. Gerçek 5360 Chrome'da ilk wheel (0.2 page) target160→-40.38, x0→116.34 görüldü; seçili yıldız yokken Orion pick otomatik uçuşu farklı derinlik ölçeğine geçiriyordu.

- Plain wheel artık bulutsu seçmez; uçuş yalnız açık Orion seçimiyle başlar. Tekerlek doğrudan kelime yıldızının üzerindeyse o kayda kilitlenir; panel açılmaz. Pan/zoom damping aynı, cursor kadrajı yaklaşım boyunca tutarlı. Gerçek Chrome son gözlem: target160→148.53, x~3.40 ilk hareket; yıldızlar görünür. Kayıt/koordinat/owner değişimi yok.
- Gaz hareket ve sabit kadraj tamponları ayrı, kalıcı ve önceden initialize edilir. Sahne + composite + yakın stellar materyalleri ilk görünür kareden önce compileAsync ile hazırlanır. Kalite/viewport değişimi gerekirse tampon boyutu yine değişebilir; hiç allocation yok iddiası değildir.
- Başlangıçta aynı yıldızsız Orion ile statik görsel ve TR/EN/ES hazırlık durumu görünür. Render bütün window load'unu beklemez; unrelated image bloklanırken sahne çalışır. Owner çözülmeden kişisel GPU/içerik hâlâ kapalı. Shader/sky asset başarısızsa atlas fallback; sonsuz siyah yükleme yerine görünür erişim. Login/mobil geliştirilmedi.
- Son kaynak123unit/lint/typecheck/build/format/release geçti. İlk10zoom/graphics/stellar (53.9s),17camera/experience/Orion (1.2m), son sky-failure ilavesinden sonra6zoom/graphics (23.2s), ardından hızlı reversal düzeltmesiyle5zoom/startup geçti. Tam102remote gate sonraki push için beklenir; eski97 başarı aşağıdaki5a00d01'e aittir.
- Sentetik gerçek GPU ölçümü: Chrome/headless/ANGLE-D3D11 RTX5060Ti,1440×900, ilk wheel -180 sonrası2s RAF288kare,p95~7.1ms/max~12.9ms,errors0, kayıtlar aynı, yıldız görünür. Buffer allocation sayacı2→3; otomatik kalite yükselmesi de ölçüm içindedir. GPU timer query veya bütün donanımlarda takılma yok kabulü değildir. evidence/2026-10-12-first-wheel-d3d11.json ve zoom-fixed-1440.png. Özel kullanıcı kayıt/ekranları dışa aktarılmadı.
- Sıradaki:1.16.1 CI/preview sonucu ve masaüstü kullanıcı zoom/açılış kabulü → U2 görsel kabulü/kalıcı tekrar. Preview-only; production1.14.1 değişmez. Kapalı katalogları açma.

