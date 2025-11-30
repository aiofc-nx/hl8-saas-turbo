# Menu（菜单模块）开发档案

## 1. 模块概述

### 1.1 业务定位

Menu（菜单模块）是 IAM 有界上下文的核心子模块，负责前端路由和菜单的生命周期管理。菜单用于前端路由渲染和权限控制，支持树形结构、常量路由、国际化等特性。通过菜单与角色的关联，实现基于角色的菜单权限控制，确保用户只能访问被授权的菜单和路由。

### 1.2 核心职责

- **菜单生命周期管理**：菜单的创建、更新、删除，支持菜单的启用和禁用
- **树形结构管理**：支持父子菜单关系，构建菜单树形结构，用于前端菜单渲染
- **路由权限控制**：通过菜单与角色的关联，实现基于角色的路由访问控制
- **常量路由管理**：支持常量路由，常量路由不受权限控制，所有用户都可以访问
- **用户路由查询**：根据用户角色查询用户可访问的菜单和路由

### 1.3 技术架构

本模块采用 **Clean Architecture + CQRS + 事件驱动架构（EDA）** 模式：

- **Clean Architecture**：领域层、应用层、基础设施层清晰分离
- **CQRS**：命令用于写操作（创建、更新、删除），查询用于读操作（查询菜单信息）
- **事件驱动**：通过领域事件实现模块间解耦和异步处理（如菜单删除后清理权限）
- **端口适配器模式**：通过端口接口定义仓储契约，由基础设施层实现

### 1.4 菜单类型

菜单支持三种类型：

- **MENU（菜单）**：可点击的菜单项，通常对应一个路由页面
- **DIRECTORY（目录）**：目录节点，用于组织菜单结构，本身不可点击
- **BUTTON（按钮）**：按钮权限，用于控制页面内的操作按钮权限

## 2. 目录结构

```
menu/
├── application/                    # 应用层
│   ├── command-handlers/          # 命令处理器
│   │   ├── menu-create.command.handler.ts
│   │   ├── menu-update.command.handler.ts
│   │   ├── menu-delete.command.handler.ts
│   │   └── index.ts
│   ├── query-handlers/            # 查询处理器
│   │   ├── menus.query.handler.ts
│   │   ├── menus.tree.query.handler.ts
│   │   ├── menus.by-ids.query.handler.ts
│   │   ├── menus.by-role_code&domain.query.handler.ts
│   │   ├── menu-ids.by-role_id&domain.query.handler.ts
│   │   ├── menu-ids.by-role_code&domain.query.handler.ts
│   │   ├── menu-ids.by-user_id&domain.query.handler.ts
│   │   └── index.ts
│   ├── event-handlers/            # 事件处理器
│   │   ├── menu-deleted.event.handler.ts
│   │   └── index.ts
│   ├── service/                   # 应用服务
│   │   ├── menu.service.ts
│   │   └── index.ts
│   └── dto/                       # 数据传输对象
│       └── route.dto.ts
├── domain/                        # 领域层
│   ├── menu.model.ts              # 菜单聚合根
│   ├── menu.read.model.ts         # 菜单读取模型
│   └── events/                    # 领域事件
│       └── menu-deleted.event.ts
├── commands/                      # 命令对象
│   ├── menu-create.command.ts
│   ├── menu-update.command.ts
│   └── menu-delete.command.ts
├── queries/                       # 查询对象
│   ├── menus.query.ts
│   ├── menus.tree.query.ts
│   ├── menus.by-ids.query.ts
│   ├── menus.by-role_code&domain.query.ts
│   ├── menu-ids.by-role_id&domain.query.ts
│   ├── menu-ids.by-role_code&domain.query.ts
│   └── menu-ids.by-user_id&domain.query.ts
├── ports/                         # 端口接口
│   ├── menu.read.repo-port.ts     # 菜单读取仓储端口
│   └── menu.write.repo-port.ts    # 菜单写入仓储端口
├── constants.ts                    # 常量定义
└── menu.module.ts                  # 模块定义
```

## 3. 领域模型

### 3.1 Menu（菜单聚合根）

