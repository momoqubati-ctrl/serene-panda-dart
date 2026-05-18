import { dbPool } from "../db";

export async function getUserProfileQuery(userId: string) {
  const result = await dbPool.query(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.role, u.status, u.presence,
            p.profile_msg, p.banner_url, p.rep, p.coins, p.evaluation
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] ?? null;
}
