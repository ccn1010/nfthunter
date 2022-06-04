import { MintType } from "../collection.types";

export class CreateCollectionDto {
  readonly contractAddress: string;
  readonly contractName: string;
  readonly mintType: MintType;
  readonly compilerVersion: string;
  readonly constructorArguments: string;
  readonly abi: string;
  readonly contractPathList: {[key: string]: any}[];
  readonly profile: { [key: string]: any };
  readonly mintConfig: { [key: string]: any };
  readonly ropstenContractAddress: string;
  readonly ganacheContractAddress: string;
  readonly createdAt: number;
}
