import { Status } from '@/lib/shared/enums/status.enum';
import { IEvent } from '@nestjs/cqrs';

export class AccessKeyDeletedEvent implements IEvent {
  constructor(
    public readonly domain: string,
    public readonly AccessKeyID: string,
    public readonly AccessKeySecret: string,
    public readonly status: Status,
  ) {}
}
