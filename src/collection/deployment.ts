import Web3 from 'web3';
import { config } from './config';
import { strict as assert } from 'assert';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { getContractContentList, parseSourceCodeObject } from './util';
import solc from 'solc';

@Injectable()
export class Deployment {
  web3;
  config;

  constructor() {
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(
        // 'http://ropsten.infura.io/ws/v3/e9680c370f374ef4bad3f5f654317e9a'
        'HTTP://127.0.0.1:8545'
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

  getContracts(codeDatas) {
    const network = 'eth';
    const codeData = codeDatas[0];
    const sourceCode = parseSourceCodeObject(codeData.SourceCode, network);
    const contractContents = getContractContentList(codeDatas, network);
    // setContract({
    //     name: sourceCodes[0].ContractName,
    //     address: contractAddress,
    //     contents: contractContents,
    // });

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
    return tempFile.contracts;
  }

  async deployContract(codeDatas, contractPath, callback) {
    console.log('contractPath', contractPath, Array.isArray(contractPath))
    const codeData = codeDatas[0];
    let contractFile = this.getContracts(codeDatas);
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
}
