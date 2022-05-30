import { Get, Post, Body, Put, Query, Param, Controller, Delete } from '@nestjs/common';
import _ from 'lodash';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto';
import { CollectionsRO, CollectionRO } from './collection.interface';
import { ToggleMint } from './toggle.mint';
import { EventsGateway } from 'src/events/events.gateway';
import { ScheduleMint } from './schedule.mint';
import { Deployment } from './deployment';
import { WalletService } from 'src/wallet/wallet.service';
import { MintType } from './collection.types';
import { Net } from 'src/global.types';
import { CollectionEntity } from './collection.entity';
import { config } from './config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const abiDecoder = require('abi-decoder');

@Controller('collections')
export class CollectionController {
  constructor(
    private readonly collectionService: CollectionService,
    // TODO ToggleMint 和 ScheduleMint 是用的使用实例化出来的，而不是在constructor里，扔出去
    private readonly eventsGateway: EventsGateway,
  ) {}

  getMint(net: Net, collection: CollectionEntity): ScheduleMint | ToggleMint {
    if(collection.mintType === MintType.Toggle) {
      return ToggleMint.getInstance(net, collection);
    } else if(collection.mintType === MintType.Schedule){
      return ScheduleMint.getInstance(net, collection);
    } else {
      throw new Error('Unknown mintType');
    }
  }

  @Get('test111')
  test() {
    const decodedData = abiDecoder.decodeMethod(
      '0x53d9d9100000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000a6d9c5f7d4de3cef51ad3b7235d79ccc95114de5000000000000000000000000a6d9c5f7d4de3cef51ad3b7235d79ccc95114daa',
    );
    // console.log('blockHeader', blockHeader)
    console.log('xxxxxx decodedData:', decodedData);
    this.eventsGateway.send('backtest', decodedData);
  }

  @Get('mint')
  async testMint(@Query() query) {
    // return await this.mint.boot();
    // await this.mint.deployContract('0x7Eaa96D48380802A75ED6d74b91E2B30c3d474C1');
    // await this.mint.warmup();
    // return await this.mint.send();
  }

  @Put()
  async update(@Body('collection') collectionData: CreateCollectionDto) {
    // await this.collectionService.update(collectionData);
  }

  @Get()
  async findAll(@Query() query): Promise<CollectionsRO> {
    return await this.collectionService.findAll(query);
  }

  @Get('status')
  async status(@Query() query) {
    const { collection } = await this.collectionService.findOne({
      contractAddress: query.address,
    });
    const mintInstance = this.getMint(query.net, collection);
    return mintInstance;
  }

  @Get(':address/call')
  async call(
    @Param('address') address,
    @Query('net') net: Net,
    @Query('method') method: string,
    @Query('args') args: string[],
  ): Promise<CollectionRO> {
    const { collection } = await this.collectionService.findOne({
      contractAddress: address,
    });

    return this.getMint(net, collection).callMethod(
      collection.abi,
      method,
      args,
    );
  }

  @Get(':address/send')
  async send(
    @Param('address') address,
    @Query('net') net: Net,
    @Query('method') method: string,
    @Query('args') args: string[],
  ) {
    const { collection } = await this.collectionService.findOne({
      contractAddress: address,
    });

    return this.getMint(net, collection).sendMethod(
      collection.abi,
      method,
      args,
    );
  }

  @Get(':address')
  async findOne(@Param('address') address): Promise<CollectionRO> {
    const entity = await this.collectionService.findOne({
      contractAddress: address,
    });

    return entity;
  }

  @Get(':collection')
  async findByCollection(
    @Param('collection') collection,
  ): Promise<CollectionsRO> {
    const [molecular, denominator] = collection.split('-');
    const list = await this.collectionService.findAll({
      molecular: molecular,
      denominator: denominator,
    });

    return list;
  }

  @Post('boot')
  async boot(@Body() body) {
    const net = body.net;
    const { collection } = await this.collectionService.findOne({
      contractAddress: body.address,
    });

    this.getMint(net, collection).boot(collection);
  }

  @Put(':address')
  async put(@Param('address') address, @Body() body) {
    this.collectionService.update(address, body);
  }

  @Post()
  async create(@Body() body) {
    const codeDatas = await Deployment.getContractSourceCodes(body.address);
    if (codeDatas === 'Invalid API Key') {
      console.error('Invalid API Key');
      return;
    }

    if (codeDatas.length > 1) {
      console.error('Too many SourceCodes======================');
      return;
    }

    const codeData = codeDatas[0];
    if (codeData.SourceCode === '') {
      console.error('Invalid Address');
      return;
    }

    const contracts = await Deployment.getContracts(codeDatas);
    const contractPathList = Object.entries(contracts).map(([key, value])=>{
          return {
            value: key,
            label: key,
            children: _.keys(value).map(item=>{
              return {
                value: item,
                label: item,
              };
            }),
          };
    });
    const data = {
      contractAddress: body.address,
      contractName: codeData.ContractName,
      mintType: body.mintType,
      compilerVersion: codeData.CompilerVersion,
      constructorArguments: codeData.ConstructorArguments,
      contractPathList: contractPathList,
      abi: codeData.ABI,
    };

    const collection = await this.collectionService.create(data);
    return collection;
  }

  @Delete(':address')
  async remove(@Param('address') address) {
    const ret = await this.collectionService.remove(address);
    return ret;
  }

  @Post(':address/deploy')
  async deploy(@Param('address') address, @Body() body) {
    const { collection } = await this.collectionService.findOne({
      contractAddress: address,
    });
    const deployment = Deployment.getInstance(body.net);
    const sourceCodes = await Deployment.getContractSourceCodes(address);
    const conf = config[body.net];

    deployment.deployContract(
      sourceCodes,
      body.contractPath,
      (error, trx) => {
        if (error) {
          console.error('DEPLOY ERROR', error);
          return;
        }

        this.collectionService.update(collection.contractAddress, {
          [conf.contractAddressColumn]: trx.contractAddress,
        });
      },
    );
  }
}
