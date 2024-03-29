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
  net;
  contractAddress;

  constructor(net: Net, contractAddress: string) {
    const conf = config[net];
    this.web3 = new Web3(conf.web3Provider);
    this.config = conf;
    this.net = net;
    this.contractAddress = contractAddress;
  }

  // TODO 每次产生新区块的时候执行 warmup
  async warmup(abi, mintFn) {
    const contract = new this.web3.eth.Contract(abi, this.contractAddress);
    const extraData = await contract.methods[mintFn.method](...mintFn.args);
    this.mintFnData = this.web3.utils.toHex(extraData.encodeABI());
    this.estimatedGas = 1000000;
    this.walletList = this.config.walletList;
  }

  callMethod(abi, method, args = []) {
    // TODO contract 写到 this 上
    const contract = new this.web3.eth.Contract(
      JSON.parse(abi),
      this.contractAddress,
    );
    console.log('CALL METHOD', method, args);
    return contract.methods[method](...args).call();
  }

  async sendMethod(abi, method, args = []) {
    const contract = new this.web3.eth.Contract(
      JSON.parse(abi),
      this.contractAddress,
    );
    const wallet = this.config.walletList[0];
    console.log('SEND METHOD', method, args);
    const extraData = await contract.methods[method](...args);
    const data = extraData.encodeABI();
    // const nonce = await this.web3.eth.getTransactionCount(wallet.address);
    // console.log('nonce', nonce);
    // TODO 如果 method 是 payable 的，需要加 value 参数
    const transaction: any = {
      // nonce: nonce + 1,
      // value: '10000000',
      gas: 1000000,
      to: this.contractAddress,
      data: this.web3.utils.toHex(data),
    };
    if(this.config.net !== Net.Ganache) {
      transaction.maxPriorityFeePerGas = this.web3.utils.toWei('32', 'gwei');
    }
    const signedTx = await this.web3.eth.accounts.signTransaction(
      transaction,
      this.config.privateKey,
      // wallet.privateKey,
    );
    this.web3.eth
      .sendSignedTransaction(signedTx.rawTransaction)
      .once('error', (error) => {
        console.log('SEND METHOD ERROR', error);
      })
      .once('receipt', (...args) => {
        console.log('SEND METHOD CONFIRMED', method, args);
      })
      .catch(err=>{
        console.log('SEND METHOD FAILED', err);
      });
    // TODO 使用alchemy的api
    // return contract.methods[method](...args).send({from: this.config.address}, (error)=>{
    //     console.log('eeeee', error)
    // });
  }

  async send(mintNum, maxPriorityFeePerGas?, maxFeePerGas?) {
    // const cost = this.floor*(1 - this.loss - this.earn);
    // const bid = this.config.price + maxPriorityFeePerGas;
    // assert.ok((cost - bid) > 0, '没有盈利空间');
    this.walletList.forEach(async (wallet) => {
      if(wallet.isMinting) {
        console.log('WAITINT FOR CURRENT MINT DONE');
        return;
      }

      const transaction: any = {
        gas: this.estimatedGas,
        to: this.contractAddress,
        value: String(this.price * mintNum),
        data: this.mintFnData,
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

      console.log('MINT', wallet, transaction);
      wallet.isMinting = true;
      return this.web3.eth
        .sendSignedTransaction(signedTx.rawTransaction)
        .once('error', (error) => {
          console.log('MINT ERROR', error);
          wallet.isMinting = false;
        })
        .once('receipt', (...args) => {
          console.log('MINT CONFIRMED', args);
          wallet.isMinting = false;
        }).catch(err=>{
          console.log('MINT FAILED', err);
          wallet.isMinting = false;
        });
    });
  }
}
