# Dokumentasi API

REST API portfolio dibangun dengan Hono dan berjalan sebagai Cloudflare Worker. Base URL lokal biasanya `http://localhost:8787`; gunakan URL Worker yang dikonfigurasi setelah deploy. Semua payload dan respons memakai JSON, kecuali `DELETE` proyek berhasil yang mengembalikan `204 No Content`.

## Autentikasi dan CORS

Sesi menggunakan cookie bertanda tangan `portfolio_session` dengan atribut HttpOnly dan masa berlaku 8 jam. Kirim request browser dengan `credentials: 'include'`. Endpoint tulis proyek memerlukan sesi. `FRONTEND_ORIGIN` wajib diatur untuk request browser yang mengirim header `Origin`; request non-browser seperti HTTPyac dapat menghilangkan header tersebut. Request yang mengubah state dengan Origin selain konfigurasi akan ditolak (`403 invalid_origin`).

## Endpoint

### Status

| Method | Path | Auth | Keterangan |
| --- | --- | --- | --- |
| GET | `/api/health` | Publik | Pemeriksaan Worker; respons `{"success":true,"data":{"status":"ok"}}`. |

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

Objek proyek memiliki `id`, `title`, `slug`, `description`, `thumbnailUrl`, `demoUrl`, `sourceCodeUrl`, `orderPosition`, `createdAt`, dan `skills`. URL dapat berupa `null`; `skills` berisi objek `{id, name, category, iconUrl}`. Respons sukses memakai envelope `{success: true, data: ...}`; GET mengembalikan project atau array project di dalam `data`.

Contoh `POST /api/projects`:

```json
{
  "title": "Portfolio API",
  "slug": "portfolio-api",
  "description": "REST API untuk portfolio.",
  "thumbnailUrl": null,
  "demoUrl": "https://example.com",
  "sourceCodeUrl": "https://github.com/example/portfolio",
  "orderPosition": 0,
  "skillIds": [1, 2]
}
```

Create mengembalikan `201 {"success":true,"data": project}`. PATCH menerima satu atau lebih field yang sama; body kosong atau field tak dikenal ditolak. `skillIds` yang tidak dikirim menjaga relasi saat ini; `[]` menghapus semua relasi. ID skill yang tak dikenal ditolak. PATCH sukses mengembalikan `200 {"success":true,"data": project}`; DELETE sukses mengembalikan `204` tanpa body.

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
