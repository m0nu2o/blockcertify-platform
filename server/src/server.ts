import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { app } from './app.js';
import { printBlockchainDiagnostics } from './services/blockchainService.js';

const start = async () => {
  await connectDatabase();

  // Print blockchain connection status once at startup (never logs secrets)
  await printBlockchainDiagnostics();

  app.listen(env.PORT, () => {
    console.log(`BlockCertify API running on port ${env.PORT}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
