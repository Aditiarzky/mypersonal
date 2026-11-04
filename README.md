# Personal Portfolio

Monorepo portfolio dengan SvelteKit di Cloudflare Pages, Hono REST API di Cloudflare Workers, D1 (SQLite), dan Bun workspaces.

## Struktur proyek

```text
apps/
+-- web/                         # SvelteKit frontend untuk Pages
+-- api/
    +-- migrations/               # Migrasi SQL D1
    +-- scripts/seed-admin.ts     # CLI seed admin via Wrangler
    +-- src/
        +-- application/auth/     # Use case autentikasi
        +-- application/projects/ # Use case CRUD proyek
        +-- domain/auth/          # Kontrak password hasher
        +-- domain/users/         # Model dan kontrak repository user
        +-- domain/projects/     # Model dan kontrak repository proyek
        +-- infrastructure/
        |   +-- database/         # Implementasi repository D1 proyek/user
        |   +-- security/         # Implementasi hashing password
        +-- presentation/http/
        |   +-- middleware/      # Pemeriksaan sesi
        |   +-- routes/          # REST endpoint auth dan proyek
        +-- app.ts               # Composition root dan routing
        +-- index.ts             # Entry point Worker
        +-- types.ts             # Binding dan context Hono
```

### Layer backend

- **Domain** mendefinisikan user dan interface repository/password hasher tanpa bergantung pada Hono atau D1.
- **Application** memuat alur bisnis autentikasi dan memakai interface domain.
- **Infrastructure** menghubungkan interface domain ke D1 dan implementasi hashing.
- **Presentation** mengubah HTTP request/response, cookie, dan middleware menjadi pemanggilan use case.
- `src/app.ts` menyusun implementasi konkret untuk Worker; `src/index.ts` menjadi entry point Wrangler.

## Prasyarat dan instalasi

Gunakan Bun `1.4.4` sesuai `packageManager` pada root `package.json`. Dari root repository:

```sh
bun install
```

Buat file konfigurasi lokal, lalu ganti semua nilai contoh:

```sh
cp apps/api/.env.example apps/api/.env
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

- `apps/api/.env` dibaca oleh script seed Bun. Isi `ADMIN_EMAIL`, `ADMIN_PASSWORD`, dan bila perlu `ADMIN_NAME`.
- `apps/api/.dev.vars` dibaca Wrangler untuk Worker lokal. Isi `FRONTEND_ORIGIN`, `AUTH_COOKIE_SECRET` (minimal 32 byte acak), dan `COOKIE_SAME_SITE`.
- File rahasia lokal diabaikan Git. Jangan commit file `.env` atau `.dev.vars`.

## Development lokal

Jalankan dua proses dari root, masing-masing di terminal terpisah:

```sh
bun run dev:web
bun run dev:api
```

Frontend berjalan di `http://localhost:5173`; API Worker biasanya di `http://localhost:8787`. Endpoint status tersedia di `GET /api/health`.

Untuk mengakses D1 lokal, terapkan migrasi lalu seed admin:

```sh
bun run db:migrate:local
bun run seed:admin:local
```

Seed memakai `ADMIN_EMAIL` dan `ADMIN_PASSWORD` dari `apps/api/.env`. Seed bersifat **upsert**: menjalankannya lagi untuk email yang sama akan memperbarui nama dan hash password. Target default tidak pernah remote; gunakan perintah remote yang eksplisit hanya bila memang ingin mengubah Cloudflare D1.

Untuk menjalankan hasil build Pages dalam runtime lokal Cloudflare:

```sh
bun run build:web
bunx wrangler pages dev apps/web/.svelte-kit/cloudflare
```

## Autentikasi API

Endpoint awal:

| Method | Path                | Fungsi                                                       |
| ------ | ------------------- | ------------------------------------------------------------ |
| `POST` | `/api/auth/login`   | Memeriksa email/password, lalu mengatur cookie sesi HttpOnly |
| `GET`  | `/api/auth/session` | Mengembalikan user untuk sesi yang valid                     |
| `POST` | `/api/auth/logout`  | Menghapus cookie sesi                                        |

Dokumentasi lengkap request, respons, autentikasi, dan error tersedia di [`docs/API.md`](docs/API.md). Perbarui dokumen tersebut setiap kali endpoint ditambah, diubah, atau dihapus.

Login menerima JSON `{"email":"...","password":"..."}`. Password di-hash memakai PBKDF2-HMAC-SHA256 melalui Web Crypto: 600.000 iterasi, salt acak 16 byte, derived key 128 bit. Format terserialisasi panjangnya 59 karakter sehingga sesuai dengan kolom `VARCHAR(60)`. Cookie sesi bertanda tangan berlaku 8 jam dan tidak mengandung password. Endpoint sesi mengambil ulang user dari D1. Untuk fetch browser ke API, set `credentials: 'include'`; CORS mengizinkan hanya origin yang sama dengan `FRONTEND_ORIGIN`, dan request browser yang mengubah state harus memiliki Origin tersebut. Klien seperti HTTPyac yang tidak mengirim header `Origin` dapat memanggil API tanpa CORS.

Gunakan `COOKIE_SAME_SITE=Lax` untuk frontend/API yang satu site. Bila memakai domain default `*.pages.dev` dan `*.workers.dev`, keduanya lintas site: gunakan `COOKIE_SAME_SITE=None` dengan HTTPS (`Secure`) dan uji kebijakan cookie browser. Custom domain frontend dan API yang berbagi site biasanya lebih andal. Logout menghapus cookie di browser; karena sesi ditandatangani secara stateless, salinan cookie yang dicuri masih berlaku sampai masa 8 jam habis.

