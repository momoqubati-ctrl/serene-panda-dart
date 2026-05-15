import { db } from "../db";
import { wallPosts, wallComments, users } from "../db/schema";
import { desc, eq } from "drizzle-orm";

export const listWallPosts = async () => {
  return await db
    .select({
      id: wallPosts.id,
      body: wallPosts.body,
      mediaUrl: wallPosts.mediaUrl,
      createdAt: wallPosts.createdAt,
      author: {
        name: users.displayName,
        avatar: users.avatarUrl,
      },
    })
    .from(wallPosts)
    .leftJoin(users, eq(wallPosts.authorId, users.id))
    .orderBy(desc(wallPosts.createdAt))
    .limit(50);
};

export const createWallPost = async (authorId: string, body: string, mediaUrl?: string) => {
  const [post] = await db
    .insert(wallPosts)
    .values({
      authorId,
      body,
      mediaUrl,
    })
    .returning();
  return post;
};

export const listPostComments = async (postId: string) => {
  return await db
    .select({
      id: wallComments.id,
      body: wallComments.body,
      createdAt: wallComments.createdAt,
      author: {
        name: users.displayName,
        avatar: users.avatarUrl,
      },
    })
    .from(wallComments)
    .leftJoin(users, eq(wallComments.authorId, users.id))
    .where(eq(wallComments.postId, postId))
    .orderBy(desc(wallComments.createdAt));
};

export const createWallComment = async (postId: string, authorId: string, body: string) => {
  const [comment] = await db
    .insert(wallComments)
    .values({
      postId,
      authorId,
      body,
    })
    .returning();
  return comment;
};