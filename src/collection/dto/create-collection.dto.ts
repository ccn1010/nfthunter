export class CreateCollectionDto {
  readonly contractAddress: string;
  readonly contractName: string;
  readonly mintType: string;
  readonly compilerVersion: string;
  readonly constructorArguments: string;
  readonly abi: string;
  readonly sourceCode: string;
  readonly sourceCodes: {[key: string]: any}[];
  readonly contractPathList: {[key: string]: any}[];
  readonly mintConfig: { [key: string]: any };
  readonly ropstenContractAddress: string;
  readonly createdAt: number;
}
