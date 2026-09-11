
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { app } from './app.js';

const start = async () => {
  await connectDatabase();
  app.listen(env.PORT, () => {
    console.log(`BlockCertify API running on port ${env.PORT}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
