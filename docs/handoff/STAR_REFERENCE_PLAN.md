# Yıldız referans uygulama planı · 2026-10-04

Kullanıcı Masaüstü `yaklaşım.png` (210×203), `genel.png` (1262×795), `uzaktan görünüş.png` (103×105) incelendi. İlk referans orta yaklaşmada yuvarlatılmış elmas biçimli parlak beyaz/lavanta çekirdek, mor halo ve kısa dört uç; genel referans farklı ekran/depth konumları, uzun ince optik çizgiler ve gaz içinde görünür ışıklar gösterir. Uzak referans küçük keskin çekirdek/dört uç. Son talimat önceki erken küresel yüzey geçişini değiştirir.

| Sıra | İş | Kabul |
|---|---|---|
| 1 | Bağımsız olmayan, Orion dokusuna gömülü ışık noktalarını gaz rehberinden bastır | Kelime kayıtları dışındaki keskin çekirdek ve uçlar görünmesin; gazın ana kıvrımları korunsun. |
| 2 | Optik yıldız sistemi | Uzakta keskin küçük çekirdek; normalize yaklaşım %55'te yaklaşım referansı gibi parlak lavanta çekirdek/halo; uzun ince uçlar, yavaş farklı fazlı ışık değişimi. Yüzey çok daha yakında açılsın. |
| 3 | Random görünen ekran yerleşimi | Yeni kayıtlar güncel görünür ekran içinde farklı yerlerde kalıcı random koordinat alsın; belli halka/dizi olmasın; mevcut kayıtlar taşınmasın. Ön/iç/arka derinlikler. |
| 4 | Gaz-yıldız ilişkisi | Bulutsunun içindeki/arkasındaki ışıklar gaz yoğunluğuna göre sönsün; ince boşluklarda parlasın. Ekrana yapışık yıldız hissi azaltılsın. |
| 5 | Hedef zoom | Mouse seçimi hedefi kilitlesin; canvas wheel yalnız o hedefi yaklaştırsın/uzaklaştırsın. UI kendi kaydırmasını korusun. Reset/Escape hedefi bıraksın. Wheel önceki 0.75'ten belirgin şekilde daha yavaş ve büyük deltalar sınırlı olsun. |
| 6 | Doğrulama/devir | %55, uzak, yakın, arkada, farklı viewport; seçim/kayıt korunması; yerel tarayıcı açık; commit/push. |

%55, seçilen yıldızın en uzak görünür kamera mesafesi ile güvenli yüzey mesafesi arasındaki logaritmik yaklaşımın %55'idir; mouse event sayısı değildir. Kayıtların kimliği/kelime/anlam/öğrenme geçmişi korunur. Referans ekran görüntüleri kişisel Masaüstünde kalır, Git'e taşınmaz. İş durumu HANDOFF/STATE üstünde tutulur.

## Uygulanan kararlar

1. Fotoğrafa gömülü yıldızlar aktif Orion gaz dokusundan temizlendi; bağımsız Gaia/Trapezium/demo katmanları kapalı. Yeni türev **1254×1254 native AI düzenlemesidir**, 8K değildir. Özgün gözlemsel dosyalar korunur.
2. Optik çekirdek, ince dört uç, uzun orta mesafe çizgileri ve farklı fazlı yavaş parlama uygulandı. Yakın yüzeyde 128³ granülasyon dokusu kullanılır. Azaltılmış hareket tercihinde animasyon durur.
3. Yeni kayıtlar görünür bölgede random yer ve derinlik alır. 42px ayrılık için 160 deneme yapılır; çok kalabalık ekranda bu ayrılık garanti değildir. Mevcut kayıtlar taşınmaz.
4. Gaz içi/arkası ışıklar modellenmiş yoğunluk boyunca sönümlenir. Bu bilimsel olarak kalibre bir optik derinlik ölçümü değildir.
5. Seçili yıldız wheel ve zoom butonlarının hedefidir. Wheel katsayısı 0.75 → 0.30, büyük deltalar ±180 ile sınırlıdır. Ters yönde eski hedef iptal edilir; Escape hedefi mevcut kadrajı sıçratmadan bırakır.
6. Gerçek hesap üzerinde veri eklemeden görsel inceleme, sentetik sahnede kanıt ve tam regresyon sonuçları HANDOFF üstüne kaydedilir. Görsel son kabul kullanıcıdadır.
