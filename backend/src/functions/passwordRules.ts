import bcrypt from "bcryptjs";

export async function verifyPassword(
  plainPassword: string,
  storedHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, storedHash);
}
