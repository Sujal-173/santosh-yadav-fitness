import 'dotenv/config';
import { connectInfrastructure, infrastructureHealth, closeInfrastructure } from '../server/database';
try {
  await connectInfrastructure();
  const health = await infrastructureHealth();
  console.log(JSON.stringify(health, null, 2));
  if (!health.mongodb || !health.redis) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await closeInfrastructure();
}
