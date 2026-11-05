# LexIndo — Asisten Riset Hukum Indonesia

LexIndo adalah purwarupa sistem asisten riset hukum ketenagakerjaan Indonesia berbasis Retrieval-Augmented Generation (RAG).

> **PENTING / PERINGATAN HUKUM:**
> LexIndo adalah **alat bantu riset hukum, bukan nasihat hukum**. Jawaban yang dihasilkan berasal dari teks regulasi yang terindeks dan selalu menyertakan sitasi resmi (Pasal & Ayat). Pengguna wajib memverifikasi kebenaran materi hukum ke sumber resmi ([peraturan.go.id](https://peraturan.go.id) / JDIH).

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** FastAPI, SQLite, SQLAlchemy ORM
- **Autentikasi:** JWT dalam httpOnly cookie, hashing password dengan Bcrypt
- **Vector Store & AI:** ChromaDB, `EMBEDDING_PROVIDER=gemini` (`models/text-embedding-004`) / `multilingual-e5-base`, Google Gemini API (dengan fallback `MOCK_LLM=true`)

---

## ⚡ Deployment Cepat dengan Docker Compose

Untuk menjalankan seluruh stack (Backend + Frontend + Auto-seed + Storage Persisten):

```bash
docker compose up -d --build
```
Aplikasi akan langsung aktif di:
- **Frontend UI:** `http://localhost:3000`
- **Backend API & Health:** `http://localhost:8000/health`
- **Swagger Docs:** `http://localhost:8000/docs`

> 📖 Untuk panduan deployment ke **Vercel + Render** atau konfigurasi produksi detail, silakan baca [DEPLOYMENT.md](file:///c:/z/Technoprenuer/legalChatbot/DEPLOYMENT.md).

---

## 🚀 Panduan Menjalankan Aplikasi Secara Manual (Development)

### 1. Backend (FastAPI)

```bash
cd backend

# Aktifkan virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependensi (jika belum)
pip install -r requirements.txt

# Salin konfigurasi environment
cp .env.example .env

# Jalankan server FastAPI
uvicorn main:app --reload --port 8000
```

Backend API akan berjalan di: `http://localhost:8000`
Dokumentasi Swagger API: `http://localhost:8000/docs`

### 2. Frontend (Next.js)

```bash
cd frontend

# Install dependensi
npm install

# Jalankan server Next.js dev
npm run dev
```

Frontend UI akan berjalan di: `http://localhost:3000`

---

## 📚 Mengisi & Mengelola Korpus Hukum (Phase 3 / BP1)

### 1. Menjalankan Seed Script Korpus Ketenagakerjaan
Untuk menginisialisasi database SQLite dan ChromaDB dengan naskah awal hukum ketenagakerjaan:

```bash
cd backend
.venv\Scripts\python.exe seed/seed.py
```

Naskah seed tersimpan di [`backend/seed/labor_law_seed.json`](file:///c:/z/Technoprenuer/legalChatbot/backend/seed/labor_law_seed.json) dan ditandai dengan label `[CONTOH - VERIFIKASI DENGAN SUMBER RESMI]`. Seed ini memuat:
- **UU 13/2003:** Pasal 56, Pasal 59 (status `diubah`), Pasal 88.
- **UU 6/2023 (UU Cipta Kerja):** Mengubah Pasal 59 UU 13/2003 (status `berlaku`, rantai amandemen BP3).
- **PP 35/2021:** Pasal 8 (jangka waktu PKWT maks 5 tahun), Pasal 15 (kompensasi PKWT).
- **Permen 999/2024 (Simulasi):** Membatasi PKWT maks 1 tahun (konflik hierarki sengaja untuk demo BP4).

### 2. Mengunggah & Parsing Regulasi Baru Melalui UI Admin
1. Buka `http://localhost:3000/login` dan masuk sebagai **Admin Korpus** (atau daftar baru dengan kode `ADMIN2025`).
2. Masuk ke menu **Kelola Korpus** (`/admin/korpus`).
3. Klik **Unggah Peraturan Baru**, isi metadata (Jenis, Nomor, Tahun, Judul, Status, URL Sumber).
4. Unggah berkas **PDF/TXT** atau tempel naskah teks peraturan.
5. Klik **Pratinjau Struktur (Parser)**: Sistem membagi naskah per Bab/Pasal/Ayat secara otomatis.
6. Periksa daftar pasal, lalu klik **Konfirmasi & Indeks ke ChromaDB**.
7. Regulasi langsung tersimpan di SQLite dan vektornya tertanam di ChromaDB (`./chroma_db`).

---

## 🧪 Menguji Phase 1 & Phase 2

Jalankan test suite otomatis Phase 1 dari folder `backend`:

```bash
cd backend
.venv\Scripts\python test_sync_auth.py
```

### Hasil Uji Phase 1:
1. Pembuatan seluruh tabel SQLite (`users`, `regulations`, `pasal_chunks`, `conversations`, `messages`, `folders`, `saved_items`, `feedbacks`).
2. Hashing password Bcrypt & verifikasi constant-time.
3. Penerbitan & verifikasi JWT Access Token.
4. Pendaftaran peran **Pengguna** (`role=pengguna`).
5. Pencegahan email duplikat (409 Conflict).
6. Penolakan pendaftaran **Admin Korpus** tanpa kode undangan valid (400 Bad Request).
7. Pendaftaran **Admin Korpus** dengan kode undangan `ADMIN2025` (201 Created).
8. Login menghasilkan JWT httpOnly cookie.
9. Endpoint `/api/auth/me` membaca identitas dari cookie.
10. Proteksi peran: Pengguna diblokir dari endpoint Admin (403 Forbidden).
11. Proteksi peran: Admin Korpus diizinkan mengakses endpoint Admin (200 OK).
12. Pembaruan profil (Nama & Instansi).
13. Penyelesaian onboarding wizard (`onboarding_completed=True`).
14. Pengubahan password & login ulang dengan password baru.
15. Penghapusan akun permanen (kepatuhan UU Perlindungan Data Pribadi / UU PDP).

