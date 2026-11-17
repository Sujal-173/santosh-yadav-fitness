import { createPasswordHash } from '../server/authService';
const password = process.argv[2];
if (!password || password.length < 14) {
  console.error('Usage: npm run admin:hash -- "minimum-14-character-password"');
  process.exit(1);
}
console.log(createPasswordHash(password));
