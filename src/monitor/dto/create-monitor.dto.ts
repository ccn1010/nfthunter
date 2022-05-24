export class CreateMonitorDto {
  readonly id: string;
  readonly net: string;
  readonly contractAddress: string;
  readonly step: string;
  readonly log: { [key: string]: any };
  readonly createdAt: number;
}
