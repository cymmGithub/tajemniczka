import bcrypt from "bcryptjs";

const ROUNDS = 12;
const MIN_LEN = 4;

export async function hashPassword(plain: string): Promise<string> {
  if (!plain || plain.length < MIN_LEN) throw new Error("password too short");
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}
