
import { Schema, model, Document, Types } from 'mongoose';

export interface IBlockchainTransaction extends Document {
  certificate?: Types.ObjectId;
  action: 'issue' | 'verify' | 'revoke' | 'update';
  network: string;
  chainId?: string;
  contractAddress?: string;
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: string;
  walletAddress?: string;
  status: 'pending' | 'confirmed' | 'failed';
  payload: Record<string, unknown>;
  errorMessage?: string;
  submittedAt?: Date;
  confirmedAt?: Date;
}

const BlockchainTransactionSchema = new Schema<IBlockchainTransaction>(
  {
    certificate: { type: Schema.Types.ObjectId, ref: 'Certificate', index: true },
    action: { type: String, enum: ['issue', 'verify', 'revoke', 'update'], required: true },
    network: { type: String, required: true, default: 'ethereum' },
    chainId: { type: String },
    contractAddress: { type: String },
    transactionHash: { type: String, required: true, unique: true, index: true },
    blockNumber: { type: Number },
    gasUsed: { type: String },
    walletAddress: { type: String },
    status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending', index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    errorMessage: { type: String },
    submittedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date },
  },
  { timestamps: true }
);

BlockchainTransactionSchema.index({ status: 1, createdAt: -1 });

export default model<IBlockchainTransaction>('BlockchainTransaction', BlockchainTransactionSchema);
