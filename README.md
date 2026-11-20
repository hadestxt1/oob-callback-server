# OOB Callback Server

Server callback kecil tanpa dependensi, buat pengujian keamanan out-of-band
yang sudah diizinkan (mis. PoC SSRF / blind injection di dalam scope program
bug bounty). Setiap request yang masuk dicatat: method, path, query, header,
body, IP sumber, dan waktu.

## Cara pakai

- Deploy sebagai app Node.js (mis. Altare): clone repo ini, start command
  `node server.js` (atau `npm start`). Port diambil dari env `PORT`.
- Set env `CALLBACK_TOKEN` ke sebuah string rahasia — ini kunci buat baca log.
- Buat satu label per pengujian, mis. `https://<app-kamu>/c/ssrf-kiteworks-01`.
  Pakai URL itu sebagai target callback di PoC.
- Cek hit yang masuk: `https://<app-kamu>/logs?token=<CALLBACK_TOKEN>`.
  Menampilkan 200 hit terakhir, terbaru dulu. Hit juga muncul di log aplikasi.
- `/health` menjawab `ok` (buat cek uptime, tidak dicatat sebagai hit).

## Catatan

- Jangan pakai server ini di luar pengujian yang diizinkan. Target pengujian
  harus berada dalam scope program yang sedang dikerjakan.
- Token `/logs` jangan disebar — siapa pun yang punya token bisa baca log hit.
- Log hanya disimpan di memori (maks 200 hit); restart aplikasi menghapusnya.
