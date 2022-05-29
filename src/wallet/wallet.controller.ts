import { Get, Post, Body, Put, Query, Param, Controller, Delete } from '@nestjs/common';
import _ from 'lodash';
import { WalletService } from './wallet.service';
import { WalletsRO, WalletRO } from './wallet.interface';

@Controller('wallets')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
  ) {}

  @Get()
  async findAll(@Query() query): Promise<WalletsRO> {
    return await this.walletService.findAll(query);
  }

  @Get(':address')
  async findOne(@Param('address') address): Promise<WalletRO> {
    const entity = await this.walletService.findOne({
      contractAddress: address,
    });

    return entity;
  }

  @Put(':address')
  async put(@Param('address') address, @Body() body) {
    this.walletService.update(address, body);
  }

  @Post()
  async create(@Body() body) {
    const wallet = await this.walletService.create(body);
    return wallet;
  }

  @Delete(':address')
  async remove(@Param('address') address) {
    const ret = await this.walletService.remove(address);
    return ret;
  }

}
