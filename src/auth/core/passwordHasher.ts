import bcrypt from "bcryptjs";

const bcryptTyped = bcrypt as {
  hash: (data: string, salt: string, callback: (err: Error | null, hash: string) => void) => void;
  compare: (data: string, encrypted: string) => Promise<boolean>;
  genSalt: (rounds: number) => Promise<string>;
};

export function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcryptTyped.hash(password.normalize(), salt, (err, hash) => {
      if (err) reject(new Error(err.message));
      if (hash) resolve(hash);
    });
  });
}

export async function comparePasswords({
  userPassword, 
  unhashedPassword,
}: {
  userPassword: string, 
  unhashedPassword: string, 
}): Promise<boolean> {
  return bcryptTyped.compare(unhashedPassword, userPassword);
}

export function generateSalt(): Promise<string> {
  return bcryptTyped.genSalt(10);
}