import { validate } from 'class-validator';

import { Status } from '@/lib/shared/enums/status.enum';

import { AccessKeyCreateDto } from './access_key.dto';

/**
 * AccessKeyCreateDto 单元测试
 *
 * @description
 * 测试访问密钥创建数据传输对象的验证规则。
 */
describe('AccessKeyCreateDto', () => {
  /**
   * 应该通过验证当只提供状态时
   *
   * 验证当只提供状态字段时，DTO 能够通过验证（域和描述都是可选的）。
   */
  it('应该通过验证当只提供状态时', async () => {
    const dto = new AccessKeyCreateDto();
    dto.status = Status.ENABLED;
    dto.domain = null;
    dto.description = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当提供所有字段时
   *
   * 验证当提供所有字段时，DTO 能够通过验证。
   */
  it('应该通过验证当提供所有字段时', async () => {
    const dto = new AccessKeyCreateDto();
    dto.domain = 'example.com';
    dto.status = Status.ENABLED;
    dto.description = '用于第三方系统集成';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当域为 null 时
   *
   * 验证当域字段为 null 时，DTO 能够通过验证（因为它是可选的）。
   */
  it('应该通过验证当域为 null 时', async () => {
    const dto = new AccessKeyCreateDto();
    dto.domain = null;
    dto.status = Status.ENABLED;
    dto.description = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当描述为 null 时
   *
   * 验证当描述字段为 null 时，DTO 能够通过验证（因为它是可选的）。
   */
  it('应该通过验证当描述为 null 时', async () => {
    const dto = new AccessKeyCreateDto();
    dto.domain = 'example.com';
    dto.status = Status.ENABLED;
    dto.description = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该验证失败当状态不是有效枚举值时
   *
   * 验证当状态字段不是有效的枚举值时，DTO 验证应该失败。
   */
  it('应该验证失败当状态不是有效枚举值时', async () => {
    const dto = new AccessKeyCreateDto();
    dto.domain = 'example.com';
    (dto as any).status = 'INVALID_STATUS';
    dto.description = null;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const statusError = errors.find((e) => e.property === 'status');
    expect(statusError).toBeDefined();
  });
});
