import { dbPool } from "../db";

export type PermissionKey = 
  | "kick" | "ban" | "meiut" | "loveu" | "delpic" | "delmsg" | "delbc"
  | "cp" | "setpower" | "edituser" | "roomowner" | "createroom" | "rooms" | "flter" | "shrt" | "subs" | "upgrades" | "brbbot"
  | "publicmsg" | "forcepm" | "grupes" | "stealth" | "history" | "ulike"
  | "uploadgif" | "gradientname" | "custombg" | "chattem" | "frame" | "banner" | "profile_viewers"
  | "filter_alerts" | "moderation_monitor" | "realtime_admin" | "analytics_access" | "audit_logs" 
  | "manage_notifications" | "manage_wallets" | "manage_domains" | "anti_ddos" | "maintenance_mode";

export interface UserContext {
  userId: string;
  roleId?: string;
  rankPriority: number;
  isStaff: boolean;
  permissions: Set<string>;
}

// ذاكرة مؤقتة للصلاحيات (يمكن استبدالها بـ Redis لاحقاً)
const permissionCache = new Map<string, UserContext>();

/**
 * جلب سياق المستخدم الكامل (الرتبة + الصلاحيات)
 */
export const getUserContext = async (userId: string): Promise<UserContext> => {
  if (permissionCache.has(userId)) return permissionCache.get(userId)!;

  const result = await dbPool.query(`
    SELECT 
      u.id as "userId",
      r.id as "roleId",
      r.rank_priority as "rankPriority",
      r.is_staff as "isStaff",
      COALESCE(jsonb_object_agg(rp.permission_key, rp.permission_value) FILTER (WHERE rp.permission_key IS NOT NULL), '{}'::jsonb) as permissions
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    WHERE u.id = $1 OR u.idreg::text = $1
    GROUP BY u.id, r.id
  `, [userId]);

  if (result.rowCount === 0) {
    return { userId, rankPriority: 0, isStaff: false, permissions: new Set() };
  }

  const row = result.rows[0];
  const perms = new Set<string>();
  Object.entries(row.permissions || {}).forEach(([key, val]) => {
    if (val === true || val === 1) perms.add(key);
  });

  const context: UserContext = {
    userId: row.userId,
    roleId: row.roleId,
    rankPriority: row.rankPriority || 0,
    isStaff: row.isStaff || false,
    permissions: perms
  };

  permissionCache.set(userId, context);
  return context;
};

/**
 * التحقق من امتلاك صلاحية معينة
 */
export const hasPermission = async (userId: string, permission: PermissionKey): Promise<boolean> => {
  const context = await getUserContext(userId);
  return context.permissions.has(permission);
};

/**
 * التحقق من الهرمية (هل يمكن للمستخدم الأول التحكم في الثاني؟)
 */
export const canModerate = async (actorId: string, targetId: string): Promise<boolean> => {
  const actor = await getUserContext(actorId);
  const target = await getUserContext(targetId);

  // لا يمكن التحكم في رتبة مساوية أو أعلى
  return actor.rankPriority > target.rankPriority;
};

/**
 * تفريغ الكاش عند تحديث الرتب
 */
export const invalidatePermissionCache = (userId?: string) => {
  if (userId) permissionCache.delete(userId);
  else permissionCache.clear();
};