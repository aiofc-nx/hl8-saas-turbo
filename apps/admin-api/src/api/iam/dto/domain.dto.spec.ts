import { validate } from 'class-validator';

import { DomainCreateDto, DomainUpdateDto } from './domain.dto';

/**
 * DomainCreateDto 单元测试
 *
 * @description
 * 测试域创建数据传输对象的验证规则。
 */
describe('DomainCreateDto', () => {
  /**
   * 应该通过验证当所有必填字段都提供时
   *
   * 验证当提供所有必填字段时，DTO 能够通过验证。
   */
  it('应该通过验证当所有必填字段都提供时', async () => {
    const dto = new DomainCreateDto();
    dto.code = 'example';
    dto.name = '示例域';
    dto.description = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当所有字段都提供时
   *
   * 验证当提供所有字段（包括可选字段）时，DTO 能够通过验证。
   */
  it('应该通过验证当所有字段都提供时', async () => {
    const dto = new DomainCreateDto();
    dto.code = 'example';
    dto.name = '示例域';
    dto.description = '这是一个示例域';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该验证失败当域代码缺失时
   *
   * 验证当域代码字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当域代码缺失时', async () => {
    const dto = new DomainCreateDto();
    dto.name = '示例域';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });

  /**
   * 应该验证失败当域名称缺失时
   *
   * 验证当域名称字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当域名称缺失时', async () => {
    const dto = new DomainCreateDto();
    dto.code = 'example';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  /**
   * 应该通过验证当描述为 null 时
   *
   * 验证当描述字段为 null 时，DTO 能够通过验证（因为它是可选的）。
   */
  it('应该通过验证当描述为 null 时', async () => {
    const dto = new DomainCreateDto();
    dto.code = 'example';
    dto.name = '示例域';
    dto.description = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

/**
 * DomainUpdateDto 单元测试
 *
 * @description
 * 测试域更新数据传输对象的验证规则。
 */
describe('DomainUpdateDto', () => {
  /**
   * 应该通过验证当所有必填字段都提供时
   *
   * 验证当提供所有必填字段时，DTO 能够通过验证。
   */
  it('应该通过验证当所有必填字段都提供时', async () => {
    const dto = new DomainUpdateDto();
    dto.id = 'domain-123';
    dto.code = 'example';
    dto.name = '示例域';
    dto.description = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该验证失败当 ID 缺失时
   *
   * 验证当域 ID 字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当 ID 缺失时', async () => {
    const dto = new DomainUpdateDto();
    dto.code = 'example';
    dto.name = '示例域';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'id')).toBe(true);
  });
});
