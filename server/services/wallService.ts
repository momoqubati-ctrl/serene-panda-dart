import { dbPool } from "../db";

export const listWallPosts = async () => {
  const result = await dbPool.query(`
    SELECT b.id, b.msg as body, b.pic as "mediaUrl", b.uid as "authorId",
           u.username as "authorName", u.avatar_url as "authorAvatar"
    FROM bars b
    LEFT JOIN users u ON b.uid = u.id::text OR b.uid = u.idreg::text
    ORDER BY b.id DESC
    LIMIT 50
  `);
  
  return result.rows.map(row => ({
    id: String(row.id),
    body: row.body,
    mediaUrl: row.mediaUrl,
    createdAt: new Date().toISOString(), // bars doesn't have created_at
    author: {
      name: row.authorName || row.uid,
      avatar: row.authorAvatar || "/pic.png",
    }
  }));
};

export const createWallPost = async (authorId: string, body: string, mediaUrl?: string) => {
  // Look up username for topic
  const userRes = await dbPool.query("SELECT username FROM users WHERE id::text = $1 OR idreg::text = $1 LIMIT 1", [authorId]);
  const username = userRes.rows[0]?.username || authorId;

  const result = await dbPool.query(
    `INSERT INTO bars (uid, msg, pic, topic) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, msg as body, pic as "mediaUrl"`,
    [authorId, body, mediaUrl || null, username]
  );
  
  const row = result.rows[0];
  return {
    id: String(row.id),
    body: row.body,
    mediaUrl: row.mediaUrl,
    createdAt: new Date().toISOString(),
  };
};

export const listPostComments = async (postId: string) => {
  const result = await dbPool.query(`
    SELECT id, body, created_at as "createdAt", author_topic as "authorName", author_pic as "authorAvatar"
    FROM bar_comments
    WHERE bar_id = $1
    ORDER BY id DESC
  `, [parseInt(postId, 10)]);
  
  return result.rows.map(row => ({
    id: String(row.id),
    body: row.body,
    createdAt: row.createdAt || new Date().toISOString(),
    author: {
      name: row.authorName || "زائر",
      avatar: row.authorAvatar || "/pic.png",
    }
  }));
};

export const createWallComment = async (postId: string, authorId: string, body: string) => {
  // Look up username for author_topic
  const userRes = await dbPool.query("SELECT username FROM users WHERE id::text = $1 OR idreg::text = $1 LIMIT 1", [authorId]);
  const username = userRes.rows[0]?.username || authorId;

  const result = await dbPool.query(
    `INSERT INTO bar_comments (bar_id, body, author_topic) 
     VALUES ($1, $2, $3) 
     RETURNING id, body, created_at as "createdAt"`,
    [parseInt(postId, 10), body, username]
  );
  
  const row = result.rows[0];
  return {
    id: String(row.id),
    body: row.body,
    createdAt: row.createdAt || new Date().toISOString(),
  };
};