菜单聚合根是菜单模块的核心实体，负责管理菜单的生命周期和业务规则。

#### 3.1.1 属性定义

| 属性名       | 类型              | 说明                                 | 约束                                                |
| ------------ | ----------------- | ------------------------------------ | --------------------------------------------------- |
| `id`         | `number`          | 菜单的唯一标识符（自增ID）           | 必填，唯一                                          |
| `menuName`   | `string`          | 菜单的显示名称                       | 必填                                                |
| `menuType`   | `MenuType`        | 菜单的类型                           | 必填，可选值：`MENU`、`DIRECTORY`、`BUTTON`         |
| `routeName`  | `string`          | 前端路由的唯一名称                   | 必填                                                |
| `routePath`  | `string`          | 前端路由的 URL 路径                  | 必填                                                |
| `component`  | `string`          | 前端组件的路径或名称                 | 必填                                                |
| `status`     | `Status`          | 菜单的状态                           | 必填，可选值：`ENABLED`（启用）、`DISABLED`（禁用） |
| `pid`        | `number`          | 父菜单 ID，用于构建菜单层级结构      | 必填，根菜单为 `0`                                  |
| `order`      | `number`          | 菜单的显示顺序，数字越小越靠前       | 必填                                                |
| `constant`   | `boolean`         | 是否常量路由，常量路由不受权限控制   | 必填                                                |
| `createdAt`  | `Date`            | 创建时间                             | 自动生成                                            |
| `createdBy`  | `string`          | 创建者用户 ID                        | 必填                                                |
| `iconType`   | `number \| null`  | 图标的类型                           | 可选                                                |
| `icon`       | `string \| null`  | 图标名称或路径                       | 可选                                                |
| `pathParam`  | `string \| null`  | 路由路径中的动态参数                 | 可选                                                |
| `activeMenu` | `string \| null`  | 当前路由激活时高亮的菜单项路径       | 可选                                                |
| `hideInMenu` | `boolean \| null` | 是否在菜单中隐藏该菜单项             | 可选                                                |
| `i18nKey`    | `string \| null`  | 用于国际化的键名                     | 可选                                                |
| `keepAlive`  | `boolean \| null` | 是否在路由切换时保持组件状态         | 可选                                                |
| `href`       | `string \| null`  | 如果是外部链接，此字段存储完整的 URL | 可选                                                |
| `multiTab`   | `boolean \| null` | 是否在标签页中打开，支持多标签页显示 | 可选                                                |
| `uid`        | `string`          | 用于权限控制的用户标识               | 必填                                                |

#### 3.1.2 领域方法

##### `static fromCreate(properties: MenuCreateProperties): Menu`

从创建属性创建菜单实例。

**参数说明**：

- `properties`: 菜单创建属性对象，包含菜单的所有属性

**返回值**：菜单聚合根实例

**使用场景**：在创建新菜单时使用

**示例**：

```typescript
const menuCreateProperties: MenuCreateProperties = {
  id: -1, // 创建时使用 -1，数据库自动生成
  menuName: '设置',
  menuType: MenuType.MENU,
  routeName: 'settings',
  routePath: '/settings',
  component: 'Settings',
  status: Status.ENABLED,
  pid: ROOT_ROUTE_PID, // '0' 表示根菜单
  order: 1,
  constant: false,
  createdAt: new Date(),
  createdBy: 'user-123',
  // ... 其他可选属性
};
const menu = Menu.fromCreate(menuCreateProperties);
```

##### `static fromUpdate(properties: MenuUpdateProperties): Menu`

从更新属性创建菜单实例。

**参数说明**：

- `properties`: 菜单更新属性对象，包含菜单的所有属性

**返回值**：菜单聚合根实例

**使用场景**：在更新现有菜单时使用

##### `static fromProp(properties: MenuProperties): Menu`

从完整属性创建菜单实例。

**参数说明**：

- `properties`: 菜单完整属性对象

**返回值**：菜单聚合根实例

**使用场景**：从数据库加载菜单数据时使用

##### `async deleted(): Promise<void>`

发布菜单删除事件。

**说明**：

- 当菜单被删除时，发布 `MenuDeletedEvent` 事件
- 该事件可以被其他有界上下文订阅，用于执行后续操作（如清理权限、更新缓存等）

**使用场景**：在删除菜单后调用，触发相关清理工作

**示例**：

```typescript
const menu = Menu.fromProp(existingMenu);
await menu.deleted(); // 发布 MenuDeletedEvent
menu.commit(); // 提交事件到事件总线
```

##### `commit(): void`

提交领域事件到事件总线。

**说明**：

- 继承自 `AggregateRoot` 的方法
- 将所有待处理的领域事件提交到 NestJS CQRS 事件总线

**使用场景**：在处理完聚合根操作后调用，确保领域事件被发布

### 3.2 MenuProperties（菜单属性类型）

定义菜单的属性结构，用于数据传输和持久化。

#### 3.2.1 类型定义

```typescript
type MenuEssentialProperties = Readonly<
  Required<{
    id: number;
    menuType: MenuType;
    menuName: string;
    routeName: string;
    routePath: string;
    component: string;
    status: Status;
    pid: number;
    order: number;
    constant: boolean;
  }>
>;

type MenuOptionalProperties = Readonly<
  Partial<{
    iconType: number | null;
    icon: string | null;
    pathParam: string | null;
    activeMenu: string | null;
    hideInMenu: boolean | null;
    i18nKey: string | null;
    keepAlive: boolean | null;
    href: string | null;
    multiTab: boolean | null;
  }>
>;

type MenuProperties = MenuEssentialProperties &
  Required<MenuOptionalProperties>;
type MenuTreeProperties = MenuProperties & {
  children?: MenuTreeProperties[];
};
```

#### 3.2.2 MenuReadModel（菜单读取模型）

用于 API 响应和查询结果的数据传输对象。

**属性说明**：

- 使用 `@ApiProperty` 装饰器提供 Swagger 文档支持
- 所有字段均用于只读查询场景

### 3.3 菜单层级结构

菜单支持父子层级关系，通过 `pid` 字段实现：

- **根菜单**：`pid` 为 `ROOT_ROUTE_PID`（即 `0`）的菜单为根菜单，是菜单树的顶层
- **子菜单**：`pid` 指向其他菜单 ID 的菜单为子菜单
- **树形结构**：菜单可以组织成多级树形结构，用于前端菜单渲染

**示例层级结构**：

```
根菜单 (pid: 0)
  ├── 系统设置 (pid: 根菜单ID)
  │   ├── 用户管理 (pid: 系统设置ID)
  │   ├── 角色管理 (pid: 系统设置ID)
  │   └── 菜单管理 (pid: 系统设置ID)
  └── 业务管理 (pid: 根菜单ID)
      ├── 订单管理 (pid: 业务管理ID)
      └── 商品管理 (pid: 业务管理ID)
```

### 3.4 MenuType（菜单类型枚举）

定义菜单的类型。

```typescript
enum MenuType {
  MENU = 'MENU', // 菜单类型，可点击的菜单项
  DIRECTORY = 'DIRECTORY', // 目录类型，用于组织菜单结构
  BUTTON = 'BUTTON', // 按钮类型，用于控制页面内的操作按钮权限
}
```

**类型说明**：

- **MENU**：可点击的菜单项，通常对应一个路由页面，用户点击后可以访问对应的页面
- **DIRECTORY**：目录节点，用于组织菜单结构，本身不可点击，只用于层级组织
- **BUTTON**：按钮权限，用于控制页面内的操作按钮权限，不在菜单中显示

## 4. 命令与处理器

### 4.1 MenuCreateCommand（菜单创建命令）

用于创建新的菜单。

#### 4.1.1 命令定义

```typescript
class MenuCreateCommand implements ICommand {
  readonly menuName: string;
  readonly menuType: MenuType;
  readonly iconType: number | null;
  readonly icon: string | null;
  readonly routeName: string;
  readonly routePath: string;
  readonly component: string;
  readonly pathParam: string | null;
  readonly status: Status;
  readonly activeMenu: string | null;
  readonly hideInMenu: boolean | null;
  readonly pid: number;
  readonly order: number;
  readonly i18nKey: string | null;
  readonly keepAlive: boolean | null;
  readonly constant: boolean;
  readonly href: string | null;
  readonly multiTab: boolean | null;
  readonly uid: string;
}
```

