import { Net } from 'src/global.types';
import Web3 from 'web3';

export const config = {
    net: Net.Mainnet,
    web3Provider: new Web3.providers.WebsocketProvider(
        'wss://mainnet.infura.io/ws/v3/e9680c370f374ef4bad3f5f654317e9a',
    ),
    contractAddressColumn: 'contractAddress',
    privateKey: 'd99e7bc208b7f3eee8aec1d0385b927070032dc8750756cc11601032dc557663',
    address: '0x0e089763d463a17E0C907897A32F9e9Eb6Fa514a'.toLocaleLowerCase(),
    walletList: [
        {
            privateKey: '264d9d3680533b09336a874a0a3482ac23f1e3cc646d982899d77d435b8868c0',
            address: '0x6122b159162112f806720F01add6E5fCB9316039',
        },
    ],
};