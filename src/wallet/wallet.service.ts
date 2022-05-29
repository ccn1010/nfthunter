import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletEntity } from './wallet.entity';
import { CreateWalletDto } from './dto';

import { WalletRO, WalletsRO } from './wallet.interface';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
  ) {}

  async findAll(query): Promise<WalletsRO> {
    const qb = await this.walletRepository.createQueryBuilder('wallet');

    qb.where('1 = 1');

    if ('symbol' in query) {
      qb.andWhere('wallet.symbol = :symbol', { symbol: query.symbol });
    }

    if ('tag' in query) {
      qb.andWhere('wallet.tag = :tag', { symbol: query.symbol });
    }

    const walletsCount = await qb.getCount();

    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }

    const wallets = await qb.getMany();

    return { wallets, walletsCount };
  }

  async findOne(where): Promise<WalletRO> {
    const wallet = await this.walletRepository.findOneByOrFail(where);
    return { wallet };
  }

  async create(
    walletData: Partial<CreateWalletDto>,
  ) {
    const wallet = new WalletEntity();
    wallet.address = walletData.address;
    wallet.privateKey = walletData.privateKey;
    wallet.net = walletData.net;

    const newWallet = await this.walletRepository.insert(wallet);
    return newWallet;
  }

  async update(address: string, walletData: Partial<CreateWalletDto>) {
    await this.walletRepository.update(address, walletData);
  }

  async clear(): Promise<void> {
    const ret = await this.walletRepository.clear();
    return ret;
  }

  async remove(contractAddress: string): Promise<any> {
    const ret = await this.walletRepository.delete(contractAddress);
    return ret;
  }
}
