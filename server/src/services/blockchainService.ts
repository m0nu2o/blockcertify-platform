import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import { env } from '../config/env.js';
import { sha256 } from '../utils/hash.js';
import { ApiError } from '../utils/ApiError.js';

const abi = [
  'function issueCertificate(string certificateId,string metadataHash,string fileHash,string metadataUri) external',
  'function revokeCertificate(string certificateId,string reason) external',
  'function updateCertificate(string certificateId,string metadataHash,string metadataUri) external',
  'function getCertificate(string certificateId) external view returns (tuple(string certificateId,string metadataHash,string fileHash,string metadataUri,bool revoked,uint256 issuedAt,uint256 updatedAt,address issuer,string reason))',
];

type OnChainCertificateRecord = {
  certificateId: string;
  metadataHash: string;
  fileHash: string;
  metadataUri: string;
  revoked: boolean;
  issuedAt: string;
  updatedAt: string;
  issuer: string;
  reason: string;
};

// ─── Centralized provider / contract singletons ────────────────────────────
let _provider: JsonRpcProvider | null = null;
let _wallet: Wallet | null = null;
let _readContract: Contract | null = null;
let _writeContract: Contract | null = null;
let _chainId: string = '31337';
let _rpcAvailable: boolean | null = null; // null = untested
let _rpcCheckedAt = 0;
const RPC_RECHECK_INTERVAL_MS = 30_000; // re-probe at most every 30s
let _startupDiagPrinted = false;

/**
 * Whether demo-mode simulation is enabled.
 * BLOCKCHAIN_DEMO_MODE must be explicitly set to 'true'.
 * Default is false — no fake transactions.
 */
const isDemoMode = (): boolean => {
  return (process.env.BLOCKCHAIN_DEMO_MODE || '').toLowerCase() === 'true';
};

const getProvider = (): JsonRpcProvider => {
  if (!_provider) {
    _provider = new JsonRpcProvider(env.ETH_RPC_URL, undefined, {
      staticNetwork: true,    // prevents auto-detect network calls
      batchMaxCount: 1,
    });
  }
  return _provider;
};

const probeRpc = async (force = false): Promise<boolean> => {
  const now = Date.now();
  if (!force && _rpcAvailable !== null && (now - _rpcCheckedAt) < RPC_RECHECK_INTERVAL_MS) {
    return _rpcAvailable;
  }
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    _chainId = network.chainId.toString();
    _rpcAvailable = true;
    _rpcCheckedAt = now;
    return true;
  } catch {
    _rpcAvailable = false;
    _rpcCheckedAt = now;
    return false;
  }
};

const getReadOnlyContract = async (): Promise<{ contract: Contract; chainId: string }> => {
  if (!env.ETH_CONTRACT_ADDRESS) {
    throw new ApiError(503, 'Blockchain contract address is not configured (ETH_CONTRACT_ADDRESS)');
  }
  const available = await probeRpc();
  if (!available) {
    throw new ApiError(503, 'Blockchain RPC node is unavailable. Start the Hardhat node or check ETH_RPC_URL.');
  }
  if (!_readContract) {
    _readContract = new Contract(env.ETH_CONTRACT_ADDRESS, abi, getProvider());
  }
  return { contract: _readContract, chainId: _chainId };
};

const getWritableContract = async (): Promise<{ contract: Contract; wallet: Wallet; chainId: string }> => {
  if (!env.ETH_PRIVATE_KEY) {
    throw new ApiError(503, 'Blockchain private key is not configured (ETH_PRIVATE_KEY)');
  }
  if (!env.ETH_CONTRACT_ADDRESS) {
    throw new ApiError(503, 'Blockchain contract address is not configured (ETH_CONTRACT_ADDRESS)');
  }
  const available = await probeRpc();
  if (!available) {
    throw new ApiError(503, 'Blockchain RPC node is unavailable. Start the Hardhat node or check ETH_RPC_URL.');
  }
  if (!_wallet) {
    _wallet = new Wallet(env.ETH_PRIVATE_KEY, getProvider());
  }
  if (!_writeContract) {
    _writeContract = new Contract(env.ETH_CONTRACT_ADDRESS, abi, _wallet);
  }
  return { contract: _writeContract, wallet: _wallet, chainId: _chainId };
};

