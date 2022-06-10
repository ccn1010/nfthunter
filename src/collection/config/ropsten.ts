import { Net } from 'src/global.types';
import Web3 from 'web3';

export const config = {
    net: Net.Ropsten,
    web3Provider: new Web3.providers.WebsocketProvider(
        'wss://ropsten.infura.io/ws/v3/e9680c370f374ef4bad3f5f654317e9a'
    ),
    contractAddressColumn: 'ropstenContractAddress',
    privateKey: 'd99e7bc208b7f3eee8aec1d0385b927070032dc8750756cc11601032dc557663',
    address: '0x0e089763d463a17E0C907897A32F9e9Eb6Fa514a'.toLocaleLowerCase(),
    walletList: [
        {
            privateKey: '78627cc25cfd9147bf5934dd07cec61a72c4eddc7b9827566824afd6196c3951',
            address: '0x8751cB6Eff64bAc07f772Bc902b07264f21b9B84',
        },
        {
            privateKey: '264d9d3680533b09336a874a0a3482ac23f1e3cc646d982899d77d435b8868c0',
            address: '0x6122b159162112f806720F01add6E5fCB9316039',
        },
        {
            privateKey: 'a38cfaccedab2e32df183fb93902214a762ac1b3e738c3c5be07d2d74bdf1550',
            address: '0x397496C674e63C10261AA134ED2178b5EF1e3D23',
        },
    ],
    mintedNum: 2,
};