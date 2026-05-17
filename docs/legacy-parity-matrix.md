# مصفوفة مطابقة قاعدة Safari القديمة

هذه الوثيقة هي عقد الترحيل: لا يعتبر نقل الموقع القديم مكتملاً إذا بقي أي جدول أو عمود من dump القديم بدون وجهة واضحة في النظام الجديد.

للتغطية على مستوى الأعمدة راجع `docs/legacy-column-coverage.md`.

## قاعدة عدم وجود نواقص

كل متغير قديم يجب أن يقع في واحدة من هذه الحالات:

- `typed`: عمود مباشر واضح في PostgreSQL.
- `normalized`: نُقل إلى جدول أو علاقة منظمة.
- `metadata`: محفوظ داخل `legacy_metadata` أو `metadata` بدون أن يكون جزءاً من منطق التشغيل.
- `archive`: محفوظ للرجوع أو التقارير فقط.
- `blocked`: لا يُستخدم تشغيلياً لأسباب أمنية أو منطقية، مع توثيق السبب.

## خريطة الجداول

| الجدول القديم | الوجهة الجديدة | الحالة | ملاحظة تصميم |
| --- | --- | --- | --- |
| `users` | `users`, `user_profiles`, `wallets`, `roles`, `user_role_assignments`, `device_fingerprints` | mixed | كلمات المرور القديمة لا تستخدم مباشرة؛ تحفظ كمرجع وتفعل `requires_password_reset`. |
| `powers` | `roles`, `role_permissions` | normalized | الصلاحيات لم تعد JSON واحداً داخل صف واحد. |
| `sub` | `subscriptions`, `user_role_assignments` | normalized | الاشتراك/الترقية يصبح مدة واضحة لا نصوص وقت متفرقة. |
| `rooms` | `rooms`, `room_members`, `room_badges`, `room_badge_assignments`, `room_welcome_visits` | mixed | `stage_state` و`room_owner_meta` تحفظ في `settings` و`legacy_metadata` مع تفكيك الشارات. |
| `room_welcome_visits` | `room_welcome_visits` | typed | يحافظ على عداد الزيارات حسب الغرفة والهوية. |
| `bars` | `wall_posts`, `wall_comments`, `wall_post_likes` | normalized | `bcc` و`likes` لا يبقيان JSON داخل المنشور. |
| `top10wall` | `wall_activity_events` وتقارير مشتقة | normalized | يسجل الحدث ثم تُبنى القوائم منه. |
| `followers` | `follows` | typed | علاقة مباشرة بين مستخدمين. |
| `storie` | `stories` | mixed | عناصر `item[]` تصبح قصصاً أو metadata حسب شكلها. |
| `storieview` | `story_views` | typed | مشاهدة القصة أصبحت علاقة قابلة للفهرسة. |
| `profile_visits` | `profile_visits` | typed | يدعم إشعارات وزيارات غير مقروءة. |
| `internal_mail` | `internal_mail` | typed | يحفظ snapshot للمرسل والمستقبل حتى لو تغير الملف لاحقاً. |
| `settings` | `site_settings`, `site_assets`, `site_badges`, `room_badges`, `gifts` | mixed | الأصول والهدايا والشارات تفكك من JSON إلى جداول. |
| `site` | `site_settings`, `site_assets` | mixed | البنر واللوجو أصول موقع. |
| `hosts` | `site_settings` أو إعدادات النشر | metadata | لا يستخدم لتوجيه الإنتاج إلا بعد مراجعة النطاقات. |
| `owner` | `site_settings` | mixed | إعدادات عامة مثل البنر، الزوار، التعليقات، حماية VPN. |
| `bots` | `chat_bots` | mixed | IP البوتات القديمة لا يعتبر موثوقاً؛ يحفظ كـ metadata فقط. |
| `cuts` | `shortcuts` | typed | الاختصارات أصبحت قابلة للتفعيل والتعطيل. |
| `intromsg` | `intro_messages` | typed | رسائل الترحيب مستقلة عن إعدادات الموقع. |
| `notext` | `moderation_filters` | typed | الفلاتر لها scope/action/severity. |
| `band` | `moderation_bans`, `moderation_events` | typed | الحظر يفصل بين IP والجهاز والدولة والمدة. |
| `bsb` | `site_settings`, `device_fingerprints` | mixed | إعدادات الأنظمة والمتصفحات تحفظ كسياسة أمان. |
| `names` | `device_fingerprints` | archive | تستخدم للتحقيق الإداري، لا كحقيقة هوية نهائية. |
| `logs` | `device_fingerprints`, `admin_audit_logs`, `moderation_events` | archive | السجلات المشوهة الترميز تحفظ ولا تقود منطق المنتج. |
| `histletter` | `moderation_events`, `admin_audit_logs` | archive | تاريخ الرسائل/الفلاتر للتحقيق فقط. |
| `stats` | `admin_audit_logs` | archive | أفعال الإدارة تصبح audit log واضح. |
| `gifts_git` داخل `settings` | `gifts`, `gift_notifications` | normalized | الهدايا والرسائل المالية منفصلة. |
| `gift_notifications` | `gift_notifications` | typed | الإشعارات مربوطة بالهدايا والمستخدمين. |
| `coin_ledger` | `wallet_ledger`, `gift_notifications` | normalized | دفتر واحد للحركات المالية، مع txid. |
| `site_master_wallet` | `wallets` | normalized | محفظة الموقع نوع من المحافظ. |
| `site_master_wallet_ledger` | `wallet_ledger` | normalized | حركة محفظة الموقع داخل دفتر موحد. |
| `agents` | `agents`, `users` optional | typed | الوكيل يمكن ربطه بحساب مستخدم. |
| `agent_wallets` | `wallets` | normalized | محفظة وكيل بنوع `agent`. |
| `agent_wallet_ledger` | `wallet_ledger` | normalized | حركة وكيل داخل نفس دفتر المحافظ. |
| `agent_payment_methods` | `agent_payment_methods` | typed | طرق الدفع صارت جدولاً مستقلاً. |
| `coin_packages` | `coin_packages` | typed | الباقات لا تحمل عمولة الوكيل داخل سعرها. |
| `owner_agent_transfers` | `topup_settlement_ledger`, `wallet_ledger` | normalized | التحويلات تسجل كحركات مالية واضحة. |
| `topup_orders` | `topup_orders` | typed | الطلب يحتفظ snapshots للمستخدم والوكيل والباقة. |
| `topup_order_events` | `topup_order_events` | typed | تغيرات الحالة لا تضيع. |
| `topup_settlement_ledger` | `topup_settlement_ledger` | typed | التسويات منفصلة عن سعر الباقة. |

