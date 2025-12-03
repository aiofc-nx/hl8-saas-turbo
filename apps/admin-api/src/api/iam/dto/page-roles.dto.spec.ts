import { validate } from 'class-validator';

import { Status } from '@/lib/shared/enums/status.enum';

import { PageRolesDto } from './page-roles.dto';

/**
 * PageRolesDto 单元测试
 *
 * @description
 * 测试角色分页查询数据传输对象的验证规则。
 */
describe('PageRolesDto', () => {
  /**
   * 应该通过验证当只提供分页参数时
   *
   * 验证当只提供分页参数（current 和 size）时，DTO 能够通过验证。
   */
  it('应该通过验证当只提供分页参数时', async () => {
    const dto = new PageRolesDto();
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
    const dto = new PageRolesDto();
    dto.current = 1;
    dto.size = 10;
    dto.code = 'admin';
    dto.name = '管理员';
    dto.status = Status.ENABLED;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当只提供角色代码筛选时
   *
   * 验证当只提供角色代码筛选字段时，DTO 能够通过验证。
   */
  it('应该通过验证当只提供角色代码筛选时', async () => {
    const dto = new PageRolesDto();
    dto.current = 1;
    dto.size = 10;
    dto.code = 'admin';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当只提供角色名称筛选时
   *
   * 验证当只提供角色名称筛选字段时，DTO 能够通过验证。
   */
  it('应该通过验证当只提供角色名称筛选时', async () => {
    const dto = new PageRolesDto();
    dto.current = 1;
    dto.size = 10;
    dto.name = '管理员';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当只提供状态筛选时
   *
   * 验证当只提供状态筛选字段时，DTO 能够通过验证。
   */
  it('应该通过验证当只提供状态筛选时', async () => {
    const dto = new PageRolesDto();
    dto.current = 1;
    dto.size = 10;
    dto.status = Status.ENABLED;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该验证失败当状态不是有效枚举值时
   *
   * 验证当状态字段不是有效的枚举值时，DTO 验证应该失败。
   */
  it('应该验证失败当状态不是有效枚举值时', async () => {
    const dto = new PageRolesDto();
    dto.current = 1;
    dto.size = 10;
    (dto as any).status = 'INVALID_STATUS';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const statusError = errors.find((e) => e.property === 'status');
    expect(statusError).toBeDefined();
  });

  /**
   * 应该验证失败当角色代码为空字符串时
   *
   * 验证当角色代码字段为空字符串时，DTO 验证应该失败（因为使用了 @IsNotEmpty）。
   */
  it('应该验证失败当角色代码为空字符串时', async () => {
    const dto = new PageRolesDto();
    dto.current = 1;
    dto.size = 10;
    dto.code = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const codeError = errors.find((e) => e.property === 'code');
    expect(codeError).toBeDefined();
  });

  /**
   * 应该验证失败当角色名称为空字符串时
   *
   * 验证当角色名称字段为空字符串时，DTO 验证应该失败（因为使用了 @IsNotEmpty）。
   */
  it('应该验证失败当角色名称为空字符串时', async () => {
    const dto = new PageRolesDto();
    dto.current = 1;
    dto.size = 10;
    dto.name = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find((e) => e.property === 'name');
    expect(nameError).toBeDefined();
  });
});
