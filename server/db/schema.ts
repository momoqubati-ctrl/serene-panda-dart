import { sql, pg } from "drizzle-orm";

// Define database schema
const User = sql`users`;

// User table
export const users = pg.table(User, {
  id: pg.pk.id('id'),
  username: pg.text('username').unique(),
  password: pg.text('password'),
  createdAt: pg.dateTime('created_at'),
  updatedAt: pg.dateTime('updated_at'),
});

export const schema = [users];