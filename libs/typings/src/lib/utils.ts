/**
 * 属性类型提取工具类型
 *
 * @description 根据路径字符串提取嵌套对象的属性类型
 *
 * @template T - 对象类型
 * @template Path - 属性路径字符串（支持点号分隔的嵌套路径）
 *
 * @example
 * ```typescript
 * type User = { profile: { name: string } };
 * type NameType = PropType<User, 'profile.name'>; // string
 * ```
 */
export type PropType<T, Path extends string> = string extends Path
  ? unknown
  : Path extends keyof T
    ? T[Path]
    : Path extends `${infer K}.${infer R}`
      ? K extends keyof T
        ? PropType<T[K], R>
        : unknown
      : unknown;

/**
 * 嵌套键名类型
 *
 * @description 获取对象的所有可能路径（包括嵌套路径）
 *
 * @template ObjectType - 对象类型
 *
 * @example
 * ```typescript
 * type Keys = NestedKeyOf<{ a: { b: { c: string } } }>;
 * // 'a' | 'a.b' | 'a.b.c'
 * ```
 */
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

/**
 * 记录名称路径类型
 *
 * @description 将对象类型转换为以路径为键、路径对应类型为值的记录类型
 *
 * @template T - 对象类型
 *
 * @example
 * ```typescript
 * type Config = { app: { port: number } };
 * type Paths = RecordNamePaths<Config>;
 * // { 'app': { port: number }, 'app.port': number }
 * ```
 */
export type RecordNamePaths<T extends object> = {
  [K in NestedKeyOf<T>]: PropType<T, K>;
};
