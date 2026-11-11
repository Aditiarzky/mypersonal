# Dokumentasi API

REST API portfolio dibangun dengan Hono dan berjalan sebagai Cloudflare Worker. Base URL lokal biasanya `http://localhost:8787`; gunakan URL Worker yang dikonfigurasi setelah deploy. Semua payload dan respons memakai JSON, kecuali `DELETE` proyek berhasil yang mengembalikan `204 No Content`.

## Autentikasi dan CORS

Sesi menggunakan cookie bertanda tangan `portfolio_session` dengan atribut HttpOnly dan masa berlaku 8 jam. Kirim request browser dengan `credentials: 'include'`. Endpoint tulis proyek memerlukan sesi. `FRONTEND_ORIGIN` wajib diatur untuk request browser yang mengirim header `Origin`; request non-browser seperti HTTPyac dapat menghilangkan header tersebut. Request yang mengubah state dengan Origin selain konfigurasi akan ditolak (`403 invalid_origin`).

## Endpoint

### Status

| Method | Path | Auth | Keterangan |
| --- | --- | --- | --- |
| GET | `/api/health` | Publik | Pemeriksaan Worker; respons `{"success":true,"data":{"status":"ok"}}`. |

### Terjemahan

| Method | Path | Auth | Keterangan |
| --- | --- | --- | --- |
| POST | `/api/translate` | Publik; wajib Origin frontend | Menerjemahkan batch teks dari bahasa Indonesia ke Inggris menggunakan Cloudflare Workers AI. Dipanggil hanya setelah pengguna memilih bahasa Inggris. |

Body berisi `texts`, array 1–40 string; tiap teks maksimum 2.000 karakter dan total batch maksimum 12.000 karakter. Hasil `translations` memiliki urutan yang sama dengan input. Konten dikirim ke model instruksi Cloudflare `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, yang diminta mempertahankan nama orang/tempat, organisasi, merek, aplikasi, produk, nama proyek, URL, akronim, dan istilah teknologi persis seperti sumbernya. Model ini tercantum aktif di katalog Cloudflare, mendukung JSON Mode, dan mendukung zero data retention. Request dibatasi 10 kali per menit per IP dan per lokasi Cloudflare.

```json
{"texts":["Pengembang Web","Membangun aplikasi yang bermanfaat."]}
```

Berhasil: `200 {"success":true,"data":{"translations":["Web Developer","Building useful applications."]}}`. Origin yang tidak cocok menghasilkan `403 invalid_origin`, body tidak valid `400 invalid_request`, batas laju terlampaui `429 rate_limited`, dan kegagalan model `500 internal_server_error`.

### Autentikasi

| Method | Path | Auth | Keterangan |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Publik | Memvalidasi kredensial dan mengatur cookie sesi. |
| GET | `/api/auth/session` | Sesi | Mengembalikan user sesi aktif. |
| POST | `/api/auth/logout` | Publik | Menghapus cookie sesi; aman dipanggil tanpa sesi. |

Login menerima `email` string (maksimum 150 karakter) dan `password` string (1–1024 byte).

```json
{"email":"admin@example.com","password":"your-password"}
```

Berhasil: `200 {"success":true,"data":{"user":{"id":1,"email":"admin@example.com","name":"Admin"}}}`. Session mengembalikan bentuk yang sama. Logout mengembalikan `200 {"success":true,"data":{"loggedOut":true}}`.

### Proyek dan relasi skills

| Method | Path | Auth | Keterangan |
| --- | --- | --- | --- |
| GET | `/api/projects` | Publik | Daftar proyek; setiap proyek memuat `skills`. |
| GET | `/api/projects/:slug` | Publik | Detail proyek berdasarkan slug. |
| POST | `/api/projects` | Sesi | Membuat proyek beserta relasi skills. |
| PATCH | `/api/projects/:id` | Sesi | Mengubah field yang dikirim dan opsional mengganti relasi skills. |
| DELETE | `/api/projects/:id` | Sesi | Menghapus proyek dan relasinya. |

Objek proyek memiliki `id`, `title`, `slug`, `description`, `thumbnailUrl`, `images`, `demoUrl`, `sourceCodeUrl`, `orderPosition`, `createdAt`, dan `skills`. `images` berupa array URL string atau `null`; URL dapat berupa `null`; `skills` berisi objek `{id, name, category, iconUrl}`. Respons sukses memakai envelope `{success: true, data: ...}`; GET mengembalikan project atau array project di dalam `data`.

Contoh `POST /api/projects`:

```json
{
  "title": "Portfolio API",
  "slug": "portfolio-api",
  "description": "REST API untuk portfolio.",
  "thumbnailUrl": null,
  "images": ["https://example.com/shot-1.png", "https://example.com/shot-2.png"],
  "demoUrl": "https://example.com",
  "sourceCodeUrl": "https://github.com/example/portfolio",
  "orderPosition": 0,
  "skillIds": [1, 2]
}
```

Create mengembalikan `201 {"success":true,"data": project}`. PATCH menerima satu atau lebih field yang sama; body kosong atau field tak dikenal ditolak. `images` dapat dikirim sebagai array URL atau `null`; PATCH tanpa field `images` menjaga nilai saat ini. `skillIds` yang tidak dikirim menjaga relasi saat ini; `[]` menghapus semua relasi. ID skill yang tak dikenal ditolak. PATCH sukses mengembalikan `200 {"success":true,"data": project}`; DELETE sukses mengembalikan `204` tanpa body.

## Error

| Status | `error` | Kondisi |
| --- | --- | --- |
| 400 | `invalid_request` | Body atau field tidak valid. |
| 400 | `invalid_project_id` | ID proyek bukan bilangan bulat positif. |
| 400 | `unknown_skill_ids` | ID skill tidak ditemukan; respons menyertakan `skillIds`. |
| 401 | `invalid_credentials` | Email/password login salah. |
| 401 | `unauthorized` | Endpoint sesi/tulis proyek memerlukan sesi valid. |
| 403 | `invalid_origin` | Origin request tulis tidak sama dengan `FRONTEND_ORIGIN`. |
| 404 | `project_not_found` | Slug atau ID proyek tidak ditemukan. |
| 404 | `not_found` | Route tidak tersedia. |
| 409 | `slug_conflict` | Slug proyek sudah digunakan. |
| 429 | `rate_limited` | Batas request terjemahan per IP terlampaui. |
| 500 | `internal_server_error` | Terjadi kegagalan server. |

## Pemeliharaan

Setiap penambahan, penghapusan, atau perubahan route wajib diikuti pembaruan dokumen ini pada perubahan yang sama. Catat method, path, autentikasi, validasi payload, bentuk respons sukses, dan error/status yang relevan. Periksa `apps/api/src/app.ts` serta route di `apps/api/src/presentation/http/routes/` agar dokumentasi selalu mencerminkan route yang terpasang.


## Contoh implementasi

Gunakan helper terpusat `successResponse` dan `errorResponse` dari `apps/api/src/presentation/http/api-response.ts` pada route atau middleware baru:

```ts
import { errorResponse, successResponse } from '../api-response';

