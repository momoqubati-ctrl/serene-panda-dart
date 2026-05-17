# تغطية أعمدة قاعدة Safari القديمة

هذا الملف يسجل كل أعمدة dump القديم التي تم استخراجها من `database٥‏-٥‏-٢٠٢٦.sql`. الهدف منه أن يكون العمل القادم على سكربتات الترحيل قابلاً للمراجعة: لا يوجد جدول قديم بلا وجهة، ولا يوجد عمود قديم بلا استراتيجية.

## الاستراتيجيات

- `typed`: عمود مباشر في جدول حديث.
- `normalized`: موزع على أكثر من جدول/علاقة.
- `metadata`: محفوظ في `legacy_metadata` أو `metadata`.
- `archive`: محفوظ للأرشفة والتحقيق فقط.
- `blocked`: لا يستخدم تشغيلياً لأسباب أمنية أو منطقية.

## تغطية الجداول والأعمدة

| الجدول القديم | الأعمدة القديمة | الوجهة الأساسية | الاستراتيجية |
| --- | --- | --- | --- |
| `agent_payment_methods` | `id`, `agent_id`, `method_name`, `account_name`, `account_identifier`, `instructions`, `is_active`, `sort_order`, `created_at`, `updated_at` | `agent_payment_methods` | typed + metadata |
| `agent_wallet_ledger` | `id`, `txid`, `agent_id`, `event_type`, `amount`, `before_balance`, `after_balance`, `actor_type`, `actor_id`, `counterparty_type`, `counterparty_id`, `note`, `reference_table`, `reference_id`, `created_at` | `wallet_ledger` | normalized |
| `agent_wallets` | `id`, `agent_id`, `balance_coins`, `reserved_coins`, `status`, `created_at`, `updated_at` | `wallets` | normalized |
| `agents` | `id`, `code`, `name`, `country_code`, `city`, `phone`, `username`, `password_hash`, `status`, `commission_type`, `commission_value`, `can_receive_orders`, `notes`, `created_at`, `updated_at` | `agents`, `users`, `legacy_metadata` | typed + blocked password reuse |
| `band` | `id`, `name_band`, `type`, `deccode`, `decoderDans`, `device_band`, `ip_band`, `country_band`, `date` | `moderation_bans`, `moderation_events` | typed + metadata |
| `bars` | `id`, `bcc`, `likes`, `bg`, `bid`, `lid`, `mcol`, `msg`, `pic`, `topic`, `ucol`, `uid` | `wall_posts`, `wall_comments`, `wall_post_likes` | normalized + metadata |
| `bots` | `idreg`, `msg`, `pic`, `power`, `country`, `room`, `ip`, `id`, `stat`, `topic` | `chat_bots` | typed + metadata |
| `bsb` | `id`, `systems`, `browsers` | `site_settings`, `device_fingerprints` | metadata |
| `coin_ledger` | `id`, `txid`, `event_type`, `actor_uid`, `actor_idreg`, `user_uid`, `user_idreg`, `counterparty_uid`, `counterparty_idreg`, `amount`, `before_balance`, `after_balance`, `gift_file`, `note`, `ip`, `created_at` | `wallet_ledger`, `gift_notifications` | normalized |
| `coin_packages` | `id`, `title`, `coins_amount`, `price_local`, `currency`, `country_code`, `city`, `is_active`, `sort_order`, `notes`, `created_at`, `updated_at` | `coin_packages` | typed |
| `cuts` | `id`, `text1`, `text2` | `shortcuts` | typed |
| `followers` | `id`, `follower_id`, `following_id`, `created_at` | `follows` | typed |
| `gift_notifications` | `id`, `txid`, `to_uid`, `to_idreg`, `from_uid`, `from_idreg`, `from_topic`, `gift_file`, `coin`, `note`, `is_read`, `created_at`, `read_at` | `gift_notifications` | typed + metadata |
| `histletter` | `id`, `ip`, `msg`, `topic`, `v`, `time`, `target`, `source`, `path` | `moderation_events`, `admin_audit_logs` | archive |
| `hosts` | `id`, `hostname`, `setting` | `site_settings` | metadata |
| `internal_mail` | `id`, `from_uid`, `from_username`, `from_topic`, `from_pic`, `to_uid`, `to_username`, `to_topic`, `to_pic`, `body`, `is_read`, `created_at`, `read_at` | `internal_mail` | typed + snapshots |
| `intromsg` | `id`, `category`, `adresse`, `msg` | `intro_messages` | typed |
| `logs` | `id`, `state`, `topic`, `username`, `ip`, `code`, `device`, `isin`, `time` | `device_fingerprints`, `admin_audit_logs` | archive + metadata |
| `names` | `id`, `iduser`, `fp`, `ip`, `topic`, `username` | `device_fingerprints` | archive |
| `notext` | `id`, `type`, `path`, `v` | `moderation_filters` | typed |
| `owner` | `id`, `bars`, `Vpn`, `Gust`, `datafinish`, `MaxRep`, `Tv`, `Vistor`, `room`, `isbanner`, `rc`, `cooment`, `offline` | `site_settings` | typed settings + metadata |
| `owner_agent_transfers` | `id`, `txid`, `agent_id`, `coins_amount`, `settlement_amount_local`, `currency`, `status`, `note`, `created_by`, `approved_by`, `created_at`, `approved_at` | `topup_settlement_ledger`, `wallet_ledger` | normalized |
| `powers` | `id`, `powers` | `roles`, `role_permissions` | normalized |
| `profile_visits` | `id`, `owner_id`, `visitor_id`, `visitor_name`, `visitor_pic`, `seen`, `time`, `visitor_type` | `profile_visits` | typed |
| `room_welcome_visits` | `id`, `room_id`, `identity_key`, `is_guest`, `first_seen`, `last_seen`, `visits` | `room_welcome_visits` | typed |
| `rooms` | `idroom`, `about`, `user`, `pass`, `id`, `owner`, `topic`, `pic`, `rmli`, `mic`, `welcome`, `broadcast`, `deleted`, `needpass`, `color`, `max`, `stage_count`, `stage_state`, `room_owner_meta`, `message_mode` | `rooms`, `room_members`, `room_badges`, `room_badge_assignments` | typed + normalized + metadata |
| `settings` | `id`, `site`, `dro3`, `them`, `cover`, `emo`, `sico`, `room_badges`, `site_badges`, `gifts_git`, `gift_categories` | `site_settings`, `site_assets`, `room_badges`, `site_badges`, `gifts` | normalized |
| `site` | `id`, `banner`, `host`, `ids`, `logo` | `site_settings`, `site_assets` | typed settings + metadata |
| `site_master_wallet` | `id`, `site_id`, `balance_coins`, `reserved_coins`, `status`, `created_at`, `updated_at` | `wallets` | normalized |
| `site_master_wallet_ledger` | `id`, `txid`, `site_id`, `event_type`, `amount`, `before_balance`, `after_balance`, `actor_type`, `actor_id`, `counterparty_type`, `counterparty_id`, `note`, `reference_table`, `reference_id`, `created_at` | `wallet_ledger` | normalized |
| `stats` | `id`, `state`, `topic`, `username`, `room`, `ip`, `time` | `admin_audit_logs` | archive |
| `storie` | `id`, `sid`, `photo`, `name`, `link`, `lastUpdated`, `item`, `seen`, `currentPreview` | `stories` | typed + metadata |
| `storieview` | `id`, `sid`, `topic`, `photo`, `idsto`, `item`, `time` | `story_views` | typed + metadata |
| `sub` | `id`, `iduser`, `sub`, `topic`, `topic1`, `timestart`, `timefinish`, `timeis` | `subscriptions`, `user_role_assignments` | normalized |
| `top10wall` | `id`, `uid`, `otype`, `pic`, `topic` | `wall_activity_events` | typed |
| `topup_order_events` | `id`, `order_id`, `order_no`, `event_type`, `old_status`, `new_status`, `actor_type`, `actor_id`, `note`, `created_at` | `topup_order_events` | typed |
| `topup_orders` | `id`, `order_no`, `user_uid`, `user_idreg`, `user_topic`, `user_username`, `agent_id`, `agent_code`, `agent_name`, `agent_phone`, `agent_country_code`, `agent_city`, `package_id`, `package_title`, `package_coins`, `package_price_local`, `customer_price_local`, `agent_profit_local`, `agent_commission_type`, `agent_commission_value`, `currency`, `package_country_code`, `package_city`, `payment_method_id`, `payment_method_name`, `payment_method_account_name`, `payment_method_identifier`, `receipt_path`, `receipt_uploaded_at`, `payment_reference`, `payment_note`, `status`, `processed_by`, `processed_note`, `reject_reason`, `requested_at`, `processed_at`, `source_ip`, `agent_commission_coins` | `topup_orders`, snapshots, `topup_order_events` | typed + snapshots |
| `topup_settlement_ledger` | `id`, `txid`, `order_id`, `order_no`, `event_type`, `agent_id`, `agent_name`, `user_uid`, `user_idreg`, `package_id`, `package_title`, `package_coins`, `currency`, `customer_price_local`, `site_share_local`, `agent_profit_local`, `processed_by`, `note`, `created_at` | `topup_settlement_ledger` | typed + metadata |
| `users` | `idreg`, `bg`, `mcol`, `ucol`, `evaluation`, `ico`, `ip`, `fp`, `id`, `lid`, `uid`, `msg`, `pic`, `pich`, `power`, `rep`, `topic`, `username`, `password`, `token`, `youtub`, `them`, `cover`, `loginG`, `muted`, `documentationc`, `lastssen`, `joinuser`, `site_badge_id`, `site_badge`, `coins`, `gift_ico`, `gcol`, `last_eval_login_day`, `auto_power`, `wall_post_likes`, `gifts_received_count`, `eval_awards_json` | `users`, `user_profiles`, `wallets`, `roles`, `device_fingerprints`, `legacy_metadata` | typed + normalized + blocked password reuse |

## ملاحظات تنفيذية

- `password`, `token`, وبيانات الجلسة القديمة لا تعتمد كجلسات جديدة. تستخدم فقط لترحيل الحساب ثم إجبار تغيير كلمة المرور.
- الحقول التي كانت تحتوي JSON نصي مثل `powers`, `bcc`, `likes`, `site`, `room_owner_meta`, `gifts_git`, و`eval_awards_json` يجب تحليلها ببارسر JSON، لا بمعالجة نصية عشوائية.
- أي سجل يفشل تحليله لا يحذف؛ يوضع في `legacy_metadata` ويظهر في تقرير `legacy_import_batches.summary`.
