# LexIndo — Asisten Riset Hukum Indonesia

LexIndo adalah purwarupa sistem asisten riset hukum ketenagakerjaan Indonesia berbasis Retrieval-Augmented Generation (RAG).

> **PENTING / PERINGATAN HUKUM:**
> LexIndo adalah **alat bantu riset hukum, bukan nasihat hukum**. Jawaban yang dihasilkan berasal dari teks regulasi yang terindeks dan selalu menyertakan sitasi resmi (Pasal & Ayat). Pengguna wajib memverifikasi kebenaran materi hukum ke sumber resmi ([peraturan.go.id](https://peraturan.go.id) / JDIH).

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** FastAPI, SQLite, SQLAlchemy ORM
- **Autentikasi:** JWT dalam httpOnly cookie, hashing password dengan Bcrypt
- **Vector Store & AI:** ChromaDB, `intfloat/multilingual-e5-base`, Google Gemini API (dengan mode `MOCK_LLM=true`)

---

## 🚀 Panduan Menjalankan Aplikasi

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

## 🧪 Menguji Phase 1 (Scaffold, Database & Auth)

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

