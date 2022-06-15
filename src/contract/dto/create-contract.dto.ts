import { MintType } from "src/collection/collection.types";
import { Net } from "src/global.types";
import { Status } from "../contract.types";

export class CreateContractDto {
  readonly id: string;
  readonly name: string;
  readonly net: Net;
  readonly address: string;
  readonly mintType: MintType;
  readonly status: Status;
  readonly verified: boolean;
  readonly createdAt: number;
}
