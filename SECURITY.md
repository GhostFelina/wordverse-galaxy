# Güvenlik

Güvenlik açığını herkese açık issue içinde paylaşma. GitHub deposundaki **Security → Report a vulnerability** akışını kullan.

Wordverse kelimeleri ve olay geçmişini bu tarayıcıdaki yerel depolamada ve IndexedDB'deki ikinci yerel kopyada tutar. Sunucuya kelime yüklemez. GitHub kod deposuna veya Vercel derlemesine kullanıcı verileri eklenmez. Tarayıcının tüm site verilerini silmek her iki yerel kopyayı da silebilir. JSON yedekleri kişisel kelimeleri içerir; onları özel tut.

Bağımlılıklar proje kilit dosyasıyla sabitlenir. `npm ci`, `npm run check` ve `npm audit` doğrulama için kullanılır. İçe aktarılan JSON için boyut ve şema kontrolleri vardır; metinler HTML olarak işlenmez.