routes.get('/:id', async (c) => {
  const item = await repository.findById(c.req.param('id'));
  if (!item) return errorResponse(c, 'item_not_found', 404);
  return successResponse(c, item, 200, 'Item ditemukan.');
});
```

Dengan begitu perubahan format envelope dapat dilakukan terpusat pada utility tersebut.


## Skills CRUD


`/api/skills` ditangani secara khusus oleh `apps/api/src/presentation/http/routes/skill.routes.ts` dan dipasang langsung dari composition root `apps/api/src/app.ts`.

- `GET /api/skills` dan `GET /api/skills/:id` dapat diakses publik.
- `POST /api/skills`, `PATCH /api/skills/:id`, dan `DELETE /api/skills/:id` memerlukan sesi.
- Create wajib berisi `name` dan `category` (masing-masing 1�50 karakter); `iconUrl` opsional dan dapat `null` atau URL HTTP/HTTPS.
- PATCH menerima satu atau lebih dari `name`, `category`, dan `iconUrl`. Field yang tidak dikirim tidak berubah.
- GET mengembalikan `{success:true,data:...}`; POST mengembalikan `201`; PATCH mengembalikan `200`; DELETE mengembalikan `204` tanpa body. ID tidak valid menghasilkan `400 invalid_id`, payload tidak valid `400 invalid_request`, dan skill tidak ditemukan `404 skill_not_found`.
- Menghapus skill juga menghapus baris terkait pada `project_skills` dan `experience_skills`, sehingga proyek dan pengalaman tetap ada dan tidak lagi memuat skill tersebut.

Contoh create:

```json
{"name":"SvelteKit","category":"Frontend","iconUrl":"https://example.com/svelte.svg"}
```


## Profiles CRUD

`/api/profiles` memakai repository D1 dan service tersendiri. GET publik; POST, PATCH, dan DELETE memerlukan sesi.

| Method | Path | Hasil |
| --- | --- | --- |
| GET | `/api/profiles` | Daftar profile dengan `socialLinks`. |
| GET | `/api/profiles/:id` | Detail profile dan `socialLinks`; `404 profile_not_found` jika tidak ada. |
| POST | `/api/profiles` | Membuat profile; sukses `201`. `userId`, `name`, `title`, dan `bio` wajib. |
| PATCH | `/api/profiles/:id` | Mengubah field yang dikirim; field lain tetap. |
| DELETE | `/api/profiles/:id` | Menghapus profile dan social links terkait; sukses `204` tanpa body. |

Payload create:

```json
{
  "userId": 1,
  "name": "Jane Doe",
  "title": "Full Stack Developer",
  "bio": "Membangun aplikasi web.",
  "avatarUrl": null,
  "cvUrl": null,
  "location": "Jakarta"
}
```

`userId` harus merujuk ke user yang ada dan hanya boleh dipakai satu profile. `name` dan `title` masing-masing menerima 1–100 karakter. User tidak ditemukan menghasilkan `404 user_not_found`; `userId` duplikat menghasilkan `409 profile_user_conflict`. `avatarUrl` dan `cvUrl` menerima `null` atau URL HTTP/HTTPS; `location` nullable. Setiap item respons profile menyertakan `socialLinks`, yang berisi data dari endpoint `/api/social-links`. Migrasi mengisi `name` profile lama dari nama user terkait.

## Form kontak

Form kontak frontend menggunakan skema `mailto:` dan tidak memanggil API email. Saat pengunjung menekan tombol kirim, aplikasi email perangkat dibuka dengan penerima `aditiarizkyutama@gmail.com`, subjek, nama, email balasan, dan isi pesan yang sudah diisi. Pengunjung perlu meninjau lalu menekan tombol kirim di aplikasi emailnya; situs tidak dapat memastikan email benar-benar dikirim. Fitur ini tidak memerlukan provider email, API key, atau endpoint backend.

## Social links CRUD

`/api/social-links` mengelola baris tabel `social_links`. GET bersifat publik; POST, PATCH, dan DELETE memerlukan sesi yang valid.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/social-links` | Daftar social link. |
| GET | `/api/social-links/:id` | Detail social link; `404 social_link_not_found` jika tidak ditemukan. |
| POST | `/api/social-links` | Membuat social link; sukses `201`. |
| PATCH | `/api/social-links/:id` | Memperbarui field yang dikirim; field yang tidak dikirim tetap. |
| DELETE | `/api/social-links/:id` | Menghapus social link; sukses `204` tanpa body. |

