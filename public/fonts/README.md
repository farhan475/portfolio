# Font yang dihosting sendiri

Berkas di folder ini disalin dari layanan Google Fonts (`fonts.gstatic.com`),
subset `latin` dan `latin-ext` dari Inter versi 20. Keduanya font variabel,
jadi satu berkas mencakup seluruh bobot 100-900.

Alasannya performa: mengambil font dari Google memerlukan dua lompatan
berantai (`fonts.googleapis.com/css2` lalu `fonts.gstatic.com`) yang terukur
memblokir render 836ms di Lighthouse mobile. Menyajikannya dari origin yang
sama menghapus kedua lompatan itu.

Inter dilisensikan di bawah SIL Open Font License 1.1, yang mengizinkan
penyajian mandiri: https://github.com/rsms/inter

Daftar font lokal dan unicode-range-nya ada di `src/lib/fonts.ts`. Font yang
tidak ada di daftar itu tetap diambil dari Google, jadi pilihan font di
/admin tidak dibatasi.
