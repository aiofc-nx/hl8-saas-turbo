import { validate } from 'class-validator';

import { RoleRelationCreateDto } from './role-relation.dto';

/**
 * RoleRelationCreateDto 单元测试
 *
 * 测试角色继承关系创建数据传输对象的验证逻辑。
 */
describe('RoleRelationCreateDto', () => {
  /**
   * 应该通过有效数据的验证
   *
   * 验证当提供有效的角色继承关系数据时，DTO 能够通过验证。
   */
  it('应该通过有效数据的验证', async () => {
    const dto = new RoleRelationCreateDto();
    dto.childSubject = 'user-123';
    dto.parentRole = 'admin';
    dto.domain = 'example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该通过仅包含必填字段的验证
   *
   * 验证当只提供必填字段（childSubject 和 parentRole）时，DTO 能够通过验证。
   */
  it('应该通过仅包含必填字段的验证', async () => {
    const dto = new RoleRelationCreateDto();
    dto.childSubject = 'user-123';
    dto.parentRole = 'admin';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝空 childSubject 字段
   *
   * 验证当 childSubject 为空字符串时，DTO 验证失败。
   */
  it('应该拒绝空 childSubject 字段', async () => {
    const dto = new RoleRelationCreateDto();
    dto.childSubject = '';
    dto.parentRole = 'admin';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('childSubject');
  });

  /**
   * 应该拒绝缺失 childSubject 字段
   *
   * 验证当 childSubject 字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失 childSubject 字段', async () => {
    const dto = new RoleRelationCreateDto();
    dto.parentRole = 'admin';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'childSubject')).toBe(true);
  });

  /**
   * 应该拒绝空 parentRole 字段
   *
   * 验证当 parentRole 为空字符串时，DTO 验证失败。
   */
  it('应该拒绝空 parentRole 字段', async () => {
    const dto = new RoleRelationCreateDto();
    dto.childSubject = 'user-123';
    dto.parentRole = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'parentRole')).toBe(true);
  });

  /**
   * 应该拒绝缺失 parentRole 字段
   *
   * 验证当 parentRole 字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失 parentRole 字段', async () => {
    const dto = new RoleRelationCreateDto();
    dto.childSubject = 'user-123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'parentRole')).toBe(true);
  });

  /**
   * 应该允许可选的 domain 字段为空
   *
   * 验证当 domain 字段未设置时，DTO 仍然能够通过验证。
   */
  it('应该允许可选的 domain 字段为空', async () => {
    const dto = new RoleRelationCreateDto();
    dto.childSubject = 'user-123';
    dto.parentRole = 'admin';
    dto.domain = undefined;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝非字符串类型的 childSubject
   *
   * 验证当 childSubject 不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的 childSubject', async () => {
    const dto = new RoleRelationCreateDto();
    // @ts-expect-error 测试非字符串类型
    dto.childSubject = 123;
    dto.parentRole = 'admin';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'childSubject')).toBe(true);
  });

  /**
   * 应该拒绝非字符串类型的 parentRole
   *
   * 验证当 parentRole 不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的 parentRole', async () => {
    const dto = new RoleRelationCreateDto();
    dto.childSubject = 'user-123';
    // @ts-expect-error 测试非字符串类型
    dto.parentRole = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'parentRole')).toBe(true);
  });

  /**
   * 应该拒绝非字符串类型的 domain
   *
   * 验证当 domain 不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的 domain', async () => {
    const dto = new RoleRelationCreateDto();
    dto.childSubject = 'user-123';
    dto.parentRole = 'admin';
    // @ts-expect-error 测试非字符串类型
    dto.domain = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'domain')).toBe(true);
  });
});
