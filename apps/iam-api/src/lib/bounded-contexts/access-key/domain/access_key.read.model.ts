import { Status } from '@/lib/shared/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';

import type { CreationAuditInfoProperties } from '@hl8/typings';

export type AccessKeyEssentialProperties = Readonly<
  Required<{
    id: string;
    domain: string;
    AccessKeyID: string;
    AccessKeySecret: string;
    status: Status;
  }>
>;

export type AccessKeyOptionalProperties = Readonly<
  Partial<{
    description: string | null;
  }>
>;

export type AccessKeyProperties = AccessKeyEssentialProperties &
  Required<AccessKeyOptionalProperties> &
  CreationAuditInfoProperties;

export class AccessKeyReadModel {
  @ApiProperty({ description: 'The unique identifier of the AccessKey' })
  id: string;

  @ApiProperty({ description: 'domain of the AccessKey' })
  domain: string;

  @ApiProperty({ description: 'AccessKeyID of the AccessKey' })
  AccessKeyID: string;

  @ApiProperty({
    description: 'Status of the AccessKey',
    enum: Object.values(Status),
  })
  status: Status;

  @ApiProperty({
    description: 'Description of the AccessKey',
    nullable: true,
    required: false,
  })
  description: string | null;
}
