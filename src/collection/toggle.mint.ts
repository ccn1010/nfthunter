import abiDecoder from 'abi-decoder';
import _ from 'lodash';
import { Net } from 'src/global.types';
import { CollectionEntity } from './collection.entity';
import { Mint } from './mint';
import { config } from './config';
import { isEquals } from './util';

enum Step {
  Listen = 'LISTEN',
}

export class ToggleMint extends Mint {
  owner;
  contractAddress;

  private static _instanceMap = new Map();

  static getInstance(net: Net, collection: CollectionEntity) {
    const conf = config[net];
    const contractAddress = collection[conf.contractAddressColumn];
    const key = `${net}_${contractAddress}`;
    let instance = ToggleMint._instanceMap.get(key);
    if(!instance){
      instance = new ToggleMint(net, contractAddress);
      ToggleMint._instanceMap.set(key, instance);
    }
    
    return instance;
  }

  constructor(net, contractAddress) {
    super(net, contractAddress);
  }

  getPrice() {
    return this.price;
  }

  async boot(collection) {
    console.log('TOGGLE MINT BOOT==============');
    const { mintConfig, profile } = collection;
    const abi = JSON.parse(collection.abi);
    const mintNum = parseInt(mintConfig.mintWrite.args[0]);
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

    this.price = (profile && 'price' in profile) ? profile.price : await this.callMethod(
      collection.abi,
      readFns[mintConfig.priceRead.method].name,
      mintConfig.priceRead.args,
    );

    console.log('PRICE', this.price);

    this.owner = (profile && 'owner' in profile) ? profile.owner : await this.callMethod(
      collection.abi,
      readFns[mintConfig.ownerRead.method].name,
      mintConfig.ownerRead.args,
    );

    const mintFn = {
      method: writeFns[mintConfig.mintWrite.method].name,
      args: mintConfig.mintWrite.args,
    };
    await this.warmup(abi, mintFn);

    this.web3.eth.subscribe('newBlockHeaders', async (block) => {
      this.price = (profile && 'price' in profile) ? profile.price : await this.callMethod(
        collection.abi,
        readFns[mintConfig.priceRead.method].name,
        mintConfig.priceRead.args,
      );
      this.owner = (profile && 'owner' in profile) ? profile.owner : await this.callMethod(
        collection.abi,
        readFns[mintConfig.ownerRead.method].name,
        mintConfig.ownerRead.args,
      );
    });

    // const isSaleActive = await this.callMethod(
    //   collection.abi,
    //   readFns[mintConfig.saleActiveRead.method].name,
    //   mintConfig.saleActiveRead.args,
    // );

    // if (isSaleActive) {
    //   console.log('ABORT! 合约已经是发售状态，终止监听');
    //   return;
    // }

    console.log('TOGGLE LISTEN START==============', this.net, this.contractAddress);
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

        if (
          decodedData.name !== writeFns[mintConfig.saleActiveWrite.method].name
        ) {
          console.log('sale method 不同', decodedData.name, writeFns[mintConfig.saleActiveWrite.method].name);
          return;
        }

        if (!isEquals(decodedData.params, mintConfig.saleActiveWrite.args)) {
          console.log('sale params 不同', decodedData.params, mintConfig.saleActiveWrite.args);
          return;
        }

        if (auther.toLowerCase() !== this.owner.toLowerCase()) {
          console.log('owner 不同', auther.toLowerCase(), this.owner.toLowerCase());
          return;
        }

        console.log('FIND TOGGLE');

        this.send(
          mintNum,
          transaction.maxPriorityFeePerGas,
          transaction.maxFeePerGas,
        );
      });
  }
}
