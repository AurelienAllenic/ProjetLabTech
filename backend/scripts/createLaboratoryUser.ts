import { createLaboratoryUser, UserAlreadyExistsError } from "../services/usersService.js";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Usage: npm run user:create-lab -- <email> <password>");
  process.exit(1);
}

try {
  const user = await createLaboratoryUser({ email, password });
  console.log(`Laboratory user created: ${user.email} (${user.id})`);
} catch (error) {
  if (error instanceof UserAlreadyExistsError) {
    console.error("A user with this email already exists.");
    process.exit(1);
  }

  throw error;
}
