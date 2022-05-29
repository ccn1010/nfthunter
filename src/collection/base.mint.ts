import Web3 from 'web3';
import { config } from './config';
import { strict as assert } from 'assert';
import { Injectable } from '@nestjs/common';

export class BaseMint {
  web3;
  mintFnData;
  estimatedGas;
  config;
  floor;
  loss;
  earn;
  price;
  walletList;

  constructor(net) {
    const conf = config[net];
    this.web3 = new Web3(conf.web3Provider);
    this.config = config;
  }

  // TODO 每次产生新区块的时候执行 warmup
  async warmup(abi, mintFn, contractAddress, walletList) {
    const contract = new this.web3.eth.Contract(abi, contractAddress);
    const extraData = await contract.methods[mintFn.method](...mintFn.args);
    this.mintFnData = extraData.encodeABI();
    this.estimatedGas = 1000000;
    this.walletList = walletList;
  }

  async send(contractAddress, maxPriorityFeePerGas?, maxFeePerGas?) {
    // const cost = this.floor*(1 - this.loss - this.earn);
    // const bid = this.config.price + maxPriorityFeePerGas;
    // assert.ok((cost - bid) > 0, '没有盈利空间');
    this.walletList.forEach(async (wallet) => {
      const transaction: any = {
        gas: this.estimatedGas,
        to: contractAddress,
        value: this.price,
        data: this.web3.utils.toHex(this.mintFnData),
      };

      if (maxPriorityFeePerGas) {
        transaction.maxPriorityFeePerGas = maxPriorityFeePerGas;
      }
      if (maxFeePerGas) {
        transaction.maxFeePerGas = maxFeePerGas;
      }

      const signedTx = await this.web3.eth.accounts.signTransaction(
        transaction,
        wallet.privateKey,
      );

      return this.web3.eth
        .sendSignedTransaction(signedTx.rawTransaction)
        .on('receipt', (...args) => {
          console.log('rrrrrrr', args);
        });
    });
  }
}
