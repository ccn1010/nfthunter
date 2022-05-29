export class CreateWalletDto {
  readonly id: number;
  readonly privateKey: string;
  readonly address: string;
  readonly net: string;
}
