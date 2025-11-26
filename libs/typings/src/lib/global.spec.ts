import { describe, expect, it } from '@jest/globals';

import type {
  ApiResponse,
  CreationAuditInfoProperties,
  IAuthentication,
  UpdateAuditInfoProperties,
} from './global.js';

/**
 * 类型测试辅助函数
 */
type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

describe('全局类型定义测试', () => {
  describe('IAuthentication', () => {
    it('应该正确定义认证信息接口结构', () => {
      const auth: IAuthentication = {
        uid: 'user-123',
        username: 'testuser',
        domain: 'example.com',
      };

      expect(auth.uid).toBe('user-123');
      expect(auth.username).toBe('testuser');
      expect(auth.domain).toBe('example.com');
    });

    it('应该要求所有必需字段', () => {
      // 类型测试：缺少字段应该导致类型错误
      type Test1 = Expect<
        Equal<keyof IAuthentication, 'uid' | 'username' | 'domain'>
      >;
      const test1: Test1 = true;
      expect(test1).toBe(true);
    });

    it('应该所有字段都是字符串类型', () => {
      const auth: IAuthentication = {
        uid: 'user-123',
        username: 'testuser',
        domain: 'example.com',
      };

      expect(typeof auth.uid).toBe('string');
      expect(typeof auth.username).toBe('string');
      expect(typeof auth.domain).toBe('string');
    });

    it('应该可以扩展接口', () => {
      interface ExtendedAuth extends IAuthentication {
        email: string;
      }

      const extended: ExtendedAuth = {
        uid: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        email: 'test@example.com',
      };

      expect(extended.uid).toBe('user-123');
      expect(extended.email).toBe('test@example.com');
    });
  });

  describe('ApiResponse', () => {
    it('应该正确定义 API 响应接口结构（无泛型）', () => {
      const response: ApiResponse = {
        code: 200,
        message: 'Success',
      };

      expect(response.code).toBe(200);
      expect(response.message).toBe('Success');
      expect(response.error).toBeUndefined();
      expect(response.data).toBeUndefined();
    });

    it('应该支持泛型类型参数', () => {
      type UserData = { id: string; name: string };
      const response: ApiResponse<UserData> = {
        code: 200,
        message: 'Success',
        data: {
          id: '123',
          name: 'Test User',
        },
      };

      expect(response.code).toBe(200);
      expect(response.data?.id).toBe('123');
      expect(response.data?.name).toBe('Test User');
    });

    it('应该支持错误信息', () => {
      const response: ApiResponse = {
        code: 400,
        message: 'Bad Request',
        error: {
          code: 4001,
          message: 'Validation failed',
        },
      };

      expect(response.code).toBe(400);
      expect(response.error?.code).toBe(4001);
      expect(response.error?.message).toBe('Validation failed');
    });

    it('应该支持同时包含数据和错误（虽然不常见）', () => {
      const response: ApiResponse<string> = {
        code: 200,
        message: 'Partial success',
        error: {
          code: 2001,
          message: 'Warning',
        },
        data: 'some data',
      };

      expect(response.data).toBe('some data');
      expect(response.error).toBeDefined();
    });

    it('应该正确推断泛型类型', () => {
      type ResponseType = ApiResponse<{ id: number }>;
      type DataType = NonNullable<ResponseType['data']>;

      const typeTest: Expect<Equal<DataType, { id: number }>> = true;
      expect(typeTest).toBe(true);
    });

    it('应该所有必需字段都存在', () => {
      type RequiredFields = 'code' | 'message';
      type OptionalFields = 'error' | 'data';
      type AllFields = keyof ApiResponse;

      const requiredTest: Expect<Equal<RequiredFields, 'code' | 'message'>> =
        true;
      const allFieldsTest: Expect<
        Equal<AllFields, RequiredFields | OptionalFields>
      > = true;

      expect(requiredTest).toBe(true);
      expect(allFieldsTest).toBe(true);
    });

    it('应该 error 字段结构正确', () => {
      const response: ApiResponse = {
        code: 400,
        message: 'Error',
        error: {
          code: 4001,
          message: 'Error message',
        },
      };

      expect(response.error).toBeDefined();
      if (response.error) {
        expect(typeof response.error.code).toBe('number');
        expect(typeof response.error.message).toBe('string');
      }
    });

    it('应该支持不同的数据类型', () => {
      const stringResponse: ApiResponse<string> = {
        code: 200,
        message: 'Success',
        data: 'test',
      };

      const numberResponse: ApiResponse<number> = {
        code: 200,
        message: 'Success',
        data: 123,
      };

      const arrayResponse: ApiResponse<string[]> = {
        code: 200,
        message: 'Success',
        data: ['a', 'b', 'c'],
      };

      const objectResponse: ApiResponse<{ key: string }> = {
        code: 200,
        message: 'Success',
        data: { key: 'value' },
      };

      expect(stringResponse.data).toBe('test');
      expect(numberResponse.data).toBe(123);
      expect(arrayResponse.data).toEqual(['a', 'b', 'c']);
      expect(objectResponse.data).toEqual({ key: 'value' });
    });
  });

  describe('CreationAuditInfoProperties', () => {
    it('应该正确定义创建审计信息结构', () => {
      const audit: CreationAuditInfoProperties = {
        createdAt: new Date('2024-01-01'),
        createdBy: 'user-123',
      };

      expect(audit.createdAt).toBeInstanceOf(Date);
      expect(audit.createdBy).toBe('user-123');
    });

    it('应该是只读类型', () => {
      const audit: CreationAuditInfoProperties = {
        createdAt: new Date('2024-01-01'),
        createdBy: 'user-123',
      };

      // 类型测试：验证只读属性
      type TestReadonly = Expect<
        Equal<
          CreationAuditInfoProperties,
          Readonly<{
            createdAt: Date;
            createdBy: string;
          }>
        >
      >;
      const readonlyTest: TestReadonly = true;
      expect(readonlyTest).toBe(true);
    });

    it('应该所有字段都是必需的', () => {
      type RequiredFields = keyof CreationAuditInfoProperties;
      const fieldsTest: Expect<
        Equal<RequiredFields, 'createdAt' | 'createdBy'>
      > = true;
      expect(fieldsTest).toBe(true);
    });

    it('应该 createdAt 是 Date 类型', () => {
      const audit: CreationAuditInfoProperties = {
        createdAt: new Date(),
        createdBy: 'user-123',
      };

      expect(audit.createdAt).toBeInstanceOf(Date);
    });

    it('应该 createdBy 是 string 类型', () => {
      const audit: CreationAuditInfoProperties = {
        createdAt: new Date(),
        createdBy: 'user-123',
      };

      expect(typeof audit.createdBy).toBe('string');
    });
  });

  describe('UpdateAuditInfoProperties', () => {
    it('应该正确定义更新审计信息结构', () => {
      const audit: UpdateAuditInfoProperties = {
        updatedAt: new Date('2024-01-01'),
        updatedBy: 'user-123',
      };

      expect(audit.updatedAt).toBeInstanceOf(Date);
      expect(audit.updatedBy).toBe('user-123');
    });

    it('应该支持 null 值', () => {
      const audit: UpdateAuditInfoProperties = {
        updatedAt: null,
        updatedBy: null,
      };

      expect(audit.updatedAt).toBeNull();
      expect(audit.updatedBy).toBeNull();
    });

    it('应该是只读类型', () => {
      const audit: UpdateAuditInfoProperties = {
        updatedAt: new Date('2024-01-01'),
        updatedBy: 'user-123',
      };

      // 类型测试：验证只读属性
      type TestReadonly = Expect<
        Equal<
          UpdateAuditInfoProperties,
          Readonly<{
            updatedAt: Date | null;
            updatedBy: string | null;
          }>
        >
      >;
      const readonlyTest: TestReadonly = true;
      expect(readonlyTest).toBe(true);
    });

    it('应该所有字段都是必需的（但值可以为 null）', () => {
      type RequiredFields = keyof UpdateAuditInfoProperties;
      const fieldsTest: Expect<
        Equal<RequiredFields, 'updatedAt' | 'updatedBy'>
      > = true;
      expect(fieldsTest).toBe(true);
    });

    it('应该 updatedAt 可以是 Date 或 null', () => {
      const audit1: UpdateAuditInfoProperties = {
        updatedAt: new Date(),
        updatedBy: 'user-123',
      };

      const audit2: UpdateAuditInfoProperties = {
        updatedAt: null,
        updatedBy: null,
      };

      expect(audit1.updatedAt).toBeInstanceOf(Date);
      expect(audit2.updatedAt).toBeNull();
    });

    it('应该 updatedBy 可以是 string 或 null', () => {
      const audit1: UpdateAuditInfoProperties = {
        updatedAt: new Date(),
        updatedBy: 'user-123',
      };

      const audit2: UpdateAuditInfoProperties = {
        updatedAt: new Date(),
        updatedBy: null,
      };

      expect(typeof audit1.updatedBy).toBe('string');
      expect(audit2.updatedBy).toBeNull();
    });

    it('应该支持混合 null 和非 null 值', () => {
      const audit1: UpdateAuditInfoProperties = {
        updatedAt: new Date(),
        updatedBy: null,
      };

      const audit2: UpdateAuditInfoProperties = {
        updatedAt: null,
        updatedBy: 'user-123',
      };

      expect(audit1.updatedAt).toBeInstanceOf(Date);
      expect(audit1.updatedBy).toBeNull();
      expect(audit2.updatedAt).toBeNull();
      expect(audit2.updatedBy).toBe('user-123');
    });
  });

  describe('类型组合使用', () => {
    it('应该能够组合使用审计信息类型', () => {
      type Entity = CreationAuditInfoProperties & UpdateAuditInfoProperties;

      const entity: Entity = {
        createdAt: new Date('2024-01-01'),
        createdBy: 'user-123',
        updatedAt: new Date('2024-01-02'),
        updatedBy: 'user-456',
      };

      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(entity.createdBy).toBe('user-123');
      expect(entity.updatedBy).toBe('user-456');
    });

    it('应该能够在 ApiResponse 中使用 IAuthentication', () => {
      const response: ApiResponse<IAuthentication> = {
        code: 200,
        message: 'Success',
        data: {
          uid: 'user-123',
          username: 'testuser',
          domain: 'example.com',
        },
      };

      expect(response.data?.uid).toBe('user-123');
      expect(response.data?.username).toBe('testuser');
      expect(response.data?.domain).toBe('example.com');
    });

    it('应该能够在 ApiResponse 中使用审计信息', () => {
      type Entity = CreationAuditInfoProperties & UpdateAuditInfoProperties;
      const response: ApiResponse<Entity> = {
        code: 200,
        message: 'Success',
        data: {
          createdAt: new Date('2024-01-01'),
          createdBy: 'user-123',
          updatedAt: new Date('2024-01-02'),
          updatedBy: 'user-456',
        },
      };

      expect(response.data?.createdAt).toBeInstanceOf(Date);
      expect(response.data?.updatedAt).toBeInstanceOf(Date);
    });
  });
});