// ─── Startup diagnostics (call once) ───────────────────────────────────────
export const printBlockchainDiagnostics = async (): Promise<void> => {
  if (_startupDiagPrinted) return;
  _startupDiagPrinted = true;

  const rpcConfigured = !!env.ETH_RPC_URL;
  const contractConfigured = !!env.ETH_CONTRACT_ADDRESS && ethers.isAddress(env.ETH_CONTRACT_ADDRESS);
  const privateKeyConfigured = !!env.ETH_PRIVATE_KEY && env.ETH_PRIVATE_KEY.length >= 32;
  const demoMode = isDemoMode();

  let status = 'OFFLINE';
  let reason = '';
  let chainId = '';

  if (rpcConfigured) {
    const available = await probeRpc(true);
    if (available) {
      status = 'CONNECTED';
      chainId = _chainId;
      // Validate contract bytecode exists at the configured address
      if (contractConfigured) {
        try {
          const code = await getProvider().getCode(env.ETH_CONTRACT_ADDRESS);
          if (!code || code === '0x') {
            status = 'CONTRACT_MISSING';
            reason = `No contract bytecode at ${env.ETH_CONTRACT_ADDRESS}. Redeploy with: cd contracts && npm run deploy:local`;
          }
        } catch {
          reason = 'Could not verify contract bytecode';
        }
      }
    } else {
      reason = `Hardhat node is not running at ${env.ETH_RPC_URL}`;
    }
  } else {
    reason = 'ETH_RPC_URL is not configured';
  }

  console.log('');
  console.log('[Blockchain]');
  console.log(`  RPC:        ${rpcConfigured ? 'configured' : 'NOT configured'}`);
  console.log(`  Network:    ${env.ETH_NETWORK_NAME || 'unknown'}`);
  if (chainId) console.log(`  Chain ID:   ${chainId}`);
  console.log(`  Contract:   ${contractConfigured ? env.ETH_CONTRACT_ADDRESS : 'NOT configured'}`);
  console.log(`  PrivateKey: ${privateKeyConfigured ? 'configured' : 'NOT configured'}`);
  console.log(`  Demo Mode:  ${demoMode ? 'ENABLED (simulated tx allowed)' : 'DISABLED'}`);
  console.log(`  Status:     ${status}`);
  if (reason) console.log(`  Reason:     ${reason}`);
  console.log('');
};

export const validateBlockchainConfig = () => {
  if (env.NODE_ENV === 'production') {
    if (!env.ETH_PRIVATE_KEY || env.ETH_PRIVATE_KEY.length < 32) {
      throw new Error('FATAL: ETH_PRIVATE_KEY is missing or invalid in production configuration');
    }
    if (!env.ETH_CONTRACT_ADDRESS || !ethers.isAddress(env.ETH_CONTRACT_ADDRESS)) {
      throw new Error('FATAL: ETH_CONTRACT_ADDRESS is missing or invalid in production configuration');
    }
    if (!env.ETH_RPC_URL) {
      throw new Error('FATAL: ETH_RPC_URL is missing in production configuration');
    }
  }
};

// ─── Health check ──────────────────────────────────────────────────────────
export const getBlockchainHealth = async () => {
  const rpcConfigured = !!env.ETH_RPC_URL;
  const contractConfigured = !!env.ETH_CONTRACT_ADDRESS && ethers.isAddress(env.ETH_CONTRACT_ADDRESS);
  const available = rpcConfigured ? await probeRpc(true) : false;
  let contractDeployed = false;

  if (available && contractConfigured) {
    try {
      const code = await getProvider().getCode(env.ETH_CONTRACT_ADDRESS);
      contractDeployed = !!code && code !== '0x';
    } catch {
      // ignore
    }
  }

  return {
    available,
    network: env.ETH_NETWORK_NAME || 'unknown',
    chainId: available ? _chainId : undefined,
    rpcConfigured,
    contractConfigured,
    contractDeployed,
    demoMode: isDemoMode(),
    error: !available && rpcConfigured
      ? `Blockchain RPC unavailable at ${env.ETH_RPC_URL}`
      : !rpcConfigured
        ? 'ETH_RPC_URL not configured'
        : undefined,
  };
};

// ─── Blockchain operations ─────────────────────────────────────────────────

