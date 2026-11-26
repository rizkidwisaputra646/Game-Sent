# GameSent — Gaming Sentiment Research & Analytics

**GameSent** adalah aplikasi web untuk menganalisis dan memvisualisasikan sentimen ulasan pemain pada dua game MOBA populer: **Mobile Legends: Bang Bang** dan **Dota 2**.

Aplikasi ini dikembangkan sebagai implementasi penelitian klasifikasi sentimen berbasis teks menggunakan metode **TF-IDF**, **Multinomial Naive Bayes**, dan **K-Nearest Neighbors (KNN)**. Seluruh proses analisis dan inferensi model berjalan langsung di browser pengguna tanpa memerlukan database maupun server backend terpisah.

## Fitur Utama

1. **Dashboard Overview (`/dashboard`)**  
   Menyajikan ringkasan statistik dataset penelitian (`4.997` ulasan berlabel), distribusi sentimen positif dan negatif, perbandingan antar-game, serta ringkasan performa model.
2. **Model & Evaluation (`/models`)**  
   Menampilkan hasil evaluasi model **Multinomial Naive Bayes** dan **K-Nearest Neighbors (KNN)** lengkap dengan metrik akurasi, precision, recall, F1-score, confusion matrix, dan pengujian kecepatan inferensi di browser.
3. **Sentiment Analyzer (`/analyzer`)**  
   Alat uji coba prediksi sentimen untuk ulasan tunggal maupun banyak ulasan sekaligus (batch) secara real-time menggunakan model penelitian.
4. **Dataset Explorer (`/datasets`)**  
   Memungkinkan penelusuran dan pencarian seluruh data penelitian asli, mengunggah dataset tambahan berformat CSV atau Excel untuk dianalisis secara terpisah, serta mengelola riwayat sesi analisis yang tersimpan lokal di browser.
5. **Game Comparison (`/comparison`)**  
   Menampilkan perbandingan distribusi sentimen antara Mobile Legends (Google Play Store) dan Dota 2 (Steam) beserta konteks metodologisnya.
6. **Reports & Export (`/reports`)**  
   Mendukung pengunduhan hasil analisis dan ringkasan penelitian ke dalam format **CSV**, **Excel (XLSX)**, dan **PDF**.

## Ringkasan Dataset & Model

- **Dataset Penelitian:** `4.997` ulasan (`2.499` Mobile Legends dan `2.498` Dota 2), dibagi menjadi `3.997` data latih dan `1.000` data uji.
- **Multinomial Naive Bayes:** Akurasi `80.50%` pada data uji.
- **K-Nearest Neighbors (`k=5`, cosine):** Akurasi `74.10%` pada data uji.

## Menjalankan Proyek Secara Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` di browser Anda.

## Pengujian & Build

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Untuk memvalidasi kesetaraan hasil model TypeScript terhadap notebook penelitian Python:

```bash
npm run validate:ml
```