#### 4.1.2 MenuCreateHandler（菜单创建命令处理器）

**职责**：

- 验证父菜单的存在性（如果指定了父菜单）
- 创建菜单并保存到数据库
- 菜单 ID 使用自增，创建时传入 `-1`

**业务流程**：

1. 如果 `pid` 不是 `ROOT_ROUTE_PID`，检查父菜单是否存在，如果不存在则抛出异常
2. 创建菜单属性对象，设置 `id` 为 `-1`（由数据库自动生成）
3. 创建菜单聚合根实例
4. 保存到数据库

**异常处理**：

- 当父菜单不存在时，抛出 `BadRequestException`，错误消息：`Parent menu with code {pid} does not exist.`

**特殊说明**：

- 菜单 ID 使用数据库自增 ID，创建时传入 `-1`
- 菜单主要在设计阶段创建，运行时动态创建的菜单可能没有对应的前端组件

**示例**：

```typescript
const command = new MenuCreateCommand(
  '设置',
  MenuType.MENU,
  null,
  'setting',
  'settings',
  '/settings',
  'Settings',
  null,
  Status.ENABLED,
  null,
  null,
  ROOT_ROUTE_PID, // 0 表示根菜单
  1,
  null,
  null,
  false,
  null,
  null,
  'user-123',
);
await commandBus.execute(command);
```

### 4.2 MenuUpdateCommand（菜单更新命令）

用于更新现有的菜单。

#### 4.2.1 命令定义

```typescript
class MenuUpdateCommand extends MenuCreateCommand implements ICommand {
  readonly id: number; // 要更新的菜单的唯一标识符
  // 继承自 MenuCreateCommand 的其他字段
}
```

#### 4.2.2 MenuUpdateHandler（菜单更新命令处理器）

**职责**：

- 验证菜单是否存在
- 验证父菜单的有效性
- 更新菜单属性并保存到数据库

**业务流程**：

1. 检查菜单是否存在
2. 验证父菜单的有效性（如果指定了父菜单）
3. 更新菜单属性
4. 设置更新时间和更新者
5. 更新菜单聚合根实例
6. 保存到数据库

### 4.3 MenuDeleteCommand（菜单删除命令）

用于删除指定的菜单。

#### 4.3.1 命令定义

```typescript
class MenuDeleteCommand implements ICommand {
  readonly id: number; // 要删除的菜单的唯一标识符
}
```

#### 4.3.2 MenuDeleteHandler（菜单删除命令处理器）

**职责**：

- 验证菜单是否存在
- 验证菜单下是否有子菜单
- 删除菜单记录
- 发布菜单删除事件

**业务流程**：

1. 根据 ID 查询菜单是否存在，如果不存在则抛出异常
2. 查询菜单下的子菜单数量
3. 如果有子菜单，抛出异常，要求先删除子菜单
4. 从数据库删除菜单记录
5. 调用菜单的 `deleted()` 方法发布 `MenuDeletedEvent` 事件
6. 提交事件到事件总线

**异常处理**：

- 当菜单不存在时，抛出 `BadRequestException`，错误消息：`A menu with the specified ID does not exist.`
- 当菜单下有子菜单时，抛出 `BadRequestException`，错误消息：`Cannot delete the menu with ID {id} because it has sub-menus. Please delete the sub-menus first.`

**级联删除规则**：

- 删除菜单前必须确保菜单下没有子菜单
- 需要从叶子节点开始删除，逐级向上删除

**示例**：

```typescript
const command = new MenuDeleteCommand(1);
await commandBus.execute(command);
// 自动触发 MenuDeletedEvent
```

## 5. 查询与处理器

### 5.1 MenusQuery（菜单查询）

用于查询所有菜单列表。

#### 5.1.1 查询定义

```typescript
class MenusQuery implements IQuery {
  // 无需参数
}
```

