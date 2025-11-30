# :notebook: Weather Dashboard

Proyek ini adalah aplikasi dashboard cuaca interaktif sederhana untuk memantau kondisi terkini dan prakiraan 5 hari. Aplikasi ini menargetkan pengguna Indonesia, sehingga antarmuka dan konten menggunakan Bahasa Indonesia.

## Struktur Folder

- `index.html` – Halaman utama yang merangkai struktur UI, memuat Tailwind melalui CDN, serta menyisipkan stylesheet dan script lokal.
- `styles.css` – Berisi gaya kustom tambahan seperti warna tema, efek animasi, dan penyesuaian tampilan favorit.
- `app.js` – Seluruh logika aplikasi: state management, pengaturan tema, favorit, pengambilan data cuaca, serta render konten dinamis.

## Teknologi yang Digunakan

- **HTML5** sebagai kerangka markup aplikasi tunggal.
- **Tailwind CSS** (via CDN) untuk utilitas styling cepat, dipadukan dengan `styles.css` untuk gaya unik aplikasi.
- **Font Awesome** (CDN) untuk ikon action seperti refresh, matahari/bulan, dan ikon favorite.
- **AJAX dengan `XMLHttpRequest`** melalui helper `ajaxGet` di `app.js` untuk mengambil data JSON tanpa library tambahan.

## Sumber Data Cuaca

Aplikasi memanfaatkan API terbuka dari **[Open‑Meteo](https://open-meteo.com/)**:

- Endpoint **Geocoding** (`https://geocoding-api.open-meteo.com/v1/search`) untuk menerjemahkan nama kota menjadi koordinat.
- Endpoint **Forecast** (`https://api.open-meteo.com/v1/forecast`) untuk mendapatkan data cuaca terkini serta prakiraan harian.

## Tampilan Preview

`![Preview](image.png)`

## Cara Menjalankan

1. Buka file `index.html` di peramban modern (Chrome/Firefox/Edge).
2. Masukkan nama kota pada kolom pencarian untuk mendapatkan data cuaca.
3. Simpan kota favorit menggunakan tombol “Tambah Kota Favorit” dan hapus bila tidak diperlukan melalui ikon `x` pada chip favorit.

## Catatan

- Tidak diperlukan API key untuk Open‑Meteo; cukup pastikan koneksi internet tersedia.
- Data favorit dan preferensi tema tersimpan di `localStorage`, sehingga setiap pengguna memiliki preferensi masing-masing di browser mereka.
