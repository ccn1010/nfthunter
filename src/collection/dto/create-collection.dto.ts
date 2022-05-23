export class CreateCollectionDto {
  readonly contractAddress: string;
  readonly contractName: string;
  readonly compilerVersion: string;
  readonly constructorArguments: string;
  readonly abi: string;
  readonly sourceCode: string;
  readonly mint: { [key: string]: any };
  readonly ropstenContractAddress: string;
  readonly createdAt: number;
}
