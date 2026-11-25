# GameSent — Gaming Sentiment Research & Analytics Platform

GameSent adalah platform web analitik riset sentimen pemain **Mobile Legends: Bang Bang** dan **Dota 2** menggunakan **TF-IDF**, **Multinomial Naive Bayes**, dan **K-Nearest Neighbors (KNN)** yang berjalan sepenuhnya di browser (tanpa database eksternal dan tanpa Python runtime di production).

## Fitur Utama

1. **Dashboard Analytics (`/dashboard`)**: Statistik aktual dataset penelitian (`4.997` ulasan berlabel), distribusi sentimen, perbandingan per game, filter game (`All Games`, `Mobile Legends`, `Dota 2`), ringkasan performa model, dan aktivitas riwayat analisis lokal.
2. **Model & Evaluation (`/models`)**: Spesifikasi lengkap TF-IDF (`5.000` fitur, N-gram `(1, 2)`, `min_df=2`, English stop words), Multinomial Naive Bayes (`alpha=1.0`, `Accuracy 80.50%`), KNN (`k=5`, `metric='cosine'`, `Accuracy 74.10%`), Confusion Matrix, perbandingan model, serta pengukuran latensi Web Worker langsung di browser.
3. **Sentiment Analyzer (`/analyzer`)**: Analisis ulasan tunggal dan batch (banyak baris) menggunakan Web Worker, menampilkan posterior probability (Naive Bayes) atau skor voting tetangga (KNN), fitur TF-IDF yang cocok, serta ekspor hasil.
4. **Dataset Explorer (`/datasets`)**:
   - **Dataset Penelitian (Read-Only)**: Penelusuran dan pencarian seluruh `4.997` ulasan penelitian asli.
   - **Import Dataset Tambahan**: Unggah CSV/XLSX (maks. 15 MB), preview data, pemetaan kolom, laporan validasi lengkap, dan inferensi pada sesi terpisah.
   - **Riwayat Sesi Lokal (IndexedDB)**: Buka, tinjau, atau hapus riwayat sesi analisis yang tersimpan secara lokal di browser.
5. **Game Comparison (`/comparison`)**: Perbandingan distribusi sentimen Mobile Legends vs Dota 2 beserta interpretasi statistik yang mempertimbangkan sumber label (`voted_up Steam` vs `model`).
6. **Reports & Export (`/reports`)**: Ekspor laporan penelitian maupun sesi analisis lokal ke **CSV**, **XLSX** (ExcelJS), dan **PDF** (jsPDF) dengan pemisahan tegas antara `actual_label` dan `predicted_sentiment`.

## Validasi Kesetaraan Model (Python vs TypeScript)

Pipeline di `Klasifikasi_Sentimen_Dota2_dan_Mobile_Legends.ipynb` direproduksi secara deterministik (`random_state=42`) dan diekspor ke artefak statis:

- `public/models/tfidf-nb.json` (Vocabulary 5.000 term, IDF weights, parameter MultinomialNB)
- `public/models/knn-train.bin` & `public/models/knn-meta.json` (3.997 vektor training sparse CSR)
- `public/data/research-metadata.json` & `public/data/research-dataset.json`

Untuk menjalankan validasi TypeScript vs Python (`1.000` data uji + edge cases):

```bash
npm run validate:ml
```

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Pengujian & Build Produksi

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deployment ke Vercel

Aplikasi ini menggunakan arsitektur **frontend-first** Next.js App Router dengan artefak statis di `public/`, sehingga siap langsung dideploy ke Vercel tanpa konfigurasi database atau variabel lingkungan eksternal:

1. Push repositori ke GitHub/GitLab/Bitbucket.
2. Import proyek di dashboard Vercel (`Framework Preset: Next.js`).
3. Build command default (`next build`) akan menghasilkan output statis & server App Router yang siap dijalankan di Vercel.
