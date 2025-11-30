import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { EVENT_API_KEY_VALIDATED } from '@hl8/constants';
import { ApiKeyValidationEvent } from '@hl8/guard';

@Injectable()
export class ApiKeyValidationEventHandler {
  private readonly logger = new Logger(ApiKeyValidationEventHandler.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent(EVENT_API_KEY_VALIDATED)
  async handle(payload: ApiKeyValidationEvent) {
    //TODO
    this.logger.log(
      `Handling API key validation event, payload: ${JSON.stringify(payload)}`,
    );
  }
}
