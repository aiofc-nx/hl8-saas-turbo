import { describe, expect, it } from '@jest/globals';

import type { NestedKeyOf, PropType, RecordNamePaths } from './utils.js';

/**
 * 类型测试辅助函数
 * 用于验证类型推断是否正确
 */
type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

describe('类型工具测试', () => {
  describe('PropType', () => {
    it('应该能够提取简单对象的属性类型', () => {
      type User = { name: string; age: number };
      type NameType = PropType<User, 'name'>;
      type AgeType = PropType<User, 'age'>;

      // 类型断言验证
      const nameTest: Expect<Equal<NameType, string>> = true;
      const ageTest: Expect<Equal<AgeType, number>> = true;

      expect(nameTest).toBe(true);
      expect(ageTest).toBe(true);
    });

    it('应该能够提取嵌套对象的属性类型', () => {
      type User = {
        profile: {
          name: string;
          email: string;
        };
        settings: {
          theme: 'light' | 'dark';
        };
      };

      type ProfileNameType = PropType<User, 'profile.name'>;
      type ProfileEmailType = PropType<User, 'profile.email'>;
      type ThemeType = PropType<User, 'settings.theme'>;

      const nameTest: Expect<Equal<ProfileNameType, string>> = true;
      const emailTest: Expect<Equal<ProfileEmailType, string>> = true;
      const themeTest: Expect<Equal<ThemeType, 'light' | 'dark'>> = true;

      expect(nameTest).toBe(true);
      expect(emailTest).toBe(true);
      expect(themeTest).toBe(true);
    });

    it('应该能够提取深层嵌套对象的属性类型', () => {
      type Config = {
        app: {
          database: {
            host: string;
            port: number;
            credentials: {
              username: string;
              password: string;
            };
          };
        };
      };

      type HostType = PropType<Config, 'app.database.host'>;
      type PortType = PropType<Config, 'app.database.port'>;
      type UsernameType = PropType<Config, 'app.database.credentials.username'>;
      type PasswordType = PropType<Config, 'app.database.credentials.password'>;

      const hostTest: Expect<Equal<HostType, string>> = true;
      const portTest: Expect<Equal<PortType, number>> = true;
      const usernameTest: Expect<Equal<UsernameType, string>> = true;
      const passwordTest: Expect<Equal<PasswordType, string>> = true;

      expect(hostTest).toBe(true);
      expect(portTest).toBe(true);
      expect(usernameTest).toBe(true);
      expect(passwordTest).toBe(true);
    });

    it('对于无效路径应该返回 unknown', () => {
      type User = { name: string };
      type InvalidType = PropType<User, 'invalid'>;
      type InvalidNestedType = PropType<User, 'name.invalid'>;

      const invalidTest: Expect<Equal<InvalidType, unknown>> = true;
      const invalidNestedTest: Expect<Equal<InvalidNestedType, unknown>> = true;

      expect(invalidTest).toBe(true);
      expect(invalidNestedTest).toBe(true);
    });

    it('对于 string 类型的路径应该返回 unknown', () => {
      type User = { name: string };
      type StringPathType = PropType<User, string>;

      const stringPathTest: Expect<Equal<StringPathType, unknown>> = true;
      expect(stringPathTest).toBe(true);
    });

    it('应该能够处理可选属性', () => {
      type User = {
        name: string;
        email?: string;
        profile?: {
          bio: string;
        };
      };

      type EmailType = PropType<User, 'email'>;
      type BioType = PropType<User, 'profile.bio'>;

      const emailTest: Expect<Equal<EmailType, string | undefined>> = true;
      const bioTest: Expect<Equal<BioType, string | undefined>> = true;

      expect(emailTest).toBe(true);
      expect(bioTest).toBe(true);
    });

    it('应该能够处理联合类型属性', () => {
      type User = {
        status: 'active' | 'inactive';
        role: {
          name: 'admin' | 'user';
        };
      };

      type StatusType = PropType<User, 'status'>;
      type RoleNameType = PropType<User, 'role.name'>;

      const statusTest: Expect<Equal<StatusType, 'active' | 'inactive'>> = true;
      const roleNameTest: Expect<Equal<RoleNameType, 'admin' | 'user'>> = true;

      expect(statusTest).toBe(true);
      expect(roleNameTest).toBe(true);
    });
  });

  describe('NestedKeyOf', () => {
    it('应该能够提取简单对象的键名', () => {
      type User = { name: string; age: number };
      type Keys = NestedKeyOf<User>;

      const keysTest: Expect<Equal<Keys, 'name' | 'age'>> = true;
      expect(keysTest).toBe(true);
    });

    it('应该能够提取嵌套对象的键名', () => {
      type User = {
        name: string;
        profile: {
          email: string;
          bio: string;
        };
      };
      type Keys = NestedKeyOf<User>;

      const keysTest: Expect<
        Equal<Keys, 'name' | 'profile' | 'profile.email' | 'profile.bio'>
      > = true;
      expect(keysTest).toBe(true);
    });

    it('应该能够提取深层嵌套对象的键名', () => {
      type Config = {
        app: {
          database: {
            host: string;
            port: number;
          };
        };
      };
      type Keys = NestedKeyOf<Config>;

      const keysTest: Expect<
        Equal<
          Keys,
          'app' | 'app.database' | 'app.database.host' | 'app.database.port'
        >
      > = true;
      expect(keysTest).toBe(true);
    });

    it('应该能够处理空对象', () => {
      type Empty = {};
      type Keys = NestedKeyOf<Empty>;

      const keysTest: Expect<Equal<Keys, never>> = true;
      expect(keysTest).toBe(true);
    });

    it('应该能够处理包含数组的对象', () => {
      type User = {
        name: string;
        tags: string[];
      };
      type Keys = NestedKeyOf<User>;

      // 数组类型会被视为 object，所以会包含 'tags'
      const keysTest: Expect<Equal<Keys, 'name' | 'tags'>> = true;
      expect(keysTest).toBe(true);
    });

    it('应该能够处理混合类型的对象', () => {
      type Mixed = {
        string: string;
        number: number;
        boolean: boolean;
        nested: {
          value: string;
        };
      };
      type Keys = NestedKeyOf<Mixed>;

      const keysTest: Expect<
        Equal<Keys, 'string' | 'number' | 'boolean' | 'nested' | 'nested.value'>
      > = true;
      expect(keysTest).toBe(true);
    });
  });

  describe('RecordNamePaths', () => {
    it('应该能够将简单对象转换为路径记录', () => {
      type User = { name: string; age: number };
      type Paths = RecordNamePaths<User>;

      const pathsTest: Expect<Equal<Paths, { name: string; age: number }>> =
        true;
      expect(pathsTest).toBe(true);
    });

    it('应该能够将嵌套对象转换为路径记录', () => {
      type User = {
        name: string;
        profile: {
          email: string;
        };
      };
      type Paths = RecordNamePaths<User>;

      const pathsTest: Expect<
        Equal<
          Paths,
          {
            name: string;
            profile: { email: string };
            'profile.email': string;
          }
        >
      > = true;
      expect(pathsTest).toBe(true);
    });

    it('应该能够将深层嵌套对象转换为路径记录', () => {
      type Config = {
        app: {
          database: {
            host: string;
          };
        };
      };
      type Paths = RecordNamePaths<Config>;

      const pathsTest: Expect<
        Equal<
          Paths,
          {
            app: { database: { host: string } };
            'app.database': { host: string };
            'app.database.host': string;
          }
        >
      > = true;
      expect(pathsTest).toBe(true);
    });

    it('应该能够处理复杂嵌套结构', () => {
      type Complex = {
        a: string;
        b: {
          c: number;
          d: {
            e: boolean;
          };
        };
      };
      type Paths = RecordNamePaths<Complex>;

      const pathsTest: Expect<
        Equal<
          Paths,
          {
            a: string;
            b: { c: number; d: { e: boolean } };
            'b.c': number;
            'b.d': { e: boolean };
            'b.d.e': boolean;
          }
        >
      > = true;
      expect(pathsTest).toBe(true);
    });

    it('应该能够处理可选属性', () => {
      type User = {
        name: string;
        email?: string;
        profile?: {
          bio: string;
        };
      };
      type Paths = RecordNamePaths<User>;

      // 验证路径记录包含可选属性
      const pathsTest: Expect<
        Equal<
          Paths,
          {
            name: string;
            email?: string;
            profile?: { bio: string };
            'profile.bio'?: string;
          }
        >
      > = true;
      expect(pathsTest).toBe(true);
    });
  });

  describe('类型工具组合使用', () => {
    it('应该能够组合使用 PropType 和 NestedKeyOf', () => {
      type Config = {
        app: {
          port: number;
        };
      };

      type Keys = NestedKeyOf<Config>;
      type PortType = PropType<Config, 'app.port'>;

      const keysTest: Expect<Equal<Keys, 'app' | 'app.port'>> = true;
      const portTest: Expect<Equal<PortType, number>> = true;

      expect(keysTest).toBe(true);
      expect(portTest).toBe(true);
    });

    it('应该能够组合使用所有类型工具', () => {
      type Config = {
        app: {
          database: {
            host: string;
          };
        };
      };

      type Keys = NestedKeyOf<Config>;
      type Paths = RecordNamePaths<Config>;
      type HostType = PropType<Config, 'app.database.host'>;

      const keysTest: Expect<
        Equal<Keys, 'app' | 'app.database' | 'app.database.host'>
      > = true;
      const hostTest: Expect<Equal<HostType, string>> = true;
      const pathsTest: Expect<
        Equal<
          Paths,
          {
            app: { database: { host: string } };
            'app.database': { host: string };
            'app.database.host': string;
          }
        >
      > = true;

      expect(keysTest).toBe(true);
      expect(hostTest).toBe(true);
      expect(pathsTest).toBe(true);
    });
  });
});
