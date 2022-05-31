import Web3 from 'web3';
import { strict as assert } from 'assert';
import axios from 'axios';
import solc from 'solc';
import { getContractContentList, isSingleFileContract, parseSourceCodeObject } from './util';
import { config } from './config';
import { Net } from 'src/global.types';

export class Deployment {
  web3;
  config;
  private static _instanceMap = new Map();

  static getInstance(net): Deployment {
    let instance = Deployment._instanceMap.get(net);
    if(!instance){
      instance = new Deployment(net);
      Deployment._instanceMap.set(net, instance);
    }
    
    return instance;
  }

  constructor(net) {
    console.log('1111111', net)
    const conf = config[net];
    this.web3 = new Web3(conf.web3Provider);
    this.config = conf;
  }

  static async getContractSourceCodes(contractAddress: string) {
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

  static getContracts(codeDatas) {
    const network = 'eth';
    const codeData = codeDatas[0];
    const isSingle = isSingleFileContract(codeData.SourceCode);
    let sourceCode;
    if(isSingle) {
      sourceCode = {
        language: 'Solidity',
        settings: {
          outputSelection: {
             '*': {
                '*': ['*'],
             },
          },
       },
      };
    }else{
      sourceCode = parseSourceCodeObject(codeData.SourceCode, network);
    }
    const contractContents = getContractContentList(codeDatas, network);

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
    // console.log('tempFile.contracts', tempFile);
    return tempFile.contracts;
  }

  async deployContract(codeDatas, contractPath, callback) {
    const codeData = codeDatas[0];
    let contractFile = Deployment.getContracts(codeDatas);
    contractPath.forEach((path) => {
      contractFile = contractFile[path];
    });

    const bytecode = contractFile.evm.bytecode.object;
    const abi = contractFile.abi;
    // console.log('abi', contractFile)
    const contractConstructor = abi.find((item) => {
      return item.type === 'constructor';
    });
    const argArray = contractConstructor.inputs;
    const argTypeArray = argArray.map((item) => item.type);

    const deploy = async () => {
      const argsObj = this.web3.eth.abi.decodeParameters(
        argTypeArray,
        codeData.ConstructorArguments,
      );

      const nftContract = new this.web3.eth.Contract(abi);
      const cargs = Object.entries(argsObj)
        .filter((item) => item[0] !== '__length__')
        .map((item, index) => {
          const value = item[1];
          return value;
        });
      console.log('CONTRACT CONSTRUCTOR', contractConstructor, cargs);
      const incrementerTx = nftContract.deploy({
        data: bytecode,
        arguments: cargs,
      });

      const estimatedGas = await this.web3.eth.estimateGas({
        from: this.config.address,
        data: incrementerTx.encodeABI(),
      });

      const trx: any = {
        from: this.config.address,
        data: incrementerTx.encodeABI(),
        gas: estimatedGas,
      };
      if(this.config.net !== Net.Ganache) {
        trx.maxPriorityFeePerGas = this.web3.utils.toWei('10', 'gwei');
      }
      const createTransaction = await this.web3.eth.accounts.signTransaction(
        trx,
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

}
