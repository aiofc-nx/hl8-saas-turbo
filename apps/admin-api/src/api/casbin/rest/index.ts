import { CasbinModelController } from './casbin-model.controller';
import { CasbinPolicyController } from './casbin-policy.controller';
import { CasbinRelationController } from './casbin-relation.controller';

export const Controllers = [
  CasbinPolicyController,
  CasbinRelationController,
  CasbinModelController,
];