Saat ini tidak ada endpoint registrasi. Admin dibuat melalui seed. Skema belum memiliki kolom role, sehingga role-based authorization belum diterapkan dan semua baris user yang ada dapat login. Belum ada rate limiting login. Workers Free membatasi CPU hingga 10 ms per request; verifikasi password perlu dipantau pada runtime dan plan target. Workers Paid menyediakan default 30 detik. Jangan menurunkan jumlah iterasi tanpa mengukur keamanan dan performa terlebih dahulu. [Panduan Cloudflare CPU limits](https://developers.cloudflare.com/workers/platform/limits/) dan [rekomendasi OWASP PBKDF2](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## CRUD proyek

Route proyek dipasang pada `/api/projects`. Relasi `skills` dikirim sebagai `skillIds`; respons menyertakan array `skills` lengkap. `GET` bersifat publik. `POST`, `PATCH`, dan `DELETE` memerlukan cookie sesi yang valid.

| Method   | Path                  | Fungsi                                                                  |
| -------- | --------------------- | ----------------------------------------------------------------------- |
| `GET`    | `/api/projects`       | Daftar proyek beserta skills, urut `orderPosition` lalu tanggal terbaru |
| `GET`    | `/api/projects/:slug` | Detail proyek beserta skills                                            |
| `POST`   | `/api/projects`       | Buat proyek dan relasi skills                                           |
| `PATCH`  | `/api/projects/:id`   | Perbarui field proyek dan/atau ganti `skillIds`                         |
| `DELETE` | `/api/projects/:id`   | Hapus relasi project-skills lalu proyek                                 |

Contoh body create:

```json
{
  "title": "Portfolio API",
  "slug": "portfolio-api",
  "description": "REST API untuk portfolio.",
  "thumbnailUrl": null,
  "images": ["https://example.com/shot-1.png"],
  "demoUrl": "https://example.com",
  "sourceCodeUrl": "https://github.com/example/portfolio",
  "orderPosition": 0,
  "skillIds": [1, 2]
}
```

Untuk menghapus relasi skills saat update, kirim `"skillIds": []`. Jika `skillIds` tidak disertakan dalam PATCH, relasi saat ini dipertahankan. ID skill yang tidak ada menghasilkan `400`; slug duplikat menghasilkan `409`. Karena skema belum memiliki role, otorisasi CRUD saat ini memeriksa sesi login saja, bukan role admin.

## Migrasi dan seed D1

Binding D1 bernama `portfoliod1`, dikonfigurasi di `apps/api/wrangler.jsonc`. Migrasi skema berada di `apps/api/migrations/`.

```sh
bun run db:migrate:local
bun run seed:admin:local
```

Untuk database remote, login Wrangler terlebih dahulu dan periksa database ID pada konfigurasi:

```sh
bunx wrangler login
bun run --filter api db:migrate:remote
bun run seed:admin:remote
```

Seed remote membaca kredensial dari `.env` lokal, membuat SQL sementara di folder `.wrangler`, menjalankannya dengan Wrangler, lalu menghapus file sementara. Perintah migrasi dan seed remote mengubah data/schema Cloudflare; pastikan akun dan targetnya benar sebelum menjalankan.

## sync data lokal ke production

# 1. Backup production terlebih dahulu

bunx wrangler d1 export portfoliod1 --remote --output .\production-backup.sql --config .\apps\api\wrangler.jsonc

# 2. Pastikan skema production sudah mengikuti migrasi terbaru

bun run --filter api db:migrate:remote

# 3. Ekspor data lokal saja, tanpa skema

bunx wrangler d1 export portfoliod1 --local --no-schema --output .\local-data.sql --config .\apps\api\wrangler.jsonc

# 4. Masukkan data ke production

bunx wrangler d1 execute portfoliod1 --remote --file .\local-data.sql --config .\apps\api\wrangler.jsonc

## Pemeriksaan dan deployment

```sh
bun run check:web
bun run check:api
bun run build:web
```

Untuk deploy frontend melalui Pages Git integration, atur root directory repository, build command `bun run build:web`, dan output directory `apps/web/.svelte-kit/cloudflare`. Alternatif direct upload setelah project Pages dibuat:

```sh
bun run build:web
bunx wrangler pages deploy apps/web/.svelte-kit/cloudflare --project-name=YOUR_PAGES_PROJECT_NAME
```

API adalah Worker terpisah. Atur `FRONTEND_ORIGIN` ke origin Pages yang tepat dan `COOKIE_SAME_SITE` sesuai domain pada Worker Variables. Simpan `AUTH_COOKIE_SECRET` sebagai secret, bukan variable biasa:

```sh
bunx wrangler secret put AUTH_COOKIE_SECRET --config apps/api/wrangler.jsonc
```

Kemudian deploy Worker:

```sh
bun run --filter api deploy
```

Jangan letakkan `AUTH_COOKIE_SECRET`, `ADMIN_PASSWORD`, atau token Cloudflare di `vars`, source code, maupun repository. Gunakan Cloudflare secrets untuk secret runtime. Jika frontend mulai mengakses route API baru, pastikan route berada di bawah middleware CORS/origin yang sesuai.

## Alur perubahan database

Tambahkan migrasi bernomor baru di `apps/api/migrations/`; jangan mengubah migrasi yang sudah diterapkan pada remote. Uji dengan D1 lokal, jalankan `bun run check:api`, lalu terapkan remote setelah SQL ditinjau.

## Referensi

- [SvelteKit dan Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-kit-site/)
- [Hono cookie helper](https://hono.dev/docs/helpers/cookie)
- [Hono CORS middleware](https://hono.dev/docs/middleware/builtin/cors)
- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
