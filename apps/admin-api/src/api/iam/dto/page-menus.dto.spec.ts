import { validate } from 'class-validator';

import { MenuType, Status } from '@/lib/shared/enums/status.enum';

import { PageMenusDto } from './page-menus.dto';

/**
 * PageMenusDto 单元测试
 *
 * @description
 * 测试菜单分页查询数据传输对象的验证规则。
 */
describe('PageMenusDto', () => {
  /**
   * 应该通过验证当只提供分页参数时
   *
   * 验证当只提供分页参数（current 和 size）时，DTO 能够通过验证。
   */
  it('应该通过验证当只提供分页参数时', async () => {
    const dto = new PageMenusDto();
    dto.current = 1;
    dto.size = 10;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当提供所有可选筛选字段时
   *
   * 验证当提供所有可选筛选字段时，DTO 能够通过验证。
   */
  it('应该通过验证当提供所有可选筛选字段时', async () => {
    const dto = new PageMenusDto();
    dto.current = 1;
    dto.size = 10;
    dto.menuName = '用户管理';
    dto.routeName = 'user-management';
    dto.menuType = MenuType.MENU;
    dto.status = Status.ENABLED;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当只提供菜单名称筛选时
   *
   * 验证当只提供菜单名称筛选字段时，DTO 能够通过验证。
   */
  it('应该通过验证当只提供菜单名称筛选时', async () => {
    const dto = new PageMenusDto();
    dto.current = 1;
    dto.size = 10;
    dto.menuName = '用户管理';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当只提供路由名称筛选时
   *
   * 验证当只提供路由名称筛选字段时，DTO 能够通过验证。
   */
  it('应该通过验证当只提供路由名称筛选时', async () => {
    const dto = new PageMenusDto();
    dto.current = 1;
    dto.size = 10;
    dto.routeName = 'user-management';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当只提供菜单类型筛选时
   *
   * 验证当只提供菜单类型筛选字段时，DTO 能够通过验证。
   */
  it('应该通过验证当只提供菜单类型筛选时', async () => {
    const dto = new PageMenusDto();
    dto.current = 1;
    dto.size = 10;
    dto.menuType = MenuType.MENU;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当只提供状态筛选时
   *
   * 验证当只提供状态筛选字段时，DTO 能够通过验证。
   */
  it('应该通过验证当只提供状态筛选时', async () => {
    const dto = new PageMenusDto();
    dto.current = 1;
    dto.size = 10;
    dto.status = Status.ENABLED;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该验证失败当菜单类型不是有效枚举值时
   *
   * 验证当菜单类型字段不是有效的枚举值时，DTO 验证应该失败。
   */
  it('应该验证失败当菜单类型不是有效枚举值时', async () => {
    const dto = new PageMenusDto();
    dto.current = 1;
    dto.size = 10;
    (dto as any).menuType = 'INVALID_TYPE';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const menuTypeError = errors.find((e) => e.property === 'menuType');
    expect(menuTypeError).toBeDefined();
  });

  /**
   * 应该验证失败当状态不是有效枚举值时
   *
   * 验证当状态字段不是有效的枚举值时，DTO 验证应该失败。
   */
  it('应该验证失败当状态不是有效枚举值时', async () => {
    const dto = new PageMenusDto();
    dto.current = 1;
    dto.size = 10;
    (dto as any).status = 'INVALID_STATUS';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const statusError = errors.find((e) => e.property === 'status');
    expect(statusError).toBeDefined();
  });

  /**
   * 应该验证失败当菜单名称为空字符串时
   *
   * 验证当菜单名称字段为空字符串时，DTO 验证应该失败（因为使用了 @IsNotEmpty）。
   */
  it('应该验证失败当菜单名称为空字符串时', async () => {
    const dto = new PageMenusDto();
    dto.current = 1;
    dto.size = 10;
    dto.menuName = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const menuNameError = errors.find((e) => e.property === 'menuName');
    expect(menuNameError).toBeDefined();
  });

  /**
   * 应该验证失败当路由名称为空字符串时
   *
   * 验证当路由名称字段为空字符串时，DTO 验证应该失败（因为使用了 @IsNotEmpty）。
   */
  it('应该验证失败当路由名称为空字符串时', async () => {
    const dto = new PageMenusDto();
    dto.current = 1;
    dto.size = 10;
    dto.routeName = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const routeNameError = errors.find((e) => e.property === 'routeName');
    expect(routeNameError).toBeDefined();
  });
});
