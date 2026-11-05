# 🚀 Panduan Deployment LexIndo

Dokumen ini memuat panduan lengkap deployment sistem **LexIndo (Asisten Riset Hukum Indonesia)** untuk lingkungan produksi, baik menggunakan **Docker & Docker Compose** (VPS/Server Lokal) maupun **Vercel + Render** (Cloud Hosting).

---

## 📋 Daftar Isi
1. [Fitur Siap Produksi (Production Readiness)](#-fitur-siap-produksi)
2. [Opsi 1: Docker & Docker Compose (Rekomendasi VPS / Lokal)](#-opsi-1-docker--docker-compose)
3. [Opsi 2: Vercel (Frontend) + Render (Backend)](#-opsi-2-vercel-frontend--render-backend)
4. [Variabel Lingkungan (Environment Variables)](#-variabel-lingkungan)
5. [Pemeriksaan Kesehatan (Health Checks)](#-pemeriksaan-kesehatan)

---

## 🌟 Fitur Siap Produksi
- **Auto-Seed on Startup:** Backend secara otomatis mendeteksi jika korpus hukum kosong saat booting dan langsung menjalankan seed 6 regulasi & 177 pasal chunk ke SQLite & ChromaDB.
- **Provider Embedding Fleksibel:** `EMBEDDING_PROVIDER=gemini` secara default (`models/text-embedding-004`), dengan fallback otomatis ke `SentenceTransformer` atau embedding offline jika API key belum dikonfigurasi.
- **Next.js Standalone & Rewrites Proxy:** Frontend Next.js mem-proxy seluruh panggilan `/api/*` ke backend FastAPI melalui server Next.js (menghilangkan kendala CORS dan menjaga keamanan cookie autentikasi `httpOnly`).
- **Endpoint `/health`:** Siap dipantau oleh load balancer, Docker health check, Render health check, atau Kubernetes liveness probe.

---

## 🐳 Opsi 1: Docker & Docker Compose

Sangat cocok untuk VPS (Ubuntu/Debian, DigitalOcean, AWS EC2, GCP Compute Engine) atau server lokal.

### 1. Prasyarat
- Docker Engine $\ge$ 20.10
- Docker Compose $\ge$ 2.0

### 2. Langkah Menjalankan
1. Clone repositori dan masuk ke direktori utama:
   ```bash
   git clone <repo-url>
   cd legalChatbot
   ```

2. (Opsional) Buat file `.env` untuk API Key Gemini:
   ```bash
   # Jika ingin menggunakan LLM nyata dari Google Gemini:
   echo "GEMINI_API_KEY=AIzaSy..." > .env
   echo "MOCK_LLM=false" >> .env
   ```
   *Catatan: Jika `.env` tidak dibuat, sistem otomatis berjalan dalam mode `MOCK_LLM=true` (aman dan mandiri tanpa internet).*

3. Jalankan container dengan Docker Compose:
   ```bash
   docker compose up -d --build
   ```

4. Periksa status container:
   ```bash
   docker compose ps
   ```
   Aplikasi akan aktif di:
   - **Frontend UI:** `http://localhost:3000` (atau IP VPS Anda port 3000)
   - **Backend API:** `http://localhost:8000`
   - **Swagger Docs:** `http://localhost:8000/docs`
   - **Health Check:** `http://localhost:8000/health`

5. Menghentikan atau melihat log:
   ```bash
   # Melihat log real-time
   docker compose logs -f

   # Menghentikan layanan
   docker compose down
   ```

Data korpus hukum (SQLite & ChromaDB) tersimpan secara persisten pada Docker Volume `lexindo_data`.

---

## ☁️ Opsi 2: Vercel (Frontend) + Render (Backend)

Kombinasi modern serverless gratis/murah untuk demo online global.

### Bagian A: Deploy Backend ke Render
1. Masuk ke [dashboard.render.com](https://dashboard.render.com).
2. Klik **New +** $\rightarrow$ **Blueprint** (atau **Web Service**).
3. Hubungkan repositori GitHub Anda.
4. Render akan otomatis mendeteksi file [`render.yaml`](file:///c:/z/Technoprenuer/legalChatbot/render.yaml):
   - **Runtime:** Python 3.11
   - **Root Directory:** `backend`
   - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
5. Isi Environment Variable di Render:
   - `GEMINI_API_KEY` (jika punya, atau biarkan kosong)
   - `MOCK_LLM` = `true` (atau `false`)
   - `CORS_ORIGINS` = `["*"]`
6. Klik **Apply**. Setelah build selesai, Anda akan mendapatkan URL backend (misalnya: `https://lexindo-backend.onrender.com`).
7. Uji endpoint health di browser: `https://lexindo-backend.onrender.com/health`.

### Bagian B: Deploy Frontend ke Vercel
1. Masuk ke [vercel.com](https://vercel.com) dan klik **Add New** $\rightarrow$ **Project**.
2. Pilih repositori GitHub Anda.
3. Pada pengaturan proyek:
   - **Framework Preset:** Next.js
   - **Root Directory:** klik edit $\rightarrow$ pilih folder `frontend`.
4. Tambahkan **Environment Variable**:
   | Key | Value | Keterangan |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | `https://lexindo-backend.onrender.com` | URL Render Backend Anda (tanpa garis miring di akhir) |
5. Klik **Deploy**.
6. Vercel akan membangun Next.js App Router. Semua request `/api/*` dari pengguna akan otomatis diteruskan melalui rewrites Next.js ke backend Render!

---

## ⚙️ Variabel Lingkungan

| Variabel | Default | Keterangan |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./lexindo.db` | URL koneksi SQLAlchemy |
| `CHROMA_PATH` | `./chroma_db` | Lokasi direktori penyimpanan vektor ChromaDB |
| `EMBEDDING_PROVIDER` | `gemini` | `gemini` \| `sentence-transformers` \| `offline` |
| `GEMINI_EMBEDDING_MODEL`| `models/text-embedding-004` | Model embedding resmi Gemini |
| `GEMINI_API_KEY` | *(kosong)* | Kunci Google AI Studio API |
| `MOCK_LLM` | `true` | Jika `true`, menggunakan canned generator deterministik tanpa biaya token |
| `SECRET_KEY` | *(acak)* | Kunci enkripsi token sesi JWT |
| `ADMIN_INVITE_CODE` | `ADMIN2025` | Kode registrasi untuk peran Admin Korpus |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Target URL backend untuk rewrites proxy Next.js |

---

## 🩺 Pemeriksaan Kesehatan

Periksa kesehatan backend kapan saja via HTTP GET:
```bash
curl http://localhost:8000/health
```

Contoh respon JSON (Status 200 OK):
```json
{
  "status": "ok",
  "app": "LexIndo",
  "version": "1.0.0",
  "database": "connected",
  "chromadb": "ready",
  "embedding_provider": "gemini",
  "mock_llm": true
}
```