Create menerima `profileId`, `platform` (1�50 karakter), dan `url` HTTP/HTTPS (maksimal 2.000 karakter). Profile yang dirujuk harus ada; jika tidak, API mengembalikan `404 profile_not_found`. Contoh:

```json
{"profileId":1,"platform":"GitHub","url":"https://github.com/example"}
```



## Project skills

Relasi `project_skills` dikelola di bawah route proyek karena tabel tersebut memakai composite key (`project_id`, `skill_id`) tanpa ID atau field lain untuk diubah. GET publik; perubahan relasi memerlukan sesi.

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/api/projects/:projectId/skills` | Daftar skill proyek; `404 project_not_found` jika project tidak ada. |
| POST | `/api/projects/:projectId/skills` | Tambahkan relasi dengan body `{"skillId":1}`; sukses `201`. |
| DELETE | `/api/projects/:projectId/skills/:skillId` | Lepas relasi; sukses `204` tanpa body. |

Project/skill yang tidak ditemukan menghasilkan `404 project_not_found` atau `404 skill_not_found`; relasi yang sudah ada menghasilkan `409 project_skill_conflict`. Penghapusan skill lewat `/api/skills/:id` juga menghapus seluruh relasi project-skill terkait. Project CRUD tetap menerima `skillIds` untuk membuat atau mengganti seluruh daftar relasi sekaligus.

## Experiences CRUD

GET publik; POST, PATCH, dan DELETE memerlukan sesi.

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/api/experiences` | Daftar pengalaman beserta `skills`, terbaru berdasarkan `startDate` lebih dulu. |
| GET | `/api/experiences/:id` | Detail pengalaman beserta `skills`; `404 experience_not_found` jika tidak ada. |
| POST | `/api/experiences` | Membuat pengalaman; sukses `201`. `companyName`, `role`, dan `startDate` wajib. `skillIds` opsional. |
| PATCH | `/api/experiences/:id` | Mengubah field yang dikirim; field yang tidak dikirim tetap. `skillIds` dapat mengganti seluruh relasi. |
| DELETE | `/api/experiences/:id` | Menghapus pengalaman; sukses `204` tanpa body. |

`startDate` dan `endDate` memakai format `YYYY-MM-DD`; `endDate` nullable dan tidak boleh mendahului `startDate`. `description` juga nullable. `skillIds` berupa array ID skill yang sudah ada; saat tidak dikirim pada create, pengalaman dibuat tanpa skill, sedangkan PATCH tanpa field `skillIds` mempertahankan relasi yang ada. Kirim `[]` untuk menghapus semua relasi. ID yang tidak ditemukan menghasilkan `400 unknown_skill_ids` dengan `details.skillIds`. Contoh:

```json
{
  "companyName": "Example Studio",
  "role": "Software Engineer",
  "startDate": "2024-01-01",
  "endDate": null,
  "description": "Membangun aplikasi web.",
  "skillIds": [1, 2]
}
```
