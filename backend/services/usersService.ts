import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, type User } from "../db/schema.js";
import { getSupabaseAdmin } from "../lib/supabaseAdmin.js";
import type { UserRole } from "../types.js";

interface AuthUser {
  id: string;
  email: string;
}

interface CreateClientUserInput {
  email: string;
  password: string;
  createdBy: string;
}

interface CreateLaboratoryUserInput {
  email: string;
  password: string;
}

interface CreateUserWithAuthInput {
  email: string;
  password: string;
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
  createdBy,
}: CreateClientUserInput): Promise<User> {
  return createUserWithAuth({
    email,
    password,
    role: "client",
    createdBy,
  });
}

export async function createLaboratoryUser({
  email,
  password,
}: CreateLaboratoryUserInput): Promise<User> {
  return createUserWithAuth({
    email,
    password,
    role: "laboratory",
  });
}

async function createUserWithAuth({
  email,
  password,
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
