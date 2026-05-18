import { Socket } from "socket.io";
import { getUserContext, PermissionKey, canModerate } from "../services/permissionEngine";

/**
 * يتحقق من الصلاحية قبل تنفيذ الحدث
 */
export const withPermission = (permission: PermissionKey, handler: Function) => {
  return async (socket: Socket, data: any, callback?: Function) => {
    const user = socket.data.user;
    const context = await getUserContext(user.id);

    if (!context.permissions.has(permission)) {
      return callback?.({ success: false, message: "لا تملك الصلاحية الكافية" });
    }

    return handler(socket, data, callback);
  };
};

/**
 * يتحقق من الهرمية قبل تنفيذ إجراء إشرافي (طرد، حظر، إلخ)
 */
export const withModeration = (permission: PermissionKey, handler: Function) => {
  return async (socket: Socket, data: any, callback?: Function) => {
    const actor = socket.data.user;
    const targetId = data.targetUserId || data.userId;

    if (!targetId) return callback?.({ success: false, message: "المستهدف غير محدد" });

    const context = await getUserContext(actor.id);
    if (!context.permissions.has(permission)) {
      return callback?.({ success: false, message: "لا تملك صلاحية الإشراف هذه" });
    }

    const allowed = await canModerate(actor.id, targetId);
    if (!allowed) {
      return callback?.({ success: false, message: "لا يمكنك تنفيذ هذا الإجراء على رتبة مساوية أو أعلى" });
    }

    return handler(socket, data, callback);
  };
};