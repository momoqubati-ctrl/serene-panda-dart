import { dbPool } from "../db";

const WALL_CACHE_TTL_MS = 30_000;
const WALL_CACHE_LIMIT = 50;
let cachedWallPosts: any[] | null = null;
let cachedWallPostsAt = 0;
let pendingWallPostsLoad: Promise<any[]> | null = null;

const normalizeAssetPath = (value?: string | null, fallback = "/pic.png") => {
  const path = String(value || "").trim();
  if (!path) return fallback;
  if (/^(https?:|data:|\/)/i.test(path)) return path;
  return `/${path}`;
};

const normalizeAuthorName = (value?: string | null) => {
  const name = String(value || "").trim();
  return name ? name.slice(0, 80) : "";
};

const mapWallPost = (row: any) => ({
  id: String(row.id),
  body: row.body,
  mediaUrl: row.mediaUrl ? normalizeAssetPath(row.mediaUrl, "") : null,
  createdAt: row.createdAt || new Date().toISOString(),
  author: {
    id: String(row.authorId || ""),
    name: row.authorName || row.fallbackAuthorName || row.authorId || "زائر",
    avatar: normalizeAssetPath(row.authorAvatar, "/pic.png"),
  },
});

const setWallCache = (posts: any[]) => {
  cachedWallPosts = posts.slice(0, WALL_CACHE_LIMIT);
  cachedWallPostsAt = Date.now();
};

const isWallCacheFresh = () => cachedWallPosts && Date.now() - cachedWallPostsAt < WALL_CACHE_TTL_MS;

export const listWallPosts = async () => {
  if (isWallCacheFresh()) {
    return cachedWallPosts!;
  }

  if (pendingWallPostsLoad) {
    return pendingWallPostsLoad;
  }

  pendingWallPostsLoad = (async () => {
    const result = await dbPool.query(`
      SELECT b.id, b.msg as body, b.pic as "mediaUrl", b.uid as "authorId", b.topic as "fallbackAuthorName",
             COALESCE(NULLIF(u.topic, ''), NULLIF(u.username, '')) as "authorName",
             NULLIF(u.pic, '') as "authorAvatar"
      FROM bars b
      LEFT JOIN users u ON b.uid = u.uid OR b.uid = u.id OR b.uid = u.idreg::text OR lower(b.topic) = lower(u.username)
      ORDER BY b.id DESC
      LIMIT 50
    `);
  
    const posts = result.rows.map(mapWallPost);
    setWallCache(posts);
    return posts;
  })();

  try {
    return await pendingWallPostsLoad;
  } finally {
    pendingWallPostsLoad = null;
  }
};

export const createWallPost = async (authorId: string, body: string, mediaUrl?: string, authorDisplayName?: string) => {
  const userRes = await dbPool.query(
    `SELECT uid, id, idreg, username, topic, pic
     FROM users
     WHERE uid = $1 OR id = $1 OR idreg::text = $1 OR lower(username) = lower($1)
     LIMIT 1`,
    [authorId],
  );
  const user = userRes.rows[0];
  const legacyUserId = String(user?.uid || user?.id || user?.idreg || authorId);
  const authorName = normalizeAuthorName(user?.topic || user?.username || authorDisplayName) || authorId;

  const result = await dbPool.query(
    `INSERT INTO bars (uid, msg, pic, topic) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, msg as body, pic as "mediaUrl", uid as "authorId", topic as "fallbackAuthorName"`,
    [legacyUserId, body, mediaUrl || null, authorName]
  );
  
  const row = result.rows[0];
  const post = mapWallPost({
    ...row,
    authorName,
    authorAvatar: user?.pic,
    createdAt: new Date().toISOString(),
  });

  setWallCache([post, ...(cachedWallPosts || [])]);
  return post;
};

export const updateCachedWallAuthorProfile = (
  identity: { userId?: string; username?: string },
  updates: { avatar?: string },
) => {
  if (!cachedWallPosts || !updates.avatar) return;

  const userId = String(identity.userId || "").trim();
  const username = String(identity.username || "").trim();

  cachedWallPosts = cachedWallPosts.map((post) => {
    const author = post.author || {};
    if (String(author.id) !== userId && String(author.name) !== username) return post;
    return {
      ...post,
      author: {
        ...author,
        avatar: updates.avatar,
      },
    };
  });
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