#### 5.1.2 查询处理器

**职责**：

- 查询所有菜单，返回扁平化的菜单数组

**返回值**：

- `MenuProperties[]`：菜单属性数组

**使用场景**：

- 获取所有菜单列表（扁平结构）

### 5.2 MenusTreeQuery（菜单树查询）

用于查询菜单的树形结构。

#### 5.2.1 查询定义

```typescript
class MenusTreeQuery implements IQuery {
  readonly constant: boolean; // 是否只查询常量路由，默认为 false
}
```

#### 5.2.2 MenusTreeQueryHandler（查询处理器）

**职责**：

- 根据常量标志查询菜单
- 将菜单组织成树形结构

**返回值**：

- `MenuTreeProperties[]`：菜单树形结构数组

**使用场景**：

- 获取菜单树形结构用于前端菜单渲染
- 查询常量路由树或普通路由树

**示例**：

```typescript
const query = new MenusTreeQuery(false); // 查询普通路由
const menuTree = await queryBus.execute(query);
// 返回树形结构的菜单数组
```

### 5.3 MenusByIdsQuery（根据 ID 列表查询菜单）

用于批量查询指定 ID 列表的菜单信息。

#### 5.3.1 查询定义

```typescript
class MenusByIdsQuery implements IQuery {
  readonly ids: number[]; // 菜单 ID 数组
}
```

#### 5.3.2 查询处理器

**职责**：

- 批量查询指定 ID 列表的菜单信息

**返回值**：

- `MenuProperties[]`：菜单属性数组

**使用场景**：

- 根据菜单 ID 列表批量查询菜单信息

### 5.4 MenusByRoleCodeAndDomainQuery（根据角色代码和域查询菜单）

用于查询指定角色在指定域下可访问的菜单列表。

#### 5.4.1 查询定义

```typescript
class MenusByRoleCodeAndDomainQuery implements IQuery {
  readonly roleCode: string[]; // 角色代码数组
  readonly domain: string; // 域代码
}
```

#### 5.4.2 查询处理器

**职责**：

- 根据角色代码和域查询菜单列表

**返回值**：

- `MenuProperties[]`：菜单属性数组

**使用场景**：

- 获取用户角色对应的菜单列表
- 用于前端菜单权限控制

**示例**：

```typescript
const query = new MenusByRoleCodeAndDomainQuery(
  ['admin', 'user'],
  'domain-001',
);
const menus = await queryBus.execute(query);
// 返回该角色可访问的菜单列表
```

### 5.5 其他菜单查询

模块还提供了其他查询方式：

- **MenuIdsByRoleIdAndDomainQuery**：根据角色 ID 和域查询菜单 ID 列表
- **MenuIdsByRoleCodeAndDomainQuery**：根据角色代码和域查询菜单 ID 列表
- **MenuIdsByUserIdAndDomainQuery**：根据用户 ID 和域查询菜单 ID 列表

## 6. 应用服务

### 6.1 MenuService（菜单服务）

提供菜单相关的业务逻辑，包括获取用户路由和常量路由。

#### 6.1.1 方法说明

##### `getUserRoutes(roleCode: string[], domain: string): Promise<UserRoute>`

获取用户路由。

**参数说明**：

- `roleCode`: 用户拥有的角色代码数组
- `domain`: 用户所属的域代码

**返回值**：

- `UserRoute`: 用户路由信息，包含路由树和首页路径

**业务流程**：

1. 根据角色代码和域查询用户可访问的菜单
2. 将菜单组织成树形结构
3. 返回路由树和首页路径

**使用场景**：

- 用户登录后获取可访问的路由
- 前端菜单渲染

**示例**：

```typescript
const userRoutes = await menuService.getUserRoutes(['admin'], 'domain-001');
// 返回: { routes: [...], home: 'home' }
```

##### `getConstantRoutes(): Promise<MenuRoute[]>`

获取常量路由。

**说明**：

- 获取系统中所有常量路由
- 常量路由不受权限控制，所有用户都可以访问

**返回值**：

- `MenuRoute[]`: 常量路由列表

