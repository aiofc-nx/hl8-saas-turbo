import { ModelDraftCreateHandler } from './model-draft-create.command.handler';
import { ModelDraftUpdateHandler } from './model-draft-update.command.handler';
import { ModelPublishHandler } from './model-publish.command.handler';
import { ModelRollbackHandler } from './model-rollback.command.handler';
import { PolicyBatchHandler } from './policy-batch.command.handler';
import { PolicyCreateHandler } from './policy-create.command.handler';
import { PolicyDeleteHandler } from './policy-delete.command.handler';
import { RelationCreateHandler } from './relation-create.command.handler';
import { RelationDeleteHandler } from './relation-delete.command.handler';

export const CommandHandlers = [
  PolicyCreateHandler,
  PolicyDeleteHandler,
  PolicyBatchHandler,
  RelationCreateHandler,
  RelationDeleteHandler,
  ModelDraftCreateHandler,
  ModelDraftUpdateHandler,
  ModelPublishHandler,
  ModelRollbackHandler,
];
