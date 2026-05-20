import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, type User } from "../db/schema.js";
import { getSupabaseAdmin } from "../lib/supabaseAdmin.js";
import type { UserRole } from "../types.js";

interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

interface CreateClientUserInput {
  email: string;
  password: string;
  displayName?: string;
  createdBy: string;
}

interface CreateLaboratoryUserInput {
  email: string;
  password: string;
  displayName?: string;
}

interface CreateUserWithAuthInput {
  email: string;
  password: string;
  displayName?: string;
  role: UserRole;
  createdBy?: string;
}

export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User already exists: ${email}`);
    this.name = "UserAlreadyExistsError";
  }
}

export class UserCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserCreationError";
  }
}

export async function getUserById(id: string): Promise<User | undefined> {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return db.query.users.findFirst({
    where: eq(users.email, normalizeEmail(email)),
  });
}

export async function listUsersCreatedBy(createdBy: string): Promise<User[]> {
  return db.query.users.findMany({
    where: eq(users.createdBy, createdBy),
    orderBy: (usersTable, { desc }) => [desc(usersTable.createdAt)],
  });
}

export async function getOrCreateUser(
  authUser: AuthUser,
  defaultRole: UserRole = "client"
): Promise<User> {
  const existingUser = await getUserById(authUser.id);

  if (existingUser) {
    return existingUser;
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      id: authUser.id,
      email: normalizeEmail(authUser.email),
      displayName: normalizeDisplayName(authUser.displayName, authUser.email),
      role: defaultRole,
    })
    .onConflictDoNothing({ target: users.id })
    .returning();

  if (createdUser) {
    return createdUser;
  }

  const concurrentUser = await getUserById(authUser.id);

  if (!concurrentUser) {
    throw new Error("Unable to create user");
  }

  return concurrentUser;
}

export async function createClientUser({
  email,
  password,
  displayName,
  createdBy,
}: CreateClientUserInput): Promise<User> {
  return createUserWithAuth({
    email,
    password,
    displayName,
    role: "client",
    createdBy,
  });
}

export async function createLaboratoryUser({
  email,
  password,
  displayName,
}: CreateLaboratoryUserInput): Promise<User> {
  return createUserWithAuth({
    email,
    password,
    displayName,
    role: "laboratory",
  });
}

async function createUserWithAuth({
  email,
  password,
  displayName,
  role,
  createdBy,
}: CreateUserWithAuthInput): Promise<User> {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new UserAlreadyExistsError(normalizedEmail);
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: normalizeDisplayName(displayName, normalizedEmail),
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      throw new UserAlreadyExistsError(normalizedEmail);
    }

    throw new UserCreationError(error.message);
  }

  if (!data.user?.id || !data.user.email) {
    throw new Error("Supabase Auth did not return the created user");
  }

  try {
    const [createdUser] = await db
      .insert(users)
      .values({
        id: data.user.id,
        email: normalizeEmail(data.user.email),
        displayName: normalizeDisplayName(displayName, data.user.email),
        role,
        createdBy,
      })
      .returning();

    if (!createdUser) {
      throw new Error("Unable to create client user");
    }

    return createdUser;
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id).catch(() => undefined);
    throw error;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeDisplayName(displayName: string | undefined, email: string): string {
  const trimmed = displayName?.trim();

  if (trimmed) {
    return trimmed;
  }

  return normalizeEmail(email).split("@")[0] || normalizeEmail(email);
}