**使用场景**：

- 获取系统公共路由
- 不需要权限验证的路由

**示例**：

```typescript
const constantRoutes = await menuService.getConstantRoutes();
// 返回常量路由列表
```

## 7. 领域事件

### 7.1 MenuDeletedEvent（菜单删除事件）

当菜单被删除时发布的领域事件。

#### 7.1.1 事件定义

```typescript
class MenuDeletedEvent implements IEvent {
  readonly menuId: number; // 被删除的菜单的唯一标识符
  readonly routeName: string; // 被删除的菜单的路由名称
}
```

#### 7.1.2 MenuDeletedHandler（事件处理器）

**职责**：

- 记录菜单删除日志

**业务流程**：

1. 接收 `MenuDeletedEvent` 事件
2. 记录日志

**使用场景**：

- 菜单删除后的审计日志
- 可以扩展为清理权限、更新缓存等操作

## 8. 端口接口

### 8.1 MenuWriteRepoPort（菜单写入仓储端口）

定义菜单的写入操作接口，由基础设施层实现。

#### 8.1.1 接口定义

```typescript
interface MenuWriteRepoPort {
  save(menu: Menu): Promise<void>;
  update(menu: Menu): Promise<void>;
  deleteById(id: number): Promise<void>;
}
```

#### 8.1.2 方法说明

##### `save(menu: Menu): Promise<void>`

保存或创建菜单到数据库。

- **参数**：`menu` - 菜单聚合根实例
- **行为**：如果是新记录则创建，如果是已存在的记录则更新
- **异常**：当保存操作失败时抛出异常

##### `update(menu: Menu): Promise<void>`

更新数据库中已存在的菜单记录。

- **参数**：`menu` - 菜单聚合根实例
- **异常**：当更新操作失败时抛出异常

##### `deleteById(id: number): Promise<void>`

从数据库中删除指定 ID 的菜单记录。

- **参数**：`id` - 菜单的唯一标识符
- **异常**：当删除操作失败时抛出异常

### 8.2 MenuReadRepoPort（菜单读取仓储端口）

定义菜单的读取操作接口，由基础设施层实现。

#### 8.2.1 接口定义

```typescript
interface MenuReadRepoPort {
  getMenuById(id: number): Promise<MenuProperties | null>;
  getChildrenMenuCount(id: number): Promise<number>;
  findMenusByRoleCode(
    roleCode: string[],
    domain: string,
  ): Promise<MenuProperties[]>;
  findMenusByRoleId(roleId: string, domain: string): Promise<MenuProperties[]>;
  getConstantRoutes(): Promise<MenuProperties[]>;
  findAll(): Promise<MenuTreeProperties[]>;
  findAllConstantMenu(constant: boolean): Promise<MenuTreeProperties[]>;
  findMenusByIds(ids: number[]): Promise<MenuProperties[]>;
  findMenuIdsByUserId(userId: string, domain: string): Promise<number[]>;
}
```

#### 8.2.2 方法说明

##### `getMenuById(id: number): Promise<MenuProperties | null>`

根据 ID 获取菜单信息。

##### `getChildrenMenuCount(id: number): Promise<number>`

获取子菜单数量，用于删除前验证。

##### `findMenusByRoleCode(roleCode: string[], domain: string): Promise<MenuProperties[]>`

根据角色代码和域查找菜单。

##### `findMenusByRoleId(roleId: string, domain: string): Promise<MenuProperties[]>`

根据角色 ID 和域查找菜单。

##### `getConstantRoutes(): Promise<MenuProperties[]>`

获取所有常量路由。

##### `findAll(): Promise<MenuTreeProperties[]>`

查询所有菜单，返回树形结构。

##### `findAllConstantMenu(constant: boolean): Promise<MenuTreeProperties[]>`

查询所有常量菜单或普通菜单，返回树形结构。

##### `findMenusByIds(ids: number[]): Promise<MenuProperties[]>`

根据 ID 列表查找菜单。

##### `findMenuIdsByUserId(userId: string, domain: string): Promise<number[]>`

根据用户 ID 和域查找菜单 ID 列表。

