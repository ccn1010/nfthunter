import Web3 from 'web3';
import { config } from './config';
import { strict as assert } from 'assert';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { getContractContentList, parseSourceCodeObject } from './util';
import solc from 'solc';

@Injectable()
export class Mint {
  web3;
  mintFnData;
  estimatedGas;
  config;
  mintConfig: any;
  contract;
  floor;
  loss;
  earn;
  price;

  constructor() {
    this.web3 = new Web3(
      new Web3.providers.WebsocketProvider(
        // `https://ropsten.infura.io/v3/e9680c370f374ef4bad3f5f654317e9a`
        `wss://ropsten.infura.io/ws/v3/e9680c370f374ef4bad3f5f654317e9a`,
      ),
    );
    this.config = config;
  }

  async getContractSourceCodes(contractAddress: string) {
    const result = await axios
      .get('https://api.etherscan.io/api', {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address: contractAddress,
          apikey: 'XC3945P8NJNGAEBKEIDWTDB39VJG6YPZFN',
        },
      })
      .catch((e) => {
        console.log(e);
        return null;
      });
    return result.data.result;
  }

  async deployContract(codeDatas, callback) {
    const network = 'eth';
    const codeData = codeDatas[0];
    const sourceCode = parseSourceCodeObject(codeData.SourceCode, network);
    const contractContents = getContractContentList(codeDatas, network);
    // setContract({
    //     name: sourceCodes[0].ContractName,
    //     address: contractAddress,
    //     contents: contractContents,
    // });
    console.log('sourceCodesourceCodesourceCode', sourceCode);

    const sources = {};
    contractContents.forEach((item) => {
      sources[item.path] = {
        content: item.content,
      };
    });
    const input = {
      language: sourceCode.language,
      sources: sources,
      settings: sourceCode.settings,
    };

    const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
    // const contractFile = tempFile.contracts['contract.sol']['SAC'];
    console.log('tempFile.contracts', tempFile);
    const contractFile = tempFile.contracts['contracts/cpgpop.sol']['CPGPOP'];

    const bytecode = contractFile.evm.bytecode.object;
    const abi = contractFile.abi;
    // console.log('abi', contractFile)
    const contractConstructor = abi.find((item) => {
      return item.type === 'constructor';
    });
    const argArray = contractConstructor.inputs;
    const argTypeArray = argArray.map((item) => item.type);
    console.log('argArray', argTypeArray);

    // const privKey = 'ac0fb8ad4fc8ce7469acd3cfe273f3f2f05ceae9a752fd201da5e4a63537df55'; // Genesis private key
    // const address = '0xf1d03d17b5C888521DB8bd136d85d8752dce3f89';
    // const web3 = new Web3(new Web3.providers.WebsocketProvider(
    //     `http://127.0.0.1:8545`
    // ));
    // Deploy contract

    const deploy = async () => {
      // const trxs = await axios.get(
      //     'https://api.etherscan.io/api'
      //     , {
      //         params: {
      //             module: 'account',
      //             action: 'txlist',
      //             address: contractAddress,
      //             startblock: 0,
      //             endblock: 99999999,
      //             page: 1,
      //             offset: 1,
      //             sort: 'asc',
      //             apikey: 'XC3945P8NJNGAEBKEIDWTDB39VJG6YPZFN',
      //         },
      //     }).catch(e=>{
      //         console.log(e)
      //         return null;
      //     })
      // console.log('trxs', )
      // const trx = trxs.data.result[0];
      // const argsInput = trx.input.replace(bytecode, '');
      // console.log('argsInputargsInput', sourceCodes[0].ConstructorArguments, argsInput)
      const argsObj = this.web3.eth.abi.decodeParameters(
        argTypeArray,
        codeData.ConstructorArguments,
      );
      const convert = (value, valueType) => {
        if (valueType.indexOf('uint') !== -1) {
          return parseInt(value);
        }
        return value;
      };
      console.log('args', argsObj);

      // console.log('Attempting to deploy from account:', address);
      // console.log('incrementerTx.encodeABI()', bytecode)
      const incrementer = new this.web3.eth.Contract(abi);
      const cargs = Object.entries(argsObj)
        .filter((item) => item[0] !== '__length__')
        .map((item, index) => {
          const argType = argTypeArray[index];
          console.log('argType', argType, index);

          const value = item[1];
          // if(Array.isArray(value)){
          //     value = value.map(item=>convert(item, argType));
          // } else {
          //     value = convert(value, argType);
          // }
          return value;
        });
      const incrementerTx = incrementer.deploy({
        data: bytecode,
        arguments: cargs,
      });

      const estimatedGas = await this.web3.eth.estimateGas({
        from: this.config.fromAddress,
        data: incrementerTx.encodeABI(),
      });
      console.log('estimatedGas', estimatedGas);

      const createTransaction = await this.web3.eth.accounts.signTransaction(
        {
          from: this.config.fromAddress,
          data: incrementerTx.encodeABI(),
          gas: estimatedGas,
        },
        this.config.privateKey,
      );
      const createReceipt = await this.web3.eth
        .sendSignedTransaction(createTransaction.rawTransaction)
        .on('receipt', function (receipt) {
          console.log('receipt', receipt);
          callback(null, receipt);
        })
        .on('error', (error) => {
          callback(error);
        });
      console.log(
        'Contract deployed at address',
        createReceipt.contractAddress,
      );
    };
    deploy();
  }

  setConfig(config) {
    this.config = config;
  }

  // 每次产生新区块的时候执行 warmup
  async warmup(abi, mintFn, contractAddress) {
    const contract = new this.web3.eth.Contract(abi, contractAddress);
    this.contract = contract;
    const extraData = await contract.methods[mintFn.method](...mintFn.args);
    this.mintFnData = extraData.encodeABI();
    this.estimatedGas = 1000000;
    // console.log(
    //   'this.estimatedGas begin',
    //   this.config.fromAddress,
    //   this.mintFnData,
    //   contractAddress,
    //   this.price,
    // );
    // this.estimatedGas = await this.web3.eth.estimateGas({
    //   from: this.config.fromAddress,
    //   data: this.mintFnData,
    //   to: contractAddress,
    //   value: this.price,
    // });
    // console.log('this.estimatedGas', this.estimatedGas);
  }

  callMethod(abi, contractAddress, method, args = []) {
    const contract = new this.web3.eth.Contract(
      JSON.parse(abi),
      contractAddress,
    );
    console.log('methodmethodmethod', method, args);
    return contract.methods[method](...args).call();
    // return contract.methods[method](...args).call({from: this.config.fromAddress}, (error)=>{
    //     console.log('eeeee', error)
    // });
  }

  async sendMethod(abi, contractAddress, method, args = []) {
    const contract = new this.web3.eth.Contract(
      JSON.parse(abi),
      contractAddress,
    );
    console.log('methodmethodmethod', method, args);
    const extraData = await contract.methods[method](...args);
    const data = extraData.encodeABI();
    const transaction: any = {
      gas: 100000,
      to: contractAddress,
      data: this.web3.utils.toHex(data),
    };
    const signedTx = await this.web3.eth.accounts.signTransaction(
      transaction,
      config.privateKey,
    );
    this.web3.eth
      .sendSignedTransaction(signedTx.rawTransaction)
      .on('receipt', (...args) => {
        console.log('SEND METHOD', args);
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
    this.config.walletList.forEach(async (wallet) => {
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
