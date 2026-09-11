
#!/usr/bin/env bash
set -e
npm install
npm install --workspace client
npm install --workspace server
npm install --workspace contracts
npm run dev
