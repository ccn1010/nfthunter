import { Get, Post, Body, Put, Query, Param, Controller, Delete } from '@nestjs/common';
import _ from 'lodash';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto';
import { CollectionsRO, CollectionRO } from './collection.interface';
import { Mint } from './mint';
import { ToggleMint } from './toggle.mint';
import { EventsGateway } from 'src/events/events.gateway';
import { ScheduleMint } from './schedule.mint';
import { Deployment } from './deployment';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const abiDecoder = require('abi-decoder');

@Controller('collections')
export class CollectionController {
  constructor(
    private readonly collectionService: CollectionService,
    private readonly mint: Mint,
    private readonly toggleMint: ToggleMint,
    private readonly scheduleMint: ScheduleMint,
    private readonly deployment: Deployment,
    private readonly eventsGateway: EventsGateway,
  ) {}

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
    // await this.mint.setConfig(config);
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

  @Get(':address/call')
  async call(
    @Param('address') address,
    @Query('method') method: string,
    @Query('args') args: string[],
  ): Promise<CollectionRO> {
    const { collection } = await this.collectionService.findOne({
      contractAddress: address,
    });
    console.log('collection', args);
    return this.mint.callMethod(
      collection.abi,
      collection.contractAddress,
      method,
      args,
    );
  }

  @Get(':address/send')
  async send(
    @Param('address') address,
    @Query('method') method: string,
    @Query('args') args: string[],
  ) {
    const { collection } = await this.collectionService.findOne({
      contractAddress: address,
    });
    this.mint.sendMethod(
      collection.abi,
      collection.contractAddress,
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

  @Put(':address/toggleTest')
  async toggleTest(@Param('address') address) {
    const { collection } = await this.collectionService.findOne({
      contractAddress: address,
    });
    this.toggleMint.boot(collection);
  }

  @Put(':address/scheduleTest')
  async scheduleTest(@Param('address') address) {
    const { collection } = await this.collectionService.findOne({
      contractAddress: address,
    });
    this.scheduleMint.boot(collection);
  }

  @Put(':address')
  async put(@Param('address') address, @Body() body) {
    this.collectionService.update(address, body);
  }

  @Post()
  async create(@Body() body) {
    const sourceCodes = await this.deployment.getContractSourceCodes(body.address);
    if (sourceCodes === 'Invalid API Key') {
      console.error('Invalid API Key');
      return;
    }

    if (sourceCodes.length > 1) {
      console.error('Too many SourceCodes======================');
      return;
    }

    const sourceCode = sourceCodes[0];
    if (sourceCode.SourceCode === '') {
      console.error('Invalid Address');
      return;
    }

    const contracts = await this.deployment.getContracts(sourceCodes);
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
    // console.log('contractPathList', contractPathList);
    const data = {
      contractAddress: body.address,
      contractName: sourceCode.ContractName,
      mintType: body.mintType,
      compilerVersion: sourceCode.CompilerVersion,
      constructorArguments: sourceCode.ConstructorArguments,
      contractPathList: contractPathList,
      abi: sourceCode.ABI,
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
    console.log('body', body);
    const sourceCodes = await this.deployment.getContractSourceCodes(address);

    this.deployment.deployContract(
      sourceCodes,
      body.contractPath,
      (error, trx) => {
        if (error) {
          console.error('DEPLOY ERROR', error);
          return;
        }

        this.collectionService.update(collection.contractAddress, {
          ropstenContractAddress: trx.contractAddress,
        });
      },
    );
  }
}