const handleBlockchainError = (operation: string, err: unknown): never => {
  const msg = (err as Error)?.message || String(err);
  if (isDemoMode()) {
    // Even in demo mode, we throw — the caller decides to use simulation
    throw new ApiError(503, `Blockchain ${operation} failed: ${msg}`);
  }
  if (env.NODE_ENV === 'production') {
    throw new ApiError(503, `Blockchain ${operation} failed: ${msg}`);
  }
  throw new ApiError(503, `Blockchain ${operation} failed (RPC offline?): ${msg}`);
};

export type ChainOperationResult = {
  transactionHash: string;
  blockNumber: number | null;
  gasUsed?: string;
  walletAddress?: string;
  chainId: string;
  demo?: boolean;
};

const buildDemoResult = (certificateId: string, operation: string): ChainOperationResult => ({
  transactionHash: `0xDEMO_${sha256(certificateId + operation + Date.now())}`,
  blockNumber: null,
  gasUsed: '0',
  walletAddress: '0x0000000000000000000000000000000000000000',
  chainId: '31337',
  demo: true,
});

export const issueCertificateOnChain = async ({
  certificateId,
  metadataHash,
  fileHash,
  metadataUri,
}: {
  certificateId: string;
  metadataHash: string;
  fileHash: string;
  metadataUri: string;
}): Promise<ChainOperationResult> => {
  try {
    const { contract, wallet, chainId } = await getWritableContract();
    const tx = await contract.issueCertificate(certificateId, metadataHash, fileHash, metadataUri);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt?.hash ?? tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
      gasUsed: receipt?.gasUsed?.toString(),
      walletAddress: wallet.address,
      chainId,
      demo: false,
    };
  } catch (err: unknown) {
    if (isDemoMode()) {
      console.warn(`[blockchainService] Demo mode: simulating issueCertificateOnChain for ${certificateId}`);
      return buildDemoResult(certificateId, 'issue');
    }
    throw handleBlockchainError('issue', err);
  }
};

export const revokeCertificateOnChain = async (certificateId: string, reason: string): Promise<ChainOperationResult> => {
  try {
    const { contract, chainId } = await getWritableContract();
    const tx = await contract.revokeCertificate(certificateId, reason);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt?.hash ?? tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
      gasUsed: receipt?.gasUsed?.toString(),
      chainId,
      demo: false,
    };
  } catch (err: unknown) {
    if (isDemoMode()) {
      console.warn(`[blockchainService] Demo mode: simulating revokeCertificateOnChain for ${certificateId}`);
      return buildDemoResult(certificateId, 'revoke');
    }
    throw handleBlockchainError('revoke', err);
  }
};

export const updateCertificateOnChain = async (
  certificateId: string,
  metadataHash: string,
  metadataUri: string
): Promise<ChainOperationResult> => {
  try {
    const { contract, chainId } = await getWritableContract();
    const tx = await contract.updateCertificate(certificateId, metadataHash, metadataUri);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt?.hash ?? tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
      gasUsed: receipt?.gasUsed?.toString(),
      chainId,
      demo: false,
    };
  } catch (err: unknown) {
    if (isDemoMode()) {
      console.warn(`[blockchainService] Demo mode: simulating updateCertificateOnChain for ${certificateId}`);
      return buildDemoResult(certificateId, 'update');
    }
    throw handleBlockchainError('update', err);
  }
};

export const getCertificateOnChain = async (certificateId: string): Promise<OnChainCertificateRecord> => {
  try {
    const { contract } = await getReadOnlyContract();
    const record = await contract.getCertificate(certificateId);

    return {
      certificateId: record.certificateId,
      metadataHash: record.metadataHash,
      fileHash: record.fileHash,
      metadataUri: record.metadataUri,
      revoked: record.revoked,
      issuedAt: record.issuedAt.toString(),
      updatedAt: record.updatedAt.toString(),
      issuer: record.issuer,
      reason: record.reason,
    };
  } catch (err: unknown) {
    throw new ApiError(503, `Blockchain node unavailable: ${(err as Error)?.message || err}`);
  }
};

// Reset singletons (for testing)
export const _resetForTesting = () => {
  _provider = null;
  _wallet = null;
  _readContract = null;
  _writeContract = null;
  _rpcAvailable = null;
  _rpcCheckedAt = 0;
  _startupDiagPrinted = false;
};
