# تقرير الترحيل التجريبي

- المصدر: `C:\xampp\htdocs\chetos216-08-2024\database\database٥‏-٥‏-٢٠٢٦.sql`
- قاعدة البيانات: `safarihost`
- تاريخ اكتمال dump: 2026-05-05T22:23:59
- SHA-256: `85c1f66e40416c1bdd4bc4063751e257380fb67bc958304d3e916e4bcbf16e6b`

## الملخص

- الجداول القديمة: 39
- الأعمدة القديمة: 419
- السجلات المحسوبة من INSERT: 945
- قرارات mapping المولدة: 879

## فجوات التغطية

- جداول بلا تغطية: 0
- أعمدة بلا تغطية: 0
- جداول موثقة غير موجودة في dump: 0
- وجهات تحتاج مراجعة: 0

## أعداد السجلات

| الجدول | الأعمدة | السجلات | الاستراتيجية |
| --- | ---: | ---: | --- |
| `agent_payment_methods` | 10 | 0 | typed + metadata |
| `agent_wallet_ledger` | 15 | 0 | normalized |
| `agent_wallets` | 7 | 0 | normalized |
| `agents` | 15 | 0 | typed + blocked password reuse |
| `band` | 9 | 0 | typed + metadata |
| `bars` | 12 | 24 | normalized + metadata |
| `bots` | 10 | 501 | typed + metadata |
| `bsb` | 3 | 1 | metadata |
| `coin_ledger` | 16 | 26 | normalized |
| `coin_packages` | 12 | 0 | typed |
| `cuts` | 3 | 1 | typed |
| `followers` | 4 | 2 | typed |
| `gift_notifications` | 13 | 13 | typed + metadata |
| `histletter` | 9 | 5 | archive |
| `hosts` | 3 | 1 | metadata |
| `internal_mail` | 13 | 1 | typed + snapshots |
| `intromsg` | 4 | 1 | typed |
| `logs` | 9 | 21 | archive + metadata |
| `names` | 6 | 32 | archive |
| `notext` | 4 | 5 | typed |
| `owner` | 13 | 1 | typed settings + metadata |
| `owner_agent_transfers` | 12 | 0 | normalized |
| `powers` | 2 | 1 | normalized |
| `profile_visits` | 8 | 16 | typed |
| `room_welcome_visits` | 7 | 13 | typed |
| `rooms` | 20 | 2 | typed + normalized + metadata |
| `settings` | 11 | 1 | normalized |
| `site` | 5 | 1 | typed settings + metadata |
| `site_master_wallet` | 7 | 1 | normalized |
| `site_master_wallet_ledger` | 15 | 0 | normalized |
| `stats` | 7 | 134 | archive |
| `storie` | 9 | 1 | typed + metadata |
| `storieview` | 7 | 4 | typed + metadata |
| `sub` | 8 | 1 | normalized |
| `top10wall` | 5 | 128 | typed |
| `topup_order_events` | 10 | 0 | typed |
| `topup_orders` | 39 | 0 | typed + snapshots |
| `topup_settlement_ledger` | 19 | 0 | typed + metadata |
| `users` | 38 | 7 | typed + normalized + blocked password reuse |

## فحص JSON

| الجدول | العمود | المفحوص | صحيح | فاشل | ملاحظة |
| --- | --- | ---: | ---: | ---: | --- |
| `bars` | `bcc` | 24 | 24 | 0 |  |
| `bars` | `likes` | 24 | 24 | 0 |  |
| `bsb` | `systems` | 1 | 1 | 0 |  |
| `bsb` | `browsers` | 1 | 1 | 0 |  |
| `powers` | `powers` | 1 | 1 | 0 |  |
| `rooms` | `stage_state` | 2 | 2 | 0 |  |
| `rooms` | `room_owner_meta` | 2 | 2 | 0 |  |
| `settings` | `site` | 1 | 1 | 0 |  |
| `settings` | `dro3` | 1 | 1 | 0 |  |
| `settings` | `them` | 1 | 1 | 0 |  |
| `settings` | `cover` | 1 | 1 | 0 |  |
| `settings` | `emo` | 1 | 1 | 0 |  |
| `settings` | `sico` | 1 | 1 | 0 |  |
| `settings` | `room_badges` | 1 | 1 | 0 |  |
| `settings` | `site_badges` | 1 | 1 | 0 |  |
| `settings` | `gifts_git` | 1 | 1 | 0 |  |
| `settings` | `gift_categories` | 1 | 1 | 0 |  |
| `storie` | `item` | 1 | 1 | 0 |  |
| `storie` | `currentPreview` | 1 | 1 | 0 |  |
| `users` | `site_badge` | 2 | 2 | 0 |  |
| `users` | `eval_awards_json` | 3 | 3 | 0 |  |

## نصوص عربية مشوهة محتملة

- `logs.state` في عينة 20: ط¹ط¶ظˆ

## ملاحظة تشغيل

هذا التقرير لا يكتب في قاعدة البيانات. ملف SQL المرافق هو preview فقط لقرارات `legacy_import_batches` و`legacy_import_mappings`.

