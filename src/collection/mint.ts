import Web3 from 'web3';
import { config } from './config';
import { strict as assert } from 'assert';
import { Injectable } from '@nestjs/common';
import { Net } from 'src/global.types';

export class Mint {
  web3;
  mintFnData;
  estimatedGas;
  config;
  floor;
  loss;
  earn;
  price;
  walletList;

  constructor(net: Net) {
    const conf = config[net];
    this.web3 = new Web3(conf.web3Provider);
    this.config = conf;
  }

  // TODO 每次产生新区块的时候执行 warmup
  async warmup(abi, mintFn, contractAddress, walletList) {
    const contract = new this.web3.eth.Contract(abi, contractAddress);
    const extraData = await contract.methods[mintFn.method](...mintFn.args);
    this.mintFnData = extraData.encodeABI();
    this.estimatedGas = 1000000;
    this.walletList = walletList;
  }

  callMethod(abi, contractAddress, method, args = []) {
    // TODO contract 写到 this 上
    const contract = new this.web3.eth.Contract(
      JSON.parse(abi),
      contractAddress,
    );
    console.log('CALL METHOD', method, args);
    return contract.methods[method](...args).call();
  }

  async sendMethod(abi, contractAddress, method, args = []) {
    const contract = new this.web3.eth.Contract(
      JSON.parse(abi),
      contractAddress,
    );
    console.log('SEND METHOD', method, args);
    const extraData = await contract.methods[method](...args);
    const data = extraData.encodeABI();
    const nonce = await this.web3.eth.getTransactionCount(this.config.fromAddress);
    console.log('nonce', nonce);
    const transaction: any = {
      // nonce: nonce + 1,
      gas: 1000000,
      to: contractAddress,
      data: this.web3.utils.toHex(data),
    };
    if(this.config.net !== Net.Ganache) {
      transaction.maxPriorityFeePerGas = this.web3.utils.toWei('2.5', 'gwei');
    }
    console.log('this.config.privateKey', this.config.privateKey)
    const signedTx = await this.web3.eth.accounts.signTransaction(
      transaction,
      this.config.privateKey,
    );
    this.web3.eth
      .sendSignedTransaction(signedTx.rawTransaction)
      .on('error', (error) => {
        console.log('SEND METHOD ERROR', error);
      })
      .on('receipt', (...args) => {
        console.log('SEND METHOD DONE', args);
      });
    // TODO 使用alchemy的api
    // return contract.methods[method](...args).send({from: this.config.fromAddress}, (error)=>{
    //     console.log('eeeee', error)
    // });
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
