import { Injectable } from '@nestjs/common';
import abiDecoder from 'abi-decoder';
import { Mint } from './mint';

@Injectable()
export class ScheduleMint extends Mint {
  txQueue = [];
  mintQueue = [];
  mintMap = new Map();
  saleAt;
  baseFee;

  // setActiveFn() {

  // }

  async boot() {
    const blockSubscription = this.web3.eth
      .subscribe('newBlockHeaders')
      .on('data', async function (blockHeader) {
        console.log('\n\n\n\n\n\n\n\n\n\n\n\n\n\n');
        console.log('============NEW BLOCK');
        const block = await this.web3.eth.getBlock(blockHeader.number);
        console.log('BLOCK', block);

        this.baseFee = await this.web3.eth.getGasPrice();
        console.log('base Fee', this.baseFee);
        this.saleAt = await this.contract.methods.getMintAt();
      });

    this.saleAt = await this.contract.methods.getMintAt();

    if (!this.saleAt) {
      return;
    }
    const beginTime = this.saleAt - 1000 * 2;
    if (Date.now() < beginTime) {
      return;
    }

    blockSubscription.unsubscrible();

    this.web3.eth
      .subscribe('pendingTransactions')
      .on('data', async (trxHash) => {
        const transaction = await this.web3.eth.getTransaction(trxHash);
        if (!transaction) return;

        const txGasPrice = transaction.maxFeePerGas
          ? Math.min(
              this.baseFee + transaction.maxPriorityFeePerGas,
              transaction.maxFeePerGas,
            )
          : transaction.gasPrice;

        const data = {
          maxFeePerGas: transaction.maxFeePerGas,
          maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
          gasPrice: transaction.gasPrice,
          hash: transaction.hash,
          txGasPrice: txGasPrice,
        };
        this.txQueue.push(data);

        const decodedData = abiDecoder.decodeMethod(transaction.input);
        if (decodedData?.name === 'mint') {
          this.mintQueue.push(data);
          this.mintMap.set(txGasPrice, data);
        }
        this.mintQueue.sort((a, b) => {
          return b.gasPrice - a.gasPrice;
        });

        // if(this.mintQueue.length > 50 && this.mintQueue.length / 30)
        if (this.mintQueue.length < 50) {
          return;
        }

        const max = this.mintQueue[0];

        this.send(max.maxPriorityFeePerGas, max.maxFeePerGas);
      });
  }
}
