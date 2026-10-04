# Yükseltme kabulü

Uygulandı, otomatik doğrulandı, manuel görüldü, referans eşleşti ve kullanıcı kabulü ayrı durumlar. Test geçişi estetik kabul değildir.

| ID | Gereksinim | Güncel kanıt / kalan |
|---|---|---|
| WV-U01 | Demo onboarding sınırı | U1 experience-mode/main/auth bağlantısı; e2e/experience ve account-sync; manuel/model geçiş kabulü sürüyor |
| WV-U02 | Canlı tam ekran cosmos | Üretimde ephemeral yıldız+gezegen+gaz demo ve upgrade-lab; final görsel kalite açık |
| WV-U03 | Kesintisiz keşif | Henüz uygulanmadı / sonraki U-fazı |
| WV-U04 | OLED/gaz kişisel alan | Henüz uygulanmadı / sonraki U-fazı |
| WV-U05 | Yakın gerçekçi kelime yıldızı | premium-bodies demo/fixture içinde; gerçek kayıtlara U4 adapter henüz yok |
| WV-U06 | Aydınlatılmış bağlaç gezegeni | premium-bodies demo/fixture içinde; gerçek kayıtlara U4 adapter henüz yok |
| WV-U07 | Sabit kişisel merkez | Henüz uygulanmadı / sonraki U-fazı |
| WV-U08 | Galaksi/bulutsu çeşitliliği | Henüz uygulanmadı / sonraki U-fazı |
| WV-U09 | Asteroid/meteor/kuyruk | Henüz uygulanmadı / sonraki U-fazı |
| WV-U10 | Süpernova/kilonova | Henüz uygulanmadı / sonraki U-fazı |
| WV-U11 | Galaksi etkileşimi | Henüz uygulanmadı / sonraki U-fazı |
| WV-U12 | Kara delik | Henüz uygulanmadı / sonraki U-fazı |
| WV-U13 | ≥50fenomen | Henüz uygulanmadı / sonraki U-fazı |
| WV-U14 | Referans incelemesi | REFERENCE_ANALYSIS:4yerelgörsel/Xsplit/R5frame doğrulandı; kısa hareket/audio/ikincilvideo örnekleri açık |
| WV-U15 | Özgün ambient ses | Henüz uygulanmadı / sonraki U-fazı |
| WV-U16 | Veri/auth/misafir | Depo/schema/RLS değişmedi; account-sync mevcut regresyon ve stale-owner mode testleri, güncel fullgate bekliyor |
| WV-U17 | Cihaz/performans | Measured-frameDPR temel kodu; fiziki mobil/5000/p95/goldenresponsive açık |
| WV-U18 | Kalıcı devir | Yeni şartname AGENTS/CLAUDE/HANDOFF/STATE/TASKS bağlantıları; commit/remoteCI bu checkpoint sonrasında kontrol edilir |

Başlangıçe75ecca uzakCI37146273133:57pass/9fail (6accountsync,3desktopnebula). Yeni hedefli ilk25:23pass/2fail; initcold ve unavailableIDBguest erişimi düzeltildi, hedefli4/4tekrar geçti. Eski sonuç yeni kod kabulü değildir. Full71e2e/sonunit sonuçları HANDOFF güncellemesinde kaydedilir. Kullanıcı görsel kabulü yok.

## Nokta ölçeği ve güncel inceleme

Yeni demo yıldız/gezegeninde 2–7 CSS piksel projected-size yumuşak geçiş; en uzakta yaklaşık 2.2/1.8 CSS piksel noktalar. 105 unit geçti; 15 sentetik donmuş görünüm ve Chrome manuel uzak görünüm kanıtı evidence/upgrade altında. Yakın yıldız yüzeyi küresel/granüllü; gaz içi görünüm hâlâ düşük kontrastlı ve yumuşak, final kalite açık. Gezegen ilk bakışta çoğunlukla gece yüzü gösteriyordu; fixture bakışı aydınlık yarımküreye değiştirildi.

Son ön turlar 70/71 ve 29/30: SDK cold init / IDB gecikmesi. SDK prebundle ve kalıcı yazma sırasında GPU pause düzeltmesinden sonraki tam 71 test turu çalışıyor. Bu sonuçlar tam geçiş veya kullanıcı estetik kabulü olarak gösterilmez.

## Son doğrulama

8dd7be1: 105 unit / 71 e2e / lint / typecheck / build / format yerelde geçti. Vercel preview başarılı; remote CI 37157710980 çalışıyor. U1 otomatik entegrasyon doğrulandı, U2 kalite çalışması devam ediyor. 15 donmuş açı güncel source hashleriyle yeniden çekildi. Kayıtlar korunur; kullanıcı estetik kabulü hâlâ yok.

## Remote CI farkı ve düzeltme

37157710980: 105 unit geçti, fakat 65 e2e geçti / 6 başarısız (3 hesap, 3 demo tekrar geçişi). Yerel 71/71, remote geçiş sayılmaz. Dialog açıkken ve owner content-ready değilken GPU çizimi durduruldu; önceki kimlik karesi anında temizlenir. Yeni sahne çizimi 150ms sakin UI aralığını bekler, hızlı tekrar geçişler eski shaderları derlemeye zorlamaz. Hosted software WebGL üzerinde CI tek worker, yerelde iki worker. Test timeoutları ve 10 tekrar senaryosu korunur. Düzeltmenin hedefli gate / sonraki remote sonucu takip edilir.

Düzeltme sonrası iki yerel worker ile hesap + deneyim hedefli gate **16/16 geçti (52 saniye)**. On tekrar ve bekleme süreleri aynen korundu; lint geçti. Yeni remote tam gate, push sonrası ayrıca doğrulanacak.

## Son doğrulanmış kod checkpoint · e968196

Remote CI **37158521409 SUCCESS**: 105 unit / 71 e2e (6.8m) / lint / typecheck / build / Go email templates / format / release version gate / audit geçti; 0 vulnerabilities. Vercel PR7 preview SUCCESS. Son yerel lifecycle testleri 16/16 (52s) geçti. Bu belge commit'i uygulama kodu değiştirmez; doğrulama e968196 uygulama revizyonuna aittir. U2 görsel kalite, U3 kamera/mouse kontrolleri ve sonraki U-fazları açık. Kullanıcı estetik kabulü yok.
