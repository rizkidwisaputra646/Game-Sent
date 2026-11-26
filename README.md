# GameSent — Gaming Sentiment Research & Analytics Platform

**GameSent** adalah platform web analitik riset sentimen pemain **Mobile Legends: Bang Bang** dan **Dota 2** menggunakan **TF-IDF**, **Multinomial Naive Bayes**, dan **K-Nearest Neighbors (KNN)** yang berjalan 100% di sisi browser (*frontend-first*, tanpa database eksternal maupun Python runtime di production).

Platform ini memadukan keterbacaan analitik penelitian ilmiah dengan arah visual **Friendly Neo-Brutalism + Anime Editorial + Gaming Analytics**.

---

## Ringkasan Dataset & Model Penelitian

Seluruh metrik dan artefak model diekstrak secara deterministik dari notebook penelitian `Klasifikasi_Sentimen_Dota2_dan_Mobile_Legends.ipynb` (`random_state=42`, stratified split 80:20):

- **Total Dataset Penelitian:** `4.997` ulasan berlabel (`0` null, `0` duplikat)
  - **Mobile Legends: Bang Bang** (Google Play Store, `label_source: model`): `2.499` ulasan (`31.53%` Positif / `68.47%` Negatif)
  - **Dota 2** (Steam Community, `label_source: voted_up Steam`): `2.498` ulasan (`57.17%` Positif / `42.83%` Negatif)
  - **Train / Test Split:** `3.997` data latih / `1.000` data uji
- **Ekstraksi Fitur (TF-IDF):** `5.000` vocabulary features, N-gram `(1, 2)`, `min_df=2`, English stop words (`318` terms), `norm='l2'`, `smooth_idf=true`
- **Multinomial Naive Bayes (`alpha=1.0`, `fit_prior=true`):**
  - Accuracy: **`80.50%`** | Precision (+): `0.8116` | Recall (+): `0.7291` | F1-Score (+): `0.7681`
- **K-Nearest Neighbors (`k=5`, `metric='cosine'`, `weights='uniform'`):**
  - Accuracy: **`74.10%`** | Precision (+): `0.6933` | Recall (+): `0.7449` | F1-Score (+): `0.7182`
  - *Catatan metodologis:* Skor KNN merepresentasikan proporsi voting dari 5 tetangga terdekat, bukan probabilitas terkalibrasi.

---

## Desain UI/UX & Anime Comic Motion System

### 1. Sistem Desain (*Friendly Neo-Brutalism + Anime Editorial*)
- **Palet Warna Utama:** Light Cream (`#F7F4EC`) sebagai latar utama, Surface Putih (`#FFFDFC`), Pastel Purple (`#A78BFA` / `#DDD6FE`) sebagai identitas GameSent, serta border tegas `#202020` (`1.5px–2px`) dengan *hard shadow* (`2px–4px`).
- **Pemisahan Warna Semantik:**
  - **Identitas Game:** Crimson Red (`#D94B43`) untuk **Dota 2**; Royal Blue (`#3479D4`) & Gold (`#E8BC55`) untuk **Mobile Legends**.
  - **Sentimen:** Mint Green (`#65C98A`) untuk Positif; Coral Red (`#FA7777`) untuk Negatif.
- **Tipografi:** `Space Grotesk` (heading & angka statistik), `Inter` (teks, navigasi, tabel), dan `JetBrains Mono` (ID, kode, metrik teknis).
- **Aset Visual (`public/images/`):** Ilustrasi orisinal karakter analis anime (`anime-hero.png`), logo resmi Dota 2 (`logo-dota2.png`) & Mobile Legends (`logo-mlbb.png`) berbingkai Neo-Brutalist, serta artwork tema arena (`dota-art.jpg` & `mlbb-art.jpg`).

### 2. Anime Comic Motion System (`components/motion/AnimeComicMotion.tsx`)
- **Transisi Halaman:** `ComicPageTransition` (fade, slide, dan slight scale `240ms`).
- **Efek Komik Selektif:** `ComicPanelReveal`, `ComicStaggerGroup`, `ComicPopCallout` (*"DATA READY!"*, *"ANALYZED!"*, *"BENCHMARKED!"*, *"EXPORTED!"*), `ComicSpeechBubble`, `ImpactBurst`, `MangaSpeedLines`, `ComicScanningEffect` saat inferensi Web Worker aktif, serta `MangaShake` untuk feedback validasi error.
- **Aksesibilitas:** Membungkus aplikasi dengan `<MotionConfig reducedMotion="user">` dan mematuhi preferensi `prefers-reduced-motion`.

### 3. Navigasi Responsif Multi-Perangkat
- **Desktop (`>= 1024px`):** Sidebar sticky permanen saat scroll (`sticky top-0 h-screen` dengan `overflow-x: clip`), kontrol status *Model Ready*, serta panel notifikasi riwayat lokal.
- **Tablet (`768px–1023px`):** Top bar dengan tombol drawer navigasi.
- **Mobile (`< 768px`):** Top bar bersih tanpa tombol hamburger, ditambah **Floating Comic Neo-Brutalist Bottom Navigation** (`MobileBottomNavigation`) dengan 5 menu utama (**Home**, **Model**, **Analyze**, **Dataset**, **Compare**), safe-area padding (`env(safe-area-inset-bottom)`), dan tombol pintasan **Reports** di header mobile.

---

## Fitur Halaman

