import { Get, Post, Body, Put, Query, Param, Controller } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto';
import { CollectionsRO, CollectionRO } from './collection.interface';
import { Mint } from './mint';
import { ToggleMint } from './toggle.mint';
import { EventsGateway } from 'src/events/events.gateway';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const abiDecoder = require('abi-decoder');

@Controller('collections')
export class CollectionController {
  constructor(
    private readonly collectionService: CollectionService,
    private readonly mint: Mint,
    private readonly toggleMint: ToggleMint,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Get('test')
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
      collection.ropstenContractAddress,
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
      collection.ropstenContractAddress,
      method,
      args,
    );
  }

  @Get(':address')
  async findOne(@Param('address') address): Promise<CollectionRO> {
    return await this.collectionService.findOne({ contractAddress: address });
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

  @Put(':address')
  async put(@Param('address') address, @Body() body) {
    this.collectionService.update(address, body);
  }

  @Post()
  async create(@Body() body) {
    const sourceCodes = await this.mint.getContractSourceCodes(body.address);
    if (sourceCodes === 'Invalid API Key') {
      console.error('Invalid API Key');
      return;
    }

    const sourceCode = sourceCodes[0];
    if (sourceCode.SourceCode === '') {
      console.error('Invalid Address');
      return;
    }

    // console.log('resresres', sourceCodes)
    const data = {
      contractAddress: body.address,
      contractName: sourceCode.ContractName,
      compilerVersion: sourceCode.CompilerVersion,
      constructorArguments: sourceCode.ConstructorArguments,
      abi: sourceCode.ABI,
      sourceCode: sourceCode.SourceCode,
    };
    const entity = await this.collectionService.create(data);
    console.log('entity', entity);
    await this.mint.deployContract(sourceCodes, (error, trx) => {
      if (error) {
        console.error('DEPLOY ERROR', error);
        return;
      }

      this.collectionService.update(entity.contractAddress, {
        ropstenContractAddress: trx.contractAddress,
      });
    });
  }
}
