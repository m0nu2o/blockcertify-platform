
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { sha256 } from '../utils/hash.js';

const pinataHeaders = {
  Authorization: `Bearer ${env.PINATA_JWT}`,
};

// Certificate files/metadata are normally pinned to real IPFS via Pinata.
// That requires a free Pinata account and an API key, which is one more
// signup step than a beginner needs just to see a demo run end to end.
//
// When PINATA_JWT is not configured, we fall back to storing the same
// bytes on this server's local disk and serving them back over HTTP from
// the /files static route registered in app.ts. The rest of the app only
// ever deals with a { cid, url } pair, so nothing else needs to know which
// storage backend produced it. Add a real PINATA_JWT later to switch to
// genuine IPFS pinning without changing any other code.
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'uploads', 'ipfs-fallback');

const ensureLocalStorageDir = () => {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
};

const saveLocally = (buffer: Buffer, extension: string) => {
  ensureLocalStorageDir();
  const cid = `local-${sha256(buffer)}`;
  const fileName = `${cid}${extension}`;
  fs.writeFileSync(path.join(LOCAL_STORAGE_DIR, fileName), buffer);

  return {
    cid,
    url: `${env.SERVER_URL}/files/ipfs-fallback/${fileName}`,
  };
};

const isPinataConfigured = () => Boolean(env.PINATA_JWT);

export const pinFileToIpfs = async (buffer: Buffer, fileName: string) => {
  if (!isPinataConfigured()) {
    console.warn('[ipfsService] PINATA_JWT not set — storing certificate file locally instead of pinning to IPFS.');
    const extension = path.extname(fileName) || '.pdf';
    return saveLocally(buffer, extension);
  }

  const formData = new FormData();
  formData.append('file', buffer, { filename: fileName, contentType: 'application/pdf' });

  const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
    headers: { ...pinataHeaders, ...formData.getHeaders() },
    maxBodyLength: Infinity,
  });

  return {
    cid: response.data.IpfsHash,
    url: `${env.PINATA_GATEWAY}/ipfs/${response.data.IpfsHash}`,
  };
};

export const pinJsonToIpfs = async (payload: Record<string, unknown>) => {
  if (!isPinataConfigured()) {
    console.warn('[ipfsService] PINATA_JWT not set — storing certificate metadata locally instead of pinning to IPFS.');
    const buffer = Buffer.from(JSON.stringify(payload, null, 2));
    return saveLocally(buffer, '.json');
  }

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    { pinataContent: payload },
    { headers: { ...pinataHeaders, 'Content-Type': 'application/json' } }
  );

  return {
    cid: response.data.IpfsHash,
    url: `${env.PINATA_GATEWAY}/ipfs/${response.data.IpfsHash}`,
  };
};
