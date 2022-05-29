import { Injectable } from '@nestjs/common';
import abiDecoder from 'abi-decoder';
import { Net } from 'src/global.types';
import { CollectionEntity } from './collection.entity';
import { Mint } from './mint';

export class ScheduleMint extends Mint {
  mintQueue = [];
  saleAt = 0;
  baseFee;
  isListening = false;
  isMinted = false;

  private static _instanceMap = new Map();

  static getInstance(net: Net, collection: CollectionEntity) {
    const key = `${net}_${collection.contractAddress}`;
    let instance = ScheduleMint._instanceMap.get(key);
    if(!instance){
      instance = new ScheduleMint(net);
      ScheduleMint._instanceMap.set(key, instance);
    }
    
    return instance;
  }

  constructor(net) {
    super(net);
  }

  async boot(collection, walletList) {
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
    abiDecoder.addABI(abi);

    this.web3.eth
      .subscribe('newBlockHeaders')
      .on('data', async (blockHeader) => {
        this.mintQueue = [];
        // console.log('NEW BLOCK ============', new Date(parseInt(this.saleAt)));
        const beginTime = this.saleAt - 60;
        if (Date.now() / 1000 < beginTime) {
          return;
        }

        this.baseFee = await this.web3.eth.getGasPrice();
        this.saleAt = await this.callMethod(
          collection.abi,
          collection.contractAddress,
          readFns[mintConfig.saleAtRead.method].name,
          mintConfig.saleAtRead.args,
        );

        this.price = await this.callMethod(
          collection.abi,
          collection.contractAddress,
          readFns[mintConfig.priceRead.method].name,
          mintConfig.priceRead.args,
        );
      });

    setInterval(() => {
      if (!this.saleAt || this.isListening) {
        return;
      }
      this.listen(collection, abi, readFns, writeFns, mintConfig, walletList);
    }, 1000);
  }

  async listen(collection, abi, readFns, writeFns, mintConfig, walletList) {
    // const beginTime = this.saleAt - 10000;
    const beginTime = this.saleAt - 10;
    console.log(
      'dddd',
      new Date(),
      Date.now() / 1000 < beginTime,
      new Date(this.saleAt * 1000),
    );
    if (Date.now() / 1000 < beginTime) {
      return;
    }

    console.log('LISTENING =============');
    this.isListening = true;

    const mintFn = {
      method: writeFns[mintConfig.mintWrite.method].name,
      args: mintConfig.mintWrite.args,
    };
    await this.warmup(abi, mintFn, collection.contractAddress, walletList);

    const timer = setInterval(() => {
      if (this.isMinted) {
        return;
      }

      if (Math.ceil(Date.now() / 1000) < this.saleAt + 1) {
        return;
      }
      // if(this.mintQueue.length > 50 && this.mintQueue.length / 30)

      this.isMinted = true;
      clearInterval(timer);

      if (this.mintQueue.length < 1) {
        console.log('程序中断，没有人抢购!');
        return;
      }

      // const cost = Math.min(
      //   this.baseFee + max.maxPriorityFeePerGas,
      //   max.maxFeePerGas,
      // );
      const maxCost = parseInt(this.web3.utils.toWei('0.03', 'ether'));
      // FIXME 这里有问题，最大花费是 gasPrice * gasUsed,不是这里写的

      for (const item of this.mintQueue) {
        const curCost = item.gasPrice * 316849;
        if (curCost > maxCost) {
          console.log(`超出预算，需花费燃气${curCost}`);
          continue;
        }

        console.log('开始mint', item.maxPriorityFeePerGas, item.maxFeePerGas);
        this.send(
          collection.contractAddress,
          item.maxPriorityFeePerGas && item.maxPriorityFeePerGas + 1,
          item.maxFeePerGas && item.maxFeePerGas + 1,
        );
        return;
      }
      console.log('没mint成功', this.mintQueue);
    }, 500);

    this.web3.eth
      .subscribe('pendingTransactions')
      .on('data', async (trxHash) => {
        const transaction = await this.web3.eth.getTransaction(trxHash);
        if (!transaction) return;

        // const txGasPrice =
        //   transaction.maxFeePerGas && transaction.maxPriorityFeePerGas
        //     ? Math.min(
        //         this.baseFee + transaction.maxPriorityFeePerGas,
        //         transaction.maxFeePerGas,
        //       )
        //     : transaction.gasPrice;

        const decodedData = abiDecoder.decodeMethod(transaction.input);
        if (!decodedData) {
          return;
        }

        if (decodedData.name === writeFns[mintConfig.mintWrite.method].name) {
          const data = {
            maxFeePerGas: transaction.maxFeePerGas,
            maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
            gasPrice: transaction.gasPrice,
            hash: transaction.hash,
            // txGasPrice: txGasPrice,
          };
          this.mintQueue.push(data);
        }

        // this.mintQueue.sort((a, b) => {
        //   return b.maxFeePerGas - a.maxFeePerGas;
        // });
        this.mintQueue.sort((a, b) => {
          return b.gasPrice - a.gasPrice;
        });
      });
  }
}
