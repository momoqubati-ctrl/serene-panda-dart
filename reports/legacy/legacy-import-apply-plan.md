# تقرير خطة الترحيل الفعلي

- الوضع: تنفيذ فعلي
- المرحلة: `core_identity_settings`
- المصدر: `C:\xampp\htdocs\chetos216-08-2024\database\database٥‏-٥‏-٢٠٢٦.sql`
- قاعدة البيانات: `safarihost`
- تاريخ اكتمال dump: 2026-05-05T22:23:59
- SHA-256: `85c1f66e40416c1bdd4bc4063751e257380fb67bc958304d3e916e4bcbf16e6b`

## الجداول المشمولة

`users`, `powers`, `rooms`, `settings`, `site`, `owner`, `site_master_wallet`

## الملخص

- users: 7
- userProfiles: 7
- userWallets: 7
- roles: 6
- rolePermissions: 260
- rooms: 2
- siteSettings: 4
- siteAssets: 21
- gifts: 7
- roomBadges: 2
- siteBadges: 2
- siteWallets: 1
- mappings: 397

## عينات مراجعة

### المستخدمون

- #1 `mohammed` / mohammed / role=admin / coins=0
- #2 `safari2023` / seohost / role=admin / coins=0
- #3 `chatmaster11` / admin / role=admin / coins=7
- #4 `chatmaster` / chatmaster / role=admin / coins=0
- #5 `medo` / medo / role=admin / coins=58

### الصلاحيات

- `ispower` rank=100000 permissions=40
- `Hide` rank=10000 permissions=40
- `ispower2` rank=5000 permissions=39
- `chatmaster` rank=9999 permissions=47
- `admin` rank=9000 permissions=47
- `ترقية ذهبية` rank=5000 permissions=47

### الغرف

- `d8d8a9a9c0` / الغرفة العامة / owner=#3
- `2566st17zd` / صنعاء / owner=#3

## التشخيص

- لا توجد أخطاء تحليل في المرحلة الحالية.

## ملاحظة تشغيل

هذا السكربت لا يكتب في PostgreSQL إلا عند تمرير `--apply`. في وضع التنفيذ الفعلي يستخدم transaction، وإذا فشلت أي خطوة يتم rollback.

