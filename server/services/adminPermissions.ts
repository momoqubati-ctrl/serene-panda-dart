import { dbPool } from "../db";
import { getAdminContext } from "./adminAccess";
import { H3Event, setResponseStatus } from "h3";

export type AdminPermission = 
  | "ban" 
  | "setpower" 
  | "edituser" 
  | "roomowner" 
  | "flter" 
  | "msgs" 
  | "shrt" 
  | "brbbot" 
  | "owner"
  | "cp";

/**
 * يتحقق مما إذا كان المشرف يملك صلاحية معينة
 */
export const hasPermission = async (userId: string, permission: AdminPermission): Promise<boolean> => {
  try {
    // الحصول على رتبة المستخدم وصلاحياتها
    const result = await dbPool.query(
      `SELECT rp.permission_value 
       FROM user_role_assignments ura
       JOIN role_permissions rp ON rp.role_id = ura.role_id
       WHERE ura.user_id = (SELECT id FROM users WHERE idreg = $1 OR id::text = $1 LIMIT 1)
       AND rp.permission_key = $2`,
      [userId, permission]
    );

    if (result.rowCount === 0) return false;
    
    const val = result.rows[0].permission_value;
    return val === true || val === 1 || val === "1";
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
};

/**
 * Middleware للتحقق من الصلاحية داخل الـ API
 */
export const guardAdminAction = async (event: H3Event, permission: AdminPermission) => {
  const admin = getAdminContext(event);
  if (!admin.ok) {
    setResponseStatus(event, admin.statusCode);
    throw new Error(admin.message);
  }

  // المالك يملك كل الصلاحيات
  if (admin.role === "owner") return admin;

  const allowed = await hasPermission(admin.userId, permission);
  if (!allowed) {
    setResponseStatus(event, 403);
    throw new Error("لا تملك الصلاحية الكافية لتنفيذ هذا الإجراء");
  }

  return admin;
};

/**
 * تسجيل عملية إدارية في السجل
 */
export const logAdminAudit = async (params: {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: any;
}) => {
  try {
    await dbPool.query(
      `INSERT INTO admin_audit_logs (actor_id, action, target_type, target_id, metadata)
       VALUES ((SELECT id FROM users WHERE idreg = $1 OR id::text = $1 LIMIT 1), $2, $3, $4, $5::jsonb)`,
      [params.actorId, params.action, params.targetType || null, params.targetId || null, JSON.stringify(params.metadata || {})]
    );
  } catch (err) {
    console.error("Audit log error:", err);
  }
};