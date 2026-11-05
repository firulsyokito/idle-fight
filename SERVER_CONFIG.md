# 🌐 Konfigurasi Alamat Server Idle Fight

File utama pengaturan alamat server berada di:
`public/js/config.js` (baris ke-5):
```javascript
window.DEFAULT_SERVER_URL = 'https://smile-insured-stated-receives.trycloudflare.com';
```

---

## ⚡ 2 Cara Cepat Mengubah Alamat Server di Kemudian Hari:

### Cara 1: Menggunakan Script Otomatis (Paling Mudah)
Cukup jalankan file:
👉 **`GANTI-URL-SERVER.bat`** (ada di folder utama dan di folder `idle-fight`)

1. Double-click file **`GANTI-URL-SERVER.bat`**.
2. Masukkan URL server baru Anda (misal URL baru dari Cloudflare / Koyeb / VPS).
3. Tekan Enter.
4. Script akan **otomatis** mengupdate `config.js`, menyusun ulang `index.html` dan `dist/google-sites-embed.html`.
5. Anda tinggal push ke GitHub:
   ```bash
   git add .
   git commit -m "update server url"
   git push
   ```

---

### Cara 2: Dari Dalam Menu Game (Tanpa Edit Kode)
1. Buka game di browser.
2. Buka menu **Akun Pahlawan**.
3. Ketik URL server baru di kotak **Alamat Server Game**, lalu klik **Simpan & Cek**.
4. Tersedia juga tombol **Reset** jika ingin kembali ke URL bawaan `config.js`.

