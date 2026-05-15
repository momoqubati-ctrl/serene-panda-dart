import { eq } from "drizzle-orm";
import { db } from "../db";
import { userProfiles, users, wallets } from "../db/schema";
import { AuthRole, UserProfileDefaults } from "./userProfileDefaults";
import { dbProfileToPublic, profileDefaultsToDb } from "./userProfileMapper";

export type PersistedUser = {
  id: string;
  username: string;
  displayName: string;
  role: AuthRole;
  countryCode: string;
  passwordHash?: string;
  createdAt: string;
  profile: UserProfileDefaults;
};

type CreateUserInput = {
  username: string;
  displayName: string;
  role: AuthRole;
  countryCode: string;
  passwordHash: string;
  profile: UserProfileDefaults;
};

let databaseAvailable: boolean | undefined;

const normalizeRole = (role: string): AuthRole => (role === "admin" ? "admin" : role === "guest" ? "guest" : "member");

const mapJoinedUser = (row: { user: typeof users.$inferSelect; profile: typeof userProfiles.$inferSelect }): PersistedUser => ({
  id: row.user.id,
  username: row.user.username,
  displayName: row.user.displayName,
  role: normalizeRole(row.user.role),
  countryCode: row.user.countryCode || "SA",
  passwordHash: row.user.passwordHash || undefined,
  createdAt: row.user.createdAt.toISOString(),
  profile: dbProfileToPublic(row.profile),
});

const markDbUnavailable = (error: unknown) => {
  databaseAvailable = false;
  console.warn("Database auth store unavailable, using in-memory fallback:", error instanceof Error ? error.message : error);
};

export const canUseDatabaseAuth = () => databaseAvailable !== false;

export const findPersistedUserByUsername = async (username: string): Promise<PersistedUser | null> => {
  if (databaseAvailable === false) return null;

  try {
    const row = await db
      .select({ user: users, profile: userProfiles })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.username, username))
      .limit(1);

    databaseAvailable = true;
    return row[0] ? mapJoinedUser(row[0]) : null;
  } catch (error) {
    markDbUnavailable(error);
    return null;
  }
};

export const createPersistedUser = async (input: CreateUserInput): Promise<PersistedUser | null> => {
  if (databaseAvailable === false) return null;

  try {
    const created = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          username: input.username,
          displayName: input.displayName,
          role: input.role,
          countryCode: input.countryCode,
          passwordHash: input.passwordHash,
          avatarUrl: input.profile.avatar,
          coverUrl: input.profile.profileBannerUrl,
          profile: input.profile,
        })
        .returning();

      const [profile] = await tx
        .insert(userProfiles)
        .values({
          userId: user.id,
          ...profileDefaultsToDb(input.profile),
        })
        .returning();

      await tx
        .insert(wallets)
        .values({
          ownerType: "user",
          ownerId: user.id,
          balanceCoins: input.profile.coins,
          reservedCoins: 0,
        })
        .onConflictDoNothing();

      return mapJoinedUser({ user, profile });
    });

    databaseAvailable = true;
    return created;
  } catch (error) {
    markDbUnavailable(error);
    return null;
  }
};
