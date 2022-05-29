import { WalletEntity } from './wallet.entity';

export interface WalletRO {
  wallet: WalletEntity;
}

export interface WalletsRO {
  wallets: WalletEntity[];
  walletsCount: number;
}
