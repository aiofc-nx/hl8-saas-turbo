import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

/**
 * 全局 CQRS 模块
 *
 * @description 提供全局的 CQRS（命令查询职责分离）功能，支持命令和查询处理。
 * 该模块使用 @Global() 装饰器，导入后在整个应用中可用。
 *
 * @example
 * ```typescript
 * // 在应用模块中导入
 * @Module({
 *   imports: [GlobalCqrsModule],
 * })
 * export class AppModule {}
 *
 * // 定义命令处理器
 * @CommandHandler(CreateUserCommand)
 * export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
 *   async execute(command: CreateUserCommand) {
 *     // 处理命令逻辑
 *   }
 * }
 *
 * // 定义查询处理器
 * @QueryHandler(GetUserQuery)
 * export class GetUserHandler implements IQueryHandler<GetUserQuery> {
 *   async execute(query: GetUserQuery) {
 *     // 处理查询逻辑
 *   }
 * }
 *
 * // 在模块中注册处理器
 * @Module({
 *   imports: [GlobalCqrsModule],
 *   providers: [CreateUserHandler, GetUserHandler],
 * })
 * export class UserModule {}
 * ```
 *
 * @remarks
 * - 导入并导出 @nestjs/cqrs 的 CqrsModule
 * - 使用 @Global() 装饰器，使 CQRS 功能在整个应用中可用
 * - 支持命令处理器（CommandHandler）和查询处理器（QueryHandler）
 * - 支持事件处理器（EventHandler）
 *
 * @class GlobalCqrsModule
 */
@Global()
@Module({
  imports: [CqrsModule],
  exports: [CqrsModule],
})
export class GlobalCqrsModule {}