1. **Dashboard (`/dashboard`):** Ringkasan ringkas ala bento grid—kartu profil Dota 2 & Mobile Legends lengkap dengan mini sparkline, kartu metrik 3-in-1 (*Total Dataset*, *Positive*, *Negative*), filter game interaktif, donut chart distribusi sentimen, grafik performa model, *Quick Access*, *Recent Activity* (IndexedDB), serta banner *Explore More with GameSent*.
2. **Model & Evaluation (`/models`):** Pipeline preprocessing teks & parameter TF-IDF, kartu metrik & Confusion Matrix untuk Multinomial Naive Bayes dan KNN, grafik komparasi metrik, top TF-IDF terms, serta *Live Browser Latency Benchmark* melalui Web Worker.
3. **Sentiment Analyzer (`/analyzer`):** Klasifikasi ulasan tunggal maupun batch multi-baris di Web Worker dengan *Comic Scanning Effect*, skor probabilitas/voting, hasil preprocessing, kata kunci TF-IDF yang cocok, serta ekspor langsung ke CSV/XLSX/PDF.
4. **Dataset Explorer (`/datasets`):**
   - **Dataset Penelitian (Read-Only):** Eksplorasi, pencarian, filter game/sentimen, dan paginasi `4.997` ulasan asli.
   - **Import CSV / XLSX:** Unggah dataset tambahan (maks. 15 MB) dengan drag-and-drop, pemetaan kolom otomatis, pemeriksaan duplikat/validasi, serta inferensi terisolasi dari dataset penelitian.
   - **Riwayat Sesi Lokal (IndexedDB):** Meninjau, membuka kembali, atau menghapus sesi analisis yang tersimpan lokal di browser.
5. **Game Comparison (`/comparison`):** Perbandingan visual Dota 2 vs Mobile Legends dengan header artwork penuh, grafik batang (jumlah vs persentase), statistik panjang kata/karakter, dan interpretasi metodologis mengenai perbedaan platform sumber.
6. **Reports & Export (`/reports`):** Pembuatan laporan formal dari dataset penelitian maupun sesi lokal ke format **CSV**, **XLSX** (ExcelJS), dan **PDF** (jsPDF) dengan pemisahan kolom `actual_label` dan `predicted_sentiment`.

---

## Tech Stack

- **Framework & Bahasa:** Next.js 15 (App Router), React 19, TypeScript
- **Styling & Animasi:** Tailwind CSS v4, Motion (`motion/react`), Lucide React
- **Visualisasi & Data:** Recharts, Papa Parse (CSV), ExcelJS (XLSX), jsPDF & jsPDF-AutoTable (PDF)
- **Inference & Penyimpanan Lokal:** Web Worker (`workers/`), TF-IDF + MultinomialNB + KNN (`lib/ml/`), IndexedDB & LocalStorage (`lib/storage/`)
- **Testing:** Vitest & TSX

---

## Struktur Direktori Utama

```text
├── app/
│   ├── analyzer/page.tsx        # Halaman Sentiment Analyzer (Single & Batch)
│   ├── comparison/page.tsx      # Halaman Game Comparison (Dota 2 vs MLBB)
│   ├── dashboard/page.tsx       # Halaman Dashboard Overview
│   ├── datasets/page.tsx        # Halaman Dataset Explorer, Import CSV/XLSX & History
│   ├── models/page.tsx          # Halaman Model & Evaluation + Latency Benchmark
│   ├── reports/page.tsx         # Halaman Reports & Export (CSV, XLSX, PDF)
│   ├── globals.css              # Design tokens Neo-Brutalist & animasi halftone/scan
│   └── layout.tsx               # Root layout, font (Space Grotesk, Inter, JetBrains Mono) & viewport
├── components/
│   ├── charts/                  # Komponen grafik Recharts
│   ├── layout/                  # AppShell, MobileBottomNavigation, dan konfigurasi navigation.ts
│   ├── motion/                  # AnimeComicMotion & ScrollPrimitives
│   ├── providers/               # GameSentProvider (state model, metadata, IndexedDB)
│   └── ui/                      # Cards, Buttons, PageHeader, StatusBadge, AnimeDecoration, DataTable, States
├── lib/                         # Engine ML (TF-IDF, NB, KNN), parser CSV/XLSX, exporter PDF/XLSX, storage
├── public/
│   ├── data/                    # research-dataset.json & research-metadata.json
│   ├── images/                  # anime-hero.png, logo-dota2.png, logo-mlbb.png, dota-art.jpg, mlbb-art.jpg
│   └── models/                  # tfidf-nb.json, knn-train.bin, knn-meta.json
├── tests/                       # Unit & integration tests (dataset, ml, io, navigation)
└── workers/                     # Web Worker untuk inferensi model non-blocking
```

---

## Menjalankan & Pengujian Secara Lokal

### 1. Instalasi & Development Server
```bash
npm install
npm run dev
```
Buka `http://localhost:3000` di browser Anda.

### 2. Validasi Kesetaraan Model (Python vs TypeScript)
```bash
npm run validate:ml
```

### 3. Typecheck, Linting, Unit Tests, & Production Build
```bash
npm run typecheck
npm run lint
npm test
npm run build
```

---

## Deployment ke Vercel

Aplikasi ini menggunakan arsitektur **frontend-first** Next.js App Router dengan artefak model dan dataset statis di direktori `public/`, sehingga siap langsung dideploy ke Vercel tanpa konfigurasi database atau backend eksternal:

1. Push repositori ke GitHub/GitLab/Bitbucket.
2. Import proyek di dashboard Vercel (`Framework Preset: Next.js`).
3. Jalankan build default (`next build`).
