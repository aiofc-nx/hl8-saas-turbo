import { ModelVersionDetailQueryHandler } from './model-version-detail.query.handler';
import { ModelVersionDiffQueryHandler } from './model-version-diff.query.handler';
import { PageModelVersionsQueryHandler } from './page-model-versions.query.handler';
import { PagePoliciesQueryHandler } from './page-policies.query.handler';
import { PageRelationsQueryHandler } from './page-relations.query.handler';

export const QueryHandlers = [
  PagePoliciesQueryHandler,
  PageRelationsQueryHandler,
  PageModelVersionsQueryHandler,
  ModelVersionDetailQueryHandler,
  ModelVersionDiffQueryHandler,
];
