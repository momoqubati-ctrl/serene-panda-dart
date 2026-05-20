import { defineEventHandler, getHeader, readBody, setResponseStatus } from "h3";
import { createHmac, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { updatePersistedUserProfile } from "../../../services/userRepository";
import { updateInMemoryUserProfile } from "../../../services/authService";

const getSecret = () => process.env.AUTH_SECRET || "dev-only-change-this-secret";

const verifySignature = (payload: string, signature: string) => {
  const expected = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature || "");
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
};

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const [payload, signature] = token.split(".");

  if (!payload || !signature || !verifySignature(payload, signature)) {
    setResponseStatus(event, 401);
    return { success: false, message: "جلسة غير صالحة" };
  }

  let userId = "";
  let username = "";
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed?.exp || Date.now() > Number(parsed.exp)) {
      setResponseStatus(event, 401);
      return { success: false, message: "انتهت صلاحية الجلسة" };
    }
    userId = String(parsed.sub || "");
    username = String(parsed.name || "");
  } catch (err) {
    setResponseStatus(event, 401);
    return { success: false, message: "توكن غير صالح" };
  }

  try {
    const body = await readBody(event);
    const { avatar, cover, profileMsg } = body;

    const updates: { avatar?: string; cover?: string; profileMsg?: string } = {};

    // 1. Process and save base64 uploaded files
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (avatar && avatar.startsWith("data:image/")) {
      const matches = avatar.match(/^data:image\/([A-Za-z0-9+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        let ext = matches[1];
        if (ext === "jpeg") ext = "jpg";
        else if (ext === "svg+xml") ext = "svg";
        const buffer = Buffer.from(matches[2], "base64");
        const filename = `avatar_${userId}_${Date.now()}.${ext}`;
        fs.writeFileSync(path.join(uploadsDir, filename), buffer);
        updates.avatar = `/uploads/${filename}`;
      }
    } else if (avatar) {
      updates.avatar = avatar;
    }

    if (cover && cover.startsWith("data:image/")) {
      const matches = cover.match(/^data:image\/([A-Za-z0-9+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        let ext = matches[1];
        if (ext === "jpeg") ext = "jpg";
        else if (ext === "svg+xml") ext = "svg";
        const buffer = Buffer.from(matches[2], "base64");
        const filename = `cover_${userId}_${Date.now()}.${ext}`;
        fs.writeFileSync(path.join(uploadsDir, filename), buffer);
        updates.cover = `/uploads/${filename}`;
      }
    } else if (cover) {
      updates.cover = cover;
    }

    if (profileMsg !== undefined) {
      updates.profileMsg = profileMsg;
    }

    // 2. Update Database
    const dbSuccess = await updatePersistedUserProfile(userId, updates);

    // 3. Update in-memory fallback
    updateInMemoryUserProfile(username, updates);

    return {
      success: true,
      updates,
      dbSuccess
    };
  } catch (error: any) {
    console.error("Profile update error:", error);
    setResponseStatus(event, 500);
    return { success: false, message: "حدث خطأ أثناء تعديل الملف الشخصي" };
  }
});
