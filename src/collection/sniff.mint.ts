import axios from 'axios';
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

export class SniffMint extends Mint {
  private static _instanceMap = new Map<Net, SniffMint>();
  bootedAt = 0;
  subscription;
  contract;
  mintedSet = new Set();

  static getInstance(net: Net) {
    const key = net;
    let instance = SniffMint._instanceMap.get(key);
    if(!instance){
      instance = new SniffMint(net);
      SniffMint._instanceMap.set(key, instance);
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

  async boot(callback) {
    this.bootedAt = Date.now();
    this.walletList = this.config.walletList;
    this.price = 0;
    console.log('SINFF BOOT==============', this.net);

    this.subscription = this.web3.eth.subscribe('newBlockHeaders').on("data", async (blockHeader) => {
      console.log('NEW BLOCK', blockHeader.number);
      // const block = await this.web3.eth.getBlock(14672945, true);
      let block = await this.web3.eth.getBlock(blockHeader.number, true);
      // 会出现block为null的情况
      if(!block){
        block =  await this.web3.eth.getBlock(blockHeader.number, true);
      }
      if(!block){
        console.log('BLOCK IS NULL', blockHeader.number);
        return;
      }
      const transactions = block.transactions;
      transactions.forEach(async trx => {
        if(trx.to !== null){
          return;
        }
        
        const reciept = await this.web3.eth.getTransactionReceipt(trx.hash);
        if(!reciept?.status){
          return;
        }

        const isNFT = await this.verifyIsNFT(reciept.contractAddress);
        if(!isNFT){
          return;
        }

        callback({
          address: reciept.contractAddress,
        });
        // console.log('FIND NFT CONTRACT', reciept.contractAddress, trx.hash);
        // console.log('FIND NFT CONTRACT', reciept.contractAddress, trx.hash, trx);
      });
    });
  }
}