## 9. 模块注册

### 9.1 MenuModule（菜单模块）

动态模块，用于注册菜单相关的处理器和依赖。

#### 9.1.1 模块定义

```typescript
@Module({})
export class MenuModule {
  static register(options: {
    inject: Provider[];
    imports: any[];
  }): DynamicModule;
}
```

#### 9.1.2 注册方式

在基础设施层通过 `register` 方法注册模块：

```typescript
MenuModule.register({
  imports: [
    /* 其他模块 */
  ],
  inject: [
    /* 仓储实现提供者 */
  ],
});
```

#### 9.1.3 提供的处理器和服务

- **命令处理器**：`MenuCreateHandler`、`MenuUpdateHandler`、`MenuDeleteHandler`
- **查询处理器**：多个查询处理器
- **事件处理器**：`MenuDeletedHandler`
- **应用服务**：`MenuService`

#### 9.1.4 依赖注入令牌

- `MenuWriteRepoPortToken`：菜单写入仓储端口令牌
- `MenuReadRepoPortToken`：菜单读取仓储端口令牌

## 10. 业务规则

### 10.1 菜单层级规则

- **根菜单标识**：`pid` 为 `ROOT_ROUTE_PID`（即 `0`）表示根菜单
- **父菜单验证**：如果指定了父菜单（`pid` 不是 `ROOT_ROUTE_PID`），父菜单必须存在
- **级联删除**：删除菜单前必须确保菜单下没有子菜单，需要从叶子节点开始删除

### 10.2 菜单类型规则

- **MENU**：可点击的菜单项，对应路由页面
- **DIRECTORY**：目录节点，用于组织菜单结构，不可点击
- **BUTTON**：按钮权限，不在菜单中显示，用于控制页面内操作权限

### 10.3 常量路由规则

- **常量路由**：`constant` 为 `true` 的菜单为常量路由
- **权限控制**：常量路由不受权限控制，所有用户都可以访问
- **应用场景**：系统公共页面、登录页、错误页等

### 10.4 菜单删除规则

- **前置条件**：菜单必须存在才能删除
- **子菜单检查**：删除菜单前必须确保菜单下没有子菜单
- **删除后操作**：删除菜单后自动发布 `MenuDeletedEvent` 事件

### 10.5 菜单 ID 规则

- **自增 ID**：菜单 ID 使用数据库自增 ID
- **创建时 ID**：创建菜单时传入 `id` 为 `-1`，由数据库自动生成
- **设计考虑**：菜单主要在设计阶段创建，运行时动态创建的场景较少

### 10.6 排序规则

- **order 字段**：菜单的显示顺序由 `order` 字段控制
- **排序规则**：数字越小越靠前
- **树形排序**：每个层级的菜单独立排序

## 11. 使用示例

### 11.1 创建菜单

```typescript
import { CommandBus } from '@nestjs/cqrs';
import { MenuCreateCommand } from './commands/menu-create.command';
import { MenuType } from '@/lib/shared/enums/status.enum';
import { Status } from '@/lib/shared/enums/status.enum';
import { ROOT_ROUTE_PID } from '@/lib/shared/constants/db.constant';

const command = new MenuCreateCommand(
  '系统设置',
  MenuType.DIRECTORY,
  null,
  'setting',
  'system',
  '/system',
  'SystemLayout',
  null,
  Status.ENABLED,
  null,
  null,
  ROOT_ROUTE_PID,
  1,
  null,
  null,
  false,
  null,
  null,
  'user-123',
);
await commandBus.execute(command);
```

### 11.2 获取用户路由

```typescript
import { MenuService } from './application/service/menu.service';

const userRoutes = await menuService.getUserRoutes(
  ['admin', 'user'],
  'domain-001',
);
console.log(`首页: ${userRoutes.home}`);
console.log(`路由树:`, userRoutes.routes);
```

### 11.3 获取菜单树

```typescript
import { QueryBus } from '@nestjs/cqrs';
import { MenusTreeQuery } from './queries/menus.tree.query';

const query = new MenusTreeQuery(false); // 查询普通路由
const menuTree = await queryBus.execute(query);
// 返回树形结构的菜单数组
```

