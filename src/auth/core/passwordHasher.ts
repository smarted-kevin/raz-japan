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

export async function createRandomString(length: number): Promise<string> {
  if (length < 8) {
    throw new Error("Must be at least 8 characters");
  }

  const numbers = "0123456789";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const specialChars = "!@#$%^&*()_-+={[}]|\\:;\"'<,>.?/";
  
  const allChars = numbers + uppercase + lowercase + specialChars;

  // Ensure at least one character from each required category
  let result = "";
  result += numbers[Math.floor(Math.random() * numbers.length)];
  result += uppercase[Math.floor(Math.random() * uppercase.length)];
  result += lowercase[Math.floor(Math.random() * lowercase.length)];
  result += specialChars[Math.floor(Math.random() * specialChars.length)];

  // Fill the remaining length with random characters from all categories
  for (let i = 4; i < length; i++) {
    result += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the result to avoid predictable patterns
  return result
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
