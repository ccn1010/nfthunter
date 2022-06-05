import { Net } from 'src/global.types';
import { Mint } from './mint';
import { config } from './config';


export class FreeMint extends Mint {
  private static _instanceMap = new Map<Net, FreeMint>();
  bootedAt = 0;
  subscription;
  mintedSet = new Set();

  static getInstance(net: Net) {
    const key = net;
    let instance = FreeMint._instanceMap.get(key);
    if(!instance){
      instance = new FreeMint(net);
      FreeMint._instanceMap.set(key, instance);
    }
    
    return instance;
  }

  constructor(net) {
    super(net, '');
  }

  toJSON() {
    return {
      bootedAt: this.bootedAt,
      net: this.net,
    };
  }

  shutdown() {
    this.bootedAt = 0;
    this.subscription.unsubscribe();
  }

  async boot() {
    this.bootedAt = Date.now();
    this.walletList = this.config.walletList;
    this.price = 0;
    console.log('FREE MINT BOOT==============', this.net);

    this.subscription = this.web3.eth.subscribe('newBlockHeaders').on("data", async (blockHeader) => {
      console.log('NEW BLOCK', blockHeader.number);
      const block = await this.web3.eth.getBlock(blockHeader.number, true);
      // 会出现block为null的情况
      if(!block){
        return;
      }
      const transactions = block.transactions;
      const map = new Map();
      transactions.forEach(trx=>{
        const value = trx.value;
        if(value !== '0') {
          return;
        }

        let list = map.get(trx.to);
        if(!list) {
          list = [];
          map.set(trx.to, list);
        }

        list.push(trx);
      });
      
      map.forEach(async (value, key) => {
        if(this.mintedSet.has(key)) {
          console.log('HAS BEEN MINTED', key);
          return;
        }
        // if(value.length > 5 || value[0].to === '0x247Fb5edF388d833Dc12455a5BD5bE7DEb04428D'){
        if(value.length > 10){
          console.log('value', value.length)
          // TODO 取 gas 费最低的
          const first = value[0];
          // const code = await this.web3.eth.getCode(first.to);
          console.log('FIND FREE', first.to);
          this.estimatedGas = first.gas;
          this.contractAddress = first.to;
          this.mintFnData = first.input;
          this.send(0, first.maxPriorityFeePerGas, first.maxFeePerGas);
          this.mintedSet.add(key);
        }
      });
    });
  }
}
