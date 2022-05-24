import { Injectable } from '@nestjs/common';
import abiDecoder from 'abi-decoder';
import { Mint } from './mint';

enum Step {
  Listen = 'LISTEN',
}

@Injectable()
export class ToggleMint extends Mint {
  owner;

  getPrice() {
    return this.price;
  }

  async boot(collection) {
    console.log('BOOT==============');
    const { mintConfig } = collection;
    const abi = JSON.parse(collection.abi);
    const readFns = [];
    const writeFns = [];
    abi.forEach((item) => {
      if (item.type !== 'function') {
        return;
      }

      if (item.stateMutability === 'view') {
        readFns.push(item);
      } else {
        writeFns.push(item);
      }
    });

    this.price = await this.callMethod(
      collection.abi,
      collection.ropstenContractAddress,
      readFns[mintConfig.priceRead.method].name,
      mintConfig.priceRead.args,
    );
    console.log('this.price', this.price);
    this.owner = await this.callMethod(
      collection.abi,
      collection.ropstenContractAddress,
      readFns[mintConfig.ownerRead.method].name,
      mintConfig.ownerRead.args,
    );

    const mintFn = {
      method: writeFns[mintConfig.mintWrite.method].name,
      args: mintConfig.mintWrite.args,
    };
    await this.warmup(abi, mintFn, collection.ropstenContractAddress);

    this.web3.eth.subscribe('newBlockHeaders', async (block) => {
      this.price = await this.callMethod(
        collection.abi,
        collection.ropstenContractAddress,
        readFns[mintConfig.priceRead.method].name,
        mintConfig.priceRead.args,
      );
      this.owner = await this.callMethod(
        collection.abi,
        collection.ropstenContractAddress,
        readFns[mintConfig.ownerRead.method].name,
        mintConfig.ownerRead.args,
      );
    });

    const isSaleActive = await this.callMethod(
      collection.abi,
      collection.ropstenContractAddress,
      readFns[mintConfig.saleActiveRead.method].name,
      mintConfig.saleActiveRead.args,
    );

    if (isSaleActive) {
      return;
    }

    console.log('TOGGLE TEST START==============');
    abiDecoder.addABI(abi);
    this.web3.eth
      .subscribe('pendingTransactions')
      .on('data', async (trxHash) => {
        let transaction = await this.web3.eth.getTransaction(trxHash);
        if (!transaction) {
          transaction = await this.web3.eth.getTransaction(trxHash);
        }
        if (!transaction) {
          transaction = await this.web3.eth.getTransaction(trxHash);
        }
        if (!transaction) {
          transaction = await this.web3.eth.getTransaction(trxHash);
        }
        if (!transaction) return;

        const auther = transaction.from;

        const decodedData = abiDecoder.decodeMethod(transaction.input);
        // console.log('blockHeader', blockHeader)
        if (!decodedData) {
          return;
        }
        console.log('TRX', transaction, decodedData, auther);

        if (
          decodedData.name !== writeFns[mintConfig.saleActiveWrite.method].name
        ) {
          return;
        }

        if (auther.toLowerCase() !== this.owner.toLowerCase()) {
          return;
        }

        console.log('FIND TOGGLE');

        this.send(
          collection.ropstenContractAddress,
          transaction.maxPriorityFeePerGas,
          transaction.maxFeePerGas,
        );
      });
  }
}
