import { Net } from '../../global.types';
import { config as ganacheConfig } from './ganache';
import { config as mainnetCofig } from './mainnet';
import { config as ropstenConfig } from './ropsten';

export const config = {
    [Net.Ganache]: ganacheConfig,
    [Net.Ropsten]: ropstenConfig,
    [Net.Mainnet]: mainnetCofig,
};