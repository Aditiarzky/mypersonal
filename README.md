# Personal Portfolio

Monorepo untuk web portfolio pribadi. Frontend menggunakan SvelteKit, REST API menggunakan Hono di Cloudflare Workers, dan database menggunakan Cloudflare D1 (SQLite). Bun dipakai untuk package manager dan menjalankan script workspace.

## Struktur

```text
.
├── apps/
│   ├── web/                 # SvelteKit frontend
│   │   ├── src/routes/      # Halaman dan route SvelteKit
│   │   ├── src/lib/         # Komponen dan utilitas bersama
│   │   └── static/          # File statis
│   └── api/                 # Hono Worker
│       ├── src/index.ts     # App Hono dan endpoint API
│       └── migrations/      # Migrasi SQL D1
├── REQUIREMENT.md           # Kebutuhan dan skema sistem
├── package.json             # Bun workspace dan perintah root
└── bun.lock                 # Lockfile dependensi
```

## Prasyarat

- Bun `1.4.4` (lihat nilai `packageManager` di `package.json`).
- Akun Cloudflare diperlukan untuk deploy Pages/Worker dan migrasi D1 remote.
- Login Wrangler diperlukan sebelum mengakses resource Cloudflare: `bunx wrangler login`.

## Instalasi awal

Jalankan dari direktori root repository:

```sh
bun install
```

Bun menginstal dependensi kedua workspace dan menggunakan `bun.lock` untuk versi yang terkunci. Setelah dependency berubah, commit perubahan `bun.lock` bersama `package.json` terkait.

## Menjalankan untuk development

Frontend dan API berjalan sebagai proses terpisah. Buka dua terminal dari root repository:

```sh
bun run dev:web
```

Frontend Vite/SvelteKit tersedia di `http://localhost:5173`.

```sh
bun run dev:api
```

Wrangler menjalankan Worker secara lokal, biasanya di `http://localhost:8787`. Endpoint awal yang tersedia:

- `GET /` — pesan status API.
- `GET /api/health` — JSON `{ "status": "ok" }`.

Saat frontend mulai memanggil API dari browser, gunakan origin API lokal tersebut dan tambahkan konfigurasi CORS yang sesuai pada Hono bila diperlukan. Saat ini belum ada client API atau konfigurasi CORS khusus.

## Database D1

Binding pada Worker bernama `portfoliod1` dan database dikonfigurasi di `apps/api/wrangler.jsonc`. Berkas `apps/api/migrations/0001_initial_schema.sql` membuat tabel sesuai skema di `REQUIREMENT.md`.

Untuk menyiapkan database lokal sebelum mengembangkan fitur yang memakai data:

```sh
bun run db:migrate:local
```

Perintah ini menjalankan migrasi melalui Wrangler dengan mode `--local`; data lokal dikelola Wrangler dan tidak mengubah database Cloudflare remote. Endpoint health saat ini tidak membutuhkan database.

Untuk menerapkan migrasi pada database Cloudflare remote, pastikan sudah login, periksa target database di `apps/api/wrangler.jsonc`, lalu jalankan:

```sh
bun run --filter api db:migrate:remote
```

Perintah remote mengubah skema database Cloudflare. Tinjau SQL migrasi dan pastikan akun serta target database benar sebelum menjalankannya.

## Pemeriksaan dan build

```sh
bun run check:web       # Pemeriksaan Svelte dan TypeScript
bun run check:api       # TypeScript API
bun run build:web       # Build SvelteKit untuk Cloudflare Pages
```

Untuk menjalankan hasil build di runtime Pages lokal, build terlebih dahulu lalu jalankan Wrangler Pages dev:

```sh
bun run build:web
bunx wrangler pages dev apps/web/.svelte-kit/cloudflare
```

### Deploy frontend ke Cloudflare Pages

Frontend menggunakan `@sveltejs/adapter-cloudflare`. Untuk monorepo ini, konfigurasi Pages dengan repository root sebagai root directory agar Bun workspace di root digunakan. Pada pengaturan build Pages, gunakan:

| Pengaturan | Nilai |
| --- | --- |
| Root directory | Root repository (default) |
| Build command | `bun run build:web` |
| Build output directory | `apps/web/.svelte-kit/cloudflare` |
| Production branch | Branch produksi repository |

Cloudflare Pages menyediakan Bun 1.4.4, sesuai `packageManager` di root `package.json`. Dengan Git integration, Pages membangun ulang dan menerbitkan commit pada branch yang dikonfigurasi; perubahan pada branch lain dapat dipakai untuk preview deployment. Lihat [panduan SvelteKit Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-kit-site/) dan [konfigurasi monorepo Pages](https://developers.cloudflare.com/pages/configuration/monorepos/).

Untuk deploy manual/direct upload, login Wrangler dan buat project Pages melalui dashboard terlebih dahulu, lalu jalankan dari root:

```sh
bunx wrangler login
bun run build:web
bunx wrangler pages deploy apps/web/.svelte-kit/cloudflare --project-name=YOUR_PAGES_PROJECT_NAME
```

Ganti `YOUR_PAGES_PROJECT_NAME` dengan nama Pages project yang sudah dibuat. Git integration cocok untuk deploy otomatis dari repository; direct upload cocok untuk deploy manual. Perhatian: project Pages yang dibuat sebagai Direct Upload tidak dapat dialihkan ke Git integration; buat project baru bila ingin mengganti metode tersebut. Lihat [panduan Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

### Deploy API ke Cloudflare Workers

API adalah Worker terpisah dari frontend Pages. Setelah login dan konfigurasi D1 siap:

```sh
bunx wrangler login
bun run --filter api db:migrate:remote
bun run --filter api deploy
```

Migrasi remote mengubah skema database Cloudflare. Tinjau migrasi dan pastikan database target sudah benar sebelum menjalankannya.
## Alur perubahan skema

1. Ubah kebutuhan data di `REQUIREMENT.md` bila perubahan memengaruhi model sistem.
2. Buat migrasi baru bernomor berikutnya di `apps/api/migrations/` (jangan mengedit migrasi yang sudah diterapkan pada remote).
3. Terapkan dan periksa migrasi lokal dengan `bun run db:migrate:local`.
4. Jalankan pemeriksaan frontend/API yang sesuai.
5. Terapkan ke remote hanya setelah meninjau migrasi dan memastikan database target.

## Konfigurasi dan keamanan

Jangan commit token Cloudflare, kredensial, atau rahasia. Gunakan `wrangler secret` untuk secret Worker. File `.env` diabaikan Git; dokumentasikan nama variabel yang diperlukan dan berikan contoh tanpa nilai rahasia bila konfigurasi environment ditambahkan. Jangan menyimpan password dalam bentuk teks biasa saat implementasi autentikasi; kebijakan hashing perlu ditetapkan sebelum endpoint autentikasi dibuat.

## Referensi

- [SvelteKit](https://svelte.dev/docs/kit)
- [Hono](https://hono.dev/docs/)
- [Cloudflare Workers dan Wrangler](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)



