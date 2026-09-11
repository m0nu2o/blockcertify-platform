
import { Schema, model, Document, Types } from 'mongoose';

export interface IBlockchainTransaction extends Document {
  certificate?: Types.ObjectId;
  action: 'issue' | 'verify' | 'revoke' | 'update';
  network: string;
  contractAddress?: string;
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: string;
  walletAddress?: string;
  status: 'pending' | 'confirmed' | 'failed';
  payload: Record<string, unknown>;
  errorMessage?: string;
}

const BlockchainTransactionSchema = new Schema<IBlockchainTransaction>(
  {
    certificate: { type: Schema.Types.ObjectId, ref: 'Certificate', index: true },
    action: { type: String, enum: ['issue', 'verify', 'revoke', 'update'], required: true },
    network: { type: String, required: true, default: 'ethereum' },
    contractAddress: { type: String },
    transactionHash: { type: String, required: true, unique: true, index: true },
    blockNumber: { type: Number },
    gasUsed: { type: String },
    walletAddress: { type: String },
    status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
    payload: { type: Schema.Types.Mixed, default: {} },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export default model<IBlockchainTransaction>('BlockchainTransaction', BlockchainTransactionSchema);