## تصحيحات منطقية إلزامية

- لا تعتمد الهوية الجديدة على `uid`, `lid`, `idreg` وحدها؛ تحفظ كمفاتيح legacy فقط.
- لا تستخدم كلمات مرور `sha1$` القديمة للدخول المباشر.
- لا تخلط سعر الباقة مع عمولة الوكيل؛ السعر والعمولة حركتان محاسبيتان منفصلتان.
- لا تخزن تعليقات الجدار أو الإعجابات كـ JSON داخل المنشور.
- لا تجعل صلاحيات الإدارة JSON واحداً في صف واحد؛ الصلاحيات يجب أن تكون قابلة للفهرسة والمراجعة.
- لا تستخدم IP البوتات القديمة أو fingerprint قديم كأمان إنتاجي بدون تحقق.
- أي نص عربي مشوه مثل `ط¹ط¶ظˆ` يحفظ كأثر legacy ولا يعرض للمستخدم.

## معيار اكتمال الترحيل

1. كل جدول قديم مذكور في هذه الوثيقة.
2. كل عمود قديم يدخل في `typed`, `normalized`, `metadata`, `archive`, أو `blocked`.
3. كل سكربت ترحيل يعمل بوضع `dry-run` قبل الكتابة.
4. كل دفعة ترحيل تكتب في `legacy_import_batches`.
5. كل قرار تحويل يكتب في `legacy_import_mappings`.
6. أي فرق في أعداد السجلات أو الحقول يخرج في تقرير قبل اعتماد الترحيل.
