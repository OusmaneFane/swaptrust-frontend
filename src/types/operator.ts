import type { ExchangeRequest } from './request';
import type { Transaction } from './transaction';
import type { User } from './user';

export type OperatorLogAction =
  | 'TAKEN'
  | 'CLIENT_PROOF_VIEWED'
  | 'OPERATOR_SENT'
  | 'COMPLETED'
  | 'NOTE';

export interface OperatorLog {
  id: number;
  transactionId: number;
  operator: User;
  action: OperatorLogAction;
  note: string | null;
  createdAt: string;
}

export interface TransactionDetail extends Transaction {
  operatorLogs: OperatorLog[];
  request: ExchangeRequest;
}
