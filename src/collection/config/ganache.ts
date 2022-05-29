import { Net } from 'src/global.types';
import Web3 from 'web3';

export const config = {
    net: Net.Ganache,
    // web3Provider: new Web3.providers.HttpProvider(
    web3Provider: new Web3.providers.WebsocketProvider(
        'HTTP://127.0.0.1:8545'
    ),
    contractAddressColumn: 'ganacheContractAddress',
    privateKey: '585a276b1555a15fbc8eabcf69835f07e70736c8c4b52ba5f46da2bdb35d1ee6',
    fromAddress: '0x747B97C5802583f739B0FCDcad1A467299b890d4'.toLocaleLowerCase(),
};