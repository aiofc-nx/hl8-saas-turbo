import { UserCreateHandler } from './user-create.command.handler';
import { UserDeleteHandler } from './user-delete.command.handler';
import { UserUpdateHandler } from './user-update.command.handler';
import { UserVerifyEmailHandler } from './user-verify-email.command.handler';

export const PubSubCommandHandlers = [
  UserCreateHandler,
  UserUpdateHandler,
  UserDeleteHandler,
  UserVerifyEmailHandler,
];
