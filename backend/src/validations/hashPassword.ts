import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10; // the cost factor; each +1 doubles the work

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

//const hash = await hashPassword("Noa!Pass101");
// "$2b$10$N9qo8uLOickgx2ZMRZoMye..."  (60 characters)
