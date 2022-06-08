import { Net } from 'src/global.types';
import { Mint } from './mint';
import { config } from './config';

const ERC165Abi: any = [
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const ERC1155InterfaceId: string = "0xd9b67a26";
const ERC721InterfaceId: string = "0x80ac58cd";
// const myErc721Contract: string = "0xb43d4526b7133464abb970029f94f0c3f313b505";

export class FreeMint extends Mint {
  private static _instanceMap = new Map<Net, FreeMint>();
  bootedAt = 0;
  subscription;
  contract;
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

  async verifyIsNFT(address) {
    const isAddress = this.web3.utils.isAddress(address);
    if(!isAddress){
      return false;
    }
    
    const contract = new this.web3.eth.Contract(ERC165Abi, address);

    const p1 = contract.methods
      .supportsInterface(ERC1155InterfaceId)
      .call()
      .catch(()=>{
        return false;
      });
    const p2 = contract.methods
      .supportsInterface(ERC721InterfaceId)
      .call()
      .catch(()=>{
        return false;
      });

    const values = await Promise.all([p1, p2]);
    const ret = values.includes(true);
    return ret;
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
          console.log('HAS MINTED', key);
          return;
        }
        // if(value.length > 5 || value[0].to === '0x247Fb5edF388d833Dc12455a5BD5bE7DEb04428D'){
        if(value.length <= this.config.mintedNum){
          return;
        }
        
        // console.log('value', value.length)
        // // TODO 取 gas 费最低的
        const first = value[0];
        const isNFT = await this.verifyIsNFT(first.to);
        // console.log('isNFT', isNFT, this.config.mintedNum, value.length)
        if(!isNFT){
          return;
        }
        const code = await this.web3.eth.getCode(first.to);
        console.log('FIND FREE', first.to, block.number, value.length, this.config.mintedNum);
        this.estimatedGas = first.gas;
        this.contractAddress = first.to;
        this.mintFnData = first.input;
        this.send(0, first.maxPriorityFeePerGas, first.maxFeePerGas);
        this.mintedSet.add(key);
      });
    });
  }
}
