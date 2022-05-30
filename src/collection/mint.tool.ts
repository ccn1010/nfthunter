import Web3 from 'web3';
import { config } from './config';
import { strict as assert } from 'assert';

export class MintTool {
  web3;
  config;
  private static _instanceMap = new Map();

  static getInstance(net) {
    const key = net;
    let instance = MintTool._instanceMap.get(key);
    if(!instance){
      instance = new MintTool(net);
      MintTool._instanceMap.set(key, instance);
    }
    
    return instance;
  }

  constructor(net) {
    const conf = config[net];
    this.web3 = new Web3(conf.web3Provider);
    this.config = config;
  }

  callMethod(abi, contractAddress, method, args = []) {
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
    const nonce = await this.web3.eth.getTransactionCount(this.config.address);
    console.log('nonce', nonce);
    const transaction: any = {
      maxPriorityFeePerGas: this.web3.utils.toWei('2.5', 'gwei'),
      // nonce: nonce + 1,
      gas: 1000000,
      to: contractAddress,
      data: this.web3.utils.toHex(data),
    };
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
    // return contract.methods[method](...args).send({from: this.config.address}, (error)=>{
    //     console.log('eeeee', error)
    // });
  }

}
