<div align="center">

```
██╗      ██████╗  ██████╗ ██╗███████╗████████╗██╗██╗  ██╗
██║     ██╔═══██╗██╔════╝ ██║██╔════╝╚══██╔══╝██║██║ ██╔╝
██║     ██║   ██║██║  ███╗██║███████╗   ██║   ██║█████╔╝ 
██║     ██║   ██║██║   ██║██║╚════██║   ██║   ██║██╔═██╗ 
███████╗╚██████╔╝╚██████╔╝██║███████║   ██║   ██║██║  ██╗
╚══════╝ ╚═════╝  ╚═════╝ ╚═╝╚══════╝   ╚═╝   ╚═╝╚═╝  ╚═╝
         DASHBOARD INTERNAL — PERUSAHAAN LOGISTIK
```

[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Nginx](https://img.shields.io/badge/Nginx-Alpine-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-v2-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)

**UTS Cloud Computing — Sistem Dashboard Internal**  
*Implementasi Docker: Network Isolation · Persistent Volume · Shared Bind Mount*

</div>

---

## 📋 Daftar Isi

- [Soal 1 — Desain Topologi Network](#-soal-1--desain-topologi-network-skor-20)
- [Soal 2 — Manajemen Shared Storage & Persistence](#-soal-2--manajemen-shared-storage--persistence-skor-30)
- [Soal 3 — Implementasi Docker Compose](#-soal-3--implementasi-docker-compose-skor-30)
- [Soal 4 — Uji Penetrasi & Troubleshooting](#-soal-4--uji-penetrasi--troubleshooting-skor-20)
- [Cara Menjalankan](#-cara-menjalankan)
- [Struktur Proyek](#-struktur-proyek)

---

## 🌐 Soal 1 — Desain Topologi Network (Skor: 20)

### Arsitektur Jaringan

Sistem menggunakan **dua jaringan Docker terpisah** untuk memastikan isolasi keamanan antara zona publik dan internal.

```
                        ┌─────────────────────────────────────────────────┐
       INTERNET          │                   HOST MACHINE                  │
          │              │                                                 │
          │  Port 80     │   ┌─────────────────────────────────────────┐  │
          └──────────────┼──►│           frontend-net (bridge)          │  │
                         │   │           [ ZONA PUBLIK ]                │  │
                         │   │                                          │  │
                         │   │   ┌──────────────────────┐              │  │
                         │   │   │   🌐 web-server       │              │  │
                         │   │   │      (Nginx:alpine)   │              │  │
                         │   │   │   mem: 256m | cpu:0.5 │              │  │
                         │   │   └──────────┬───────────┘              │  │
                         │   │              │  proxy_pass               │  │
                         │   │   ┌──────────▼───────────┐              │  │
                         │   │   │   ⚙️  api-engine       │◄─────────┐  │  │
                         │   │   │      (Node.js:18)     │          │  │  │
                         │   │   │   mem: 512m | cpu:1.0 │          │  │  │
                         │   │   └──────────────────────┘          │  │  │
                         │   │                                      │  │  │
                         │   └──────────────────────────────────────┘  │  │
                         │                        │                     │  │
                         │            api-engine berada                 │  │
                         │            di DUA network                    │  │
                         │                        │                     │  │
                         │   ┌────────────────────▼────────────────┐   │  │
                         │   │        backend-net (internal: true)  │   │  │
                         │   │         [ ZONA INTERNAL ONLY ]       │   │  │
                         │   │     ⛔ TIDAK ADA AKSES INTERNET ⛔    │   │  │
                         │   │                                      │   │  │
                         │   │   ┌──────────────────────────────┐   │   │  │
                         │   │   │   🗄️  database                │   │   │  │
                         │   │   │      (MySQL:8.0)             │   │   │  │
                         │   │   │   mem: 1g | cpu: 1.5         │   │   │  │
                         │   │   │   Volume: mysql-data ──────► │──►│   │  │
                         │   │   │   /var/lib/mysql             │   │   │  │
                         │   │   └──────────────────────────────┘   │   │  │
                         │   │                                       │   │  │
                         │   └───────────────────────────────────────┘   │  │
                         │                                                 │  │
                         │   ┌─────────────────────────────────────────┐  │  │
                         │   │  📁 Bind Mount (Shared Logs)            │  │  │
                         │   │  ./logs/ ◄──────────────────────────────┼──┘  │
                         │   │     ├── audit.log  ◄── api-engine       │     │
                         │   │     └── app.log    ◄── web-server       │     │
                         │   └─────────────────────────────────────────┘     │
                         └─────────────────────────────────────────────────────┘
```

### Peta Koneksi Antar Container

```
web-server ──[frontend-net]──► api-engine ──[backend-net]──► database
     │                               │
     │         ❌ TIDAK BISA         │
     └─────────────────────────────┘
           web-server TIDAK BISA
           menjangkau database
           (beda network)
```

### Perintah Pembuatan Network

```bash
# 1. Buat network publik (container bisa akses internet)
docker network create \
  --driver bridge \
  frontend-net

# 2. Buat network internal (TERISOLASI — tidak ada akses internet)
#    Flag --internal menghapus default gateway dari network ini
docker network create \
  --driver bridge \
  --internal \
  backend-net

# Verifikasi isolasi backend-net
docker network inspect backend-net | grep Internal
# Output: "Internal": true  ✅
```

### Alasan Desain

| Network | Driver | Internal | Container | Alasan |
|---------|--------|----------|-----------|--------|
| `frontend-net` | bridge | ❌ false | web-server, api-engine | Butuh akses internet untuk menerima request dari luar |
| `backend-net` | bridge | ✅ **true** | api-engine, database | Database hanya boleh diakses dari dalam — flag `internal: true` menghapus default gateway, container tidak bisa outbound ke internet |

> **💡 Kunci Keamanan:** Flag `internal: true` pada `backend-net` memastikan tidak ada container di jaringan tersebut yang bisa melakukan koneksi keluar ke internet. Database hanya bisa "berbicara" dengan container lain di jaringan yang sama — yaitu `api-engine`.

---

## 💾 Soal 2 — Manajemen Shared Storage & Persistence (Skor: 30)

### Dua Mekanisme Storage

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOST MACHINE                             │
│                                                                 │
│  ┌─────────────────────────┐   ┌─────────────────────────────┐ │
│  │    DOCKER VOLUME        │   │       BIND MOUNT            │ │
│  │    (mysql-data)         │   │       (./logs)              │ │
│  │                         │   │                             │ │
│  │  /var/lib/docker/       │   │  ./logs/                    │ │
│  │  volumes/mysql-data/    │   │    ├── audit.log            │ │
│  │                         │   │    └── app.log              │ │
│  └──────────┬──────────────┘   └──────┬──────────┬──────────┘ │
│             │                         │          │             │
└─────────────┼─────────────────────────┼──────────┼─────────────┘
              │                         │          │
              ▼                         ▼          ▼
      ┌───────────────┐    ┌────────────────┐ ┌────────────────┐
      │   database    │    │   api-engine   │ │   web-server   │
      │   (MySQL)     │    │   (Node.js)    │ │   (Nginx)      │
      │               │    │                │ │                │
      │ /var/lib/mysql│    │ /app/logs      │ │ /app/logs      │
      │ (persisten)   │    │ (shared)   ────┼─┤ (shared)       │
      └───────────────┘    └────────────────┘ └────────────────┘
```

### 2a. Docker Volume — Persistensi Database

```yaml
# docker-compose.yml
volumes:
  mysql-data:
    driver: local   # Data disimpan di /var/lib/docker/volumes/

services:
  database:
    volumes:
      - mysql-data:/var/lib/mysql  # Mount volume ke path data MySQL
```

**Cara kerja:** Data MySQL tersimpan di volume yang dikelola Docker, bukan di dalam layer container. Saat container dihapus, volume tetap ada.

### 2b. Bind Mount — Shared Logs Real-Time

```yaml
# Konfigurasi IDENTIK di dua container
services:
  api-engine:
    volumes:
      - ./logs:/app/logs   # Bind Mount: folder host → container

  web-server:
    volumes:
      - ./logs:/app/logs   # MOUNT YANG SAMA — file langsung sinkron
```

### Bukti Real-Time Update (Tanpa Restart)

```bash
# Terminal 1 — pantau perubahan dari host
tail -f ./logs/audit.log

# Terminal 2 — tulis dari HOST langsung
echo "AUDIT TEST dari host - $(date)" >> ./logs/audit.log

# Terminal 3 — cek dari dalam api-engine
docker exec api-engine tail -3 /app/logs/audit.log

# Terminal 4 — cek dari dalam web-server
docker exec web-server tail -3 /app/logs/audit.log

# Semua terminal menampilkan baris yang SAMA — tidak ada restart!
```

**Contoh isi `./logs/audit.log` (3 sumber berbeda, 1 file):**

```log
[2026-04-24T07:56:19.563Z] GET /health              ← ditulis api-engine (Express middleware)
172.20.0.1 - [24/Apr/2026] "GET /health" 200        ← ditulis web-server (Nginx access_log)
AUDIT TEST dari host - Fri Apr 24 02:56:55 PM       ← ditulis langsung dari HOST
```

> **✅ Bukti:** Tiga entitas berbeda (api-engine, web-server, host) menulis ke file yang sama secara real-time — tidak ada restart container.

---

## 🐳 Soal 3 — Implementasi Docker Compose (Skor: 30)

### Struktur File Environment (`.env`)

```bash
# .env — Jangan commit file ini ke Git!
MYSQL_ROOT_PASSWORD=RahasiaKuat123!
MYSQL_DATABASE=logistik_db
MYSQL_USER=app_user
MYSQL_PASSWORD=AppPass456!
DB_HOST=database
DB_PORT=3306
```

> **🔒 Keamanan:** File `.env` sudah didaftarkan di `.gitignore` agar kredensial tidak terupload ke repositori.

### `docker-compose.yml` — Anotasi Lengkap

```yaml
services:

  # ─────────────────────────────────────────
  # KOMPONEN 1: Web Server (Nginx)
  # ─────────────────────────────────────────
  web-server:
    image: nginx:alpine
    container_name: web-server
    ports:
      - "80:80"           # Satu-satunya container yang expose ke publik
    mem_limit: 256m       # ← Resource limit: max RAM 256 MB
    cpus: "0.5"           # ← Resource limit: max 50% 1 CPU core
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro  # Config read-only
      - ./logs:/app/logs                              # Bind Mount shared logs
    networks:
      - frontend-net      # Hanya di zone publik
    depends_on:
      - api-engine
    restart: unless-stopped

  # ─────────────────────────────────────────
  # KOMPONEN 2: API Engine (Node.js)
  # ─────────────────────────────────────────
  api-engine:
    build: ./api
    container_name: api-engine
    mem_limit: 512m       # ← Resource limit: max RAM 512 MB
    cpus: "1.0"           # ← Resource limit: max 1 CPU core penuh
    expose:
      - "3000"            # Internal only — tidak expose ke host
    environment:
      DB_HOST: ${DB_HOST}           # ← Dari .env (tidak hardcode!)
      DB_PORT: ${DB_PORT}           # ← Dari .env
      DB_NAME: ${MYSQL_DATABASE}    # ← Dari .env
      DB_USER: ${MYSQL_USER}        # ← Dari .env
      DB_PASS: ${MYSQL_PASSWORD}    # ← Dari .env
    volumes:
      - ./logs:/app/logs  # Bind Mount shared logs (sama dengan web-server)
    networks:
      - frontend-net      # Terima request dari web-server
      - backend-net       # Akses ke database — satu-satunya jembatan
    depends_on:
      database:
        condition: service_healthy  # Tunggu MySQL benar-benar siap
    restart: unless-stopped

  # ─────────────────────────────────────────
  # KOMPONEN 3: Database (MySQL)
  # ─────────────────────────────────────────
  database:
    image: mysql:8.0
    container_name: database
    mem_limit: 1g         # ← Resource limit: max RAM 1 GB
    cpus: "1.5"           # ← Resource limit: max 1.5 CPU core
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql   # Docker Volume — data persisten
    networks:
      - backend-net       # HANYA di zone internal — tidak bisa diakses publik
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost",
             "-uroot", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s       # Cek setiap 10 detik
      timeout: 5s         # Timeout 5 detik
      retries: 5          # Coba 5x sebelum dianggap unhealthy
    restart: unless-stopped

# ─────────────────────────────────────────
# VOLUME — Docker Managed Storage
# ─────────────────────────────────────────
volumes:
  mysql-data:
    driver: local         # Disimpan di /var/lib/docker/volumes/

# ─────────────────────────────────────────
# NETWORK — Isolasi Zona
# ─────────────────────────────────────────
networks:
  frontend-net:
    driver: bridge        # Publik — container bisa akses internet
  backend-net:
    driver: bridge
    internal: true        # ⛔ INTERNAL — tidak ada akses ke internet
```

### Tabel Limitasi Resource

| Container | `mem_limit` | `cpus` | Alasan |
|-----------|-------------|--------|--------|
| `web-server` | 256 MB | 0.5 core | Nginx sangat efisien sebagai reverse proxy — tidak butuh resource besar |
| `api-engine` | 512 MB | 1.0 core | Node.js butuh RAM lebih untuk event loop, koneksi DB pool, dan request handling |
| `database` | 1 GB | 1.5 core | MySQL butuh resource terbesar untuk query engine, InnoDB buffer pool, dan caching |

---

## 🔍 Soal 4 — Uji Penetrasi & Troubleshooting (Skor: 20)

### Uji 1 — Isolasi Network: web-server ❌ database

**Tujuan:** Membuktikan `web-server` tidak bisa menjangkau `database` karena berada di network berbeda.

```bash
# Masuk ke container web-server
docker exec -it web-server sh

# Coba ping ke database — HARUS GAGAL
ping database
# ❌ Output: ping: bad address 'database'

# Coba nslookup — HARUS GAGAL
nslookup database
# ❌ Output: ** server can't find database: NXDOMAIN
# Hostname 'database' tidak dikenal di frontend-net

exit
```

```bash
# Sebagai perbandingan — api-engine BISA ping database
docker exec -it api-engine sh

ping database
# ✅ Output: PING database (172.x.x.x): 56 data bytes
#           64 bytes from 172.x.x.x: seq=0 ttl=64 time=0.xxx ms
# api-engine berhasil karena berada di backend-net yang sama

exit
```

**Diagram aliran komunikasi:**

```
Internet → web-server ──[frontend-net]──► api-engine ──[backend-net]──► database
                                                │
                     web-server                 │
                     ❌ TIDAK BISA              │
                     langsung ke database       │
                     (beda network)             │
```

---

### Uji 2 — Disaster Recovery: Data Tetap Ada Setelah Container Dihapus

**Skenario:** Container database dihapus paksa, dibuat ulang, data lama harus tetap ada.

#### Fase 1 — Siapkan Data Sebelum "Bencana"

```bash
# Masuk ke MySQL dan insert data pengujian
docker exec -it database \
  mysql -u app_user -pAppPass456! logistik_db

-- Buat tabel dan isi data
CREATE TABLE IF NOT EXISTS transaksi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  keterangan VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO transaksi (keterangan) VALUES ('Pengiriman Jakarta-Surabaya');
INSERT INTO transaksi (keterangan) VALUES ('Pengiriman Bandung-Bali');
INSERT INTO transaksi (keterangan) VALUES ('Pengiriman Medan-Makassar');

SELECT * FROM transaksi;
-- +----+------------------------------+---------------------+
-- |  1 | Pengiriman Jakarta-Surabaya  | 2026-04-24 07:56:19 |
-- |  2 | Pengiriman Bandung-Bali      | 2026-04-24 07:56:20 |
-- |  3 | Pengiriman Medan-Makassar    | 2026-04-24 07:56:21 |
-- +----+------------------------------+---------------------+
EXIT;
```

#### Fase 2 — Simulasi Bencana (Hapus Container)

```bash
# Hentikan dan HAPUS container database
docker compose stop database
docker compose rm -f database

# Verifikasi container sudah hilang
docker ps -a | grep database
# (kosong) ← container benar-benar sudah terhapus

# Tapi volume MASIH ADA!
docker volume ls | grep mysql-data
# local   docker-logistik_mysql-data  ← volume tetap ada ✅
```

#### Fase 3 — Recovery (Buat Ulang Container)

```bash
# Buat ulang container database dari nol
docker compose up -d database

# Tunggu healthcheck selesai
watch docker compose ps database
# Tunggu status: healthy ✅
```

#### Fase 4 — Verifikasi Data Selamat

```bash
docker exec -it database \
  mysql -u app_user -pAppPass456! logistik_db

SELECT * FROM transaksi;
-- +----+------------------------------+---------------------+
-- |  1 | Pengiriman Jakarta-Surabaya  | 2026-04-24 07:56:19 |  ← MASIH ADA ✅
-- |  2 | Pengiriman Bandung-Bali      | 2026-04-24 07:56:20 |  ← MASIH ADA ✅
-- |  3 | Pengiriman Medan-Makassar    | 2026-04-24 07:56:21 |  ← MASIH ADA ✅
-- +----+------------------------------+---------------------+
-- DATA BERHASIL DIPULIHKAN! 🎉
EXIT;
```

> **💡 Kenapa data selamat?**  
> Docker Volume (`mysql-data`) adalah entitas **terpisah** dari container. Menghapus container hanya menghapus lapisan container-nya — volume tetap utuh di `/var/lib/docker/volumes/`. Saat container baru dibuat dengan volume yang sama, MySQL langsung menemukan dan membaca data lama.

---

## 🚀 Cara Menjalankan

### Prasyarat

- Docker Engine ≥ 24.x
- Docker Compose v2

### Langkah

```bash
# 1. Clone repositori
git clone https://github.com/<username>/docker-logistik.git
cd docker-logistik

# 2. Salin file environment dan sesuaikan
cp .env.example .env
# Edit .env dengan kredensial yang diinginkan

# 3. Buat folder logs jika belum ada
mkdir -p logs

# 4. Jalankan semua layanan
docker compose up -d

# 5. Cek status semua container
docker compose ps

# 6. Test API
curl http://localhost/health
# {"status":"ok","time":"..."}

curl http://localhost/api/transaksi
# [...]

# 7. Hentikan semua container (data tetap aman)
docker compose down
```

---

## 📁 Struktur Proyek

```
docker-logistik/
├── .env                    ← Kredensial database (jangan commit!)
├── .gitignore              ← Mengabaikan .env dan file sensitif
├── docker-compose.yml      ← Orkestrasi semua layanan
│
├── api/                    ← API Engine (Node.js + Express)
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── index.js            ← Entry point + audit log middleware
│   └── routes/
│       └── transaksi.js    ← CRUD transaksi ke MySQL
│
├── nginx/                  ← Web Server (Nginx)
│   └── nginx.conf          ← Reverse proxy ke api-engine:3000
│
└── logs/                   ← Shared Bind Mount (host ↔ 2 container)
    ├── audit.log           ← Request log dari api-engine + Nginx
    └── app.log             ← Error log Nginx
```

---

## 📊 Ringkasan Implementasi

| Kebijakan Keamanan | Solusi | Status |
|---|---|---|
| Database tidak bisa diakses dari luar | `backend-net` dengan `internal: true` | ✅ |
| Data transaksi persisten meski container dihapus | Docker Volume `mysql-data` | ✅ |
| Shared folder logs antara API & Web Server | Bind Mount `./logs:/app/logs` | ✅ |
| Kredensial tidak hardcode di YAML | File `.env` terpisah | ✅ |
| Resource tidak saling berebut | `mem_limit` + `cpus` per container | ✅ |

---

<div align="center">

*UTS Cloud Computing — Docker Network · Volume · Bind Mount · Compose*

</div>