### 11.4 删除菜单

```typescript
import { CommandBus } from '@nestjs/cqrs';
import { MenuDeleteCommand } from './commands/menu-delete.command';

const command = new MenuDeleteCommand(1);
await commandBus.execute(command);
// 自动触发 MenuDeletedEvent
```

## 12. 测试指南

### 12.1 单元测试

单元测试文件应放在与被测文件同目录下，命名为 `{filename}.spec.ts`。

#### 12.1.1 菜单聚合根测试

测试文件：`domain/menu.model.spec.ts`

**测试用例**：

- 测试 `fromCreate` 方法正确创建菜单实例
- 测试 `fromUpdate` 方法正确创建更新菜单实例
- 测试 `fromProp` 方法正确从属性创建菜单实例
- 测试 `deleted` 方法发布领域事件

### 12.2 集成测试

集成测试应放置在 `tests/integration/` 目录下。

**测试场景**：

- 测试菜单完整的 CRUD 流程
- 测试菜单树形结构的构建
- 测试菜单删除前子菜单检查
- 测试根据角色查询菜单

### 12.3 测试覆盖率要求

- 核心业务逻辑测试覆盖率须达到 80% 以上
- 关键路径（创建、更新、删除、查询）覆盖率须达到 90% 以上
- 所有公共 API 必须具备测试用例

## 13. 注意事项

### 13.1 菜单 ID 设计

- 菜单 ID 使用数据库自增 ID，创建时传入 `-1`
- 菜单主要在设计阶段创建，运行时动态创建的场景较少
- 动态创建的菜单可能没有对应的前端组件

### 13.2 树形结构构建

- 菜单树形结构通过 `buildTree` 工具函数构建
- 构建时按照 `pid`、`id`、`order` 字段组织
- 确保菜单层级关系正确，避免循环引用

### 13.3 常量路由使用

- 常量路由不受权限控制，所有用户都可以访问
- 适用于系统公共页面、登录页、错误页等
- 常量路由可以独立查询，不与角色关联

### 13.4 菜单删除顺序

- 删除菜单前必须确保菜单下没有子菜单
- 需要从叶子节点开始删除，逐级向上删除
- 可以使用递归删除或批量删除的方式处理

### 13.5 性能考虑

- 菜单查询应考虑缓存，避免频繁查询数据库
- 树形结构构建可以考虑缓存结果
- 大量菜单时，分页查询和按需加载

### 13.6 权限控制

- 菜单与角色关联，通过角色控制菜单访问权限
- 常量路由不受权限控制
- 前端应根据用户角色过滤菜单

## 14. 扩展点

### 14.1 菜单权限继承

可以扩展菜单权限继承功能：

- 子菜单自动继承父菜单的权限
- 简化权限配置

### 14.2 菜单动态加载

可以扩展菜单动态加载功能：

- 支持路由懒加载
- 支持组件动态导入
- 提升前端性能

### 14.3 菜单国际化增强

可以扩展菜单国际化功能：

- 支持多语言菜单名称
- 动态切换语言
- 国际化键管理

### 14.4 菜单使用统计

可以扩展菜单使用统计功能：

- 统计菜单访问频率
- 分析用户菜单使用习惯
- 优化菜单结构

## 15. 相关模块

### 15.1 Role 模块

角色模块与菜单模块关联：

- 菜单与角色关联，通过角色控制菜单访问权限
- 删除角色时会清理角色菜单关联

### 15.2 Domain 模块

域模块与菜单模块关联：

- 菜单查询需要指定域，实现多租户隔离
- 删除域时会清理该域下的角色菜单关联

### 15.3 Authentication 模块

认证模块与菜单模块关联：

- 用户登录后，根据用户角色查询可访问的菜单
- 前端根据菜单权限控制路由访问

## 16. 更新日志

### 2024-01-XX

- 初始版本，实现菜单的 CRUD 基本功能
- 实现菜单树形结构查询
- 实现根据角色查询菜单
- 实现常量路由支持

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-XX  
**维护者**：IAM 团队
