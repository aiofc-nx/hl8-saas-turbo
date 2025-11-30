import cluster from 'node:cluster';
import path from 'path';

/**
 * 是否为主集群实例
 * 
 * @description 判断当前进程是否为主集群实例（实例编号为 0 或未设置）
 */
export const isMainCluster =
  process.env.NODE_APP_INSTANCE === undefined ||
  Number.parseInt(process.env.NODE_APP_INSTANCE, 10) === 0;

/**
 * 是否为主进程
 * 
 * @description 判断当前进程是否为主进程（集群主进程或主集群实例）
 */
export const isMainProcess = cluster.isPrimary || isMainCluster;

/**
 * 是否为开发环境
 * 
 * @description 判断当前运行环境是否为开发环境
 */
export const isDevEnvironment = process.env.NODE_ENV === 'development';

/**
 * 获取环境变量布尔值
 * 
 * @description 从环境变量中获取布尔值，如果不存在则返回默认值
 * 
 * @param key - 环境变量键名
 * @param defaultValue - 默认值
 * @returns 返回布尔值
 * 
 * @example
 * ```typescript
 * const enabled = getEnvBoolean('FEATURE_ENABLED', false);
 * ```
 */
export const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  return value !== undefined ? value === 'true' : defaultValue;
};

/**
 * 获取环境变量字符串值
 * 
 * @description 从环境变量中获取字符串值，如果不存在则返回默认值
 * 
 * @param key - 环境变量键名
 * @param defaultValue - 默认值
 * @returns 返回字符串值
 * 
 * @example
 * ```typescript
 * const host = getEnvString('DB_HOST', 'localhost');
 * ```
 */
export const getEnvString = (key: string, defaultValue: string): string => {
  const value = process.env[key];
  return value ?? defaultValue;
};

/**
 * 获取环境变量数字值
 * 
 * @description 从环境变量中获取数字值，如果不存在或解析失败则返回默认值
 * 
 * @param key - 环境变量键名
 * @param defaultValue - 默认值
 * @returns 返回数字值
 * 
 * @example
 * ```typescript
 * const port = getEnvNumber('APP_PORT', 3000);
 * ```
 */
export const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value) {
    const parsed = parseInt(value, 10);
    return !isNaN(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
};

/**
 * 获取环境变量数组值
 * 
 * @description 从环境变量中获取数组值（以逗号分隔），如果不存在则返回默认值
 * 
 * @param key - 环境变量键名
 * @param defaultValue - 默认值数组
 * @returns 返回数组值
 * 
 * @example
 * ```typescript
 * const origins = getEnvArray('CORS_ORIGINS', ['http://localhost:3000']);
 * ```
 */
export const getEnvArray = <T = string>(
  key: string,
  defaultValue: T[] = [],
): T[] => {
  const value = process.env[key];
  return value === undefined ? defaultValue : (value.split(',') as T[]);
};

/**
 * 获取应用名称
 * 
 * @description 从主模块路径中提取应用名称
 * 
 * @returns 返回应用名称，如果无法确定则返回 'base-system'
 * 
 * @example
 * 如果主模块路径为 'apps/user-api/src/main.ts'，则返回 'user-api'
 */
export function getAppName(): string {
  if (!require.main) {
    return 'base-system'; // 默认值，以防无法确定
  }

  const mainPath = require.main.filename;
  const match = RegExp(/apps[/\\]([^/\\]+)/).exec(mainPath);
  return match ? match[1] : 'base-system';
}

/**
 * 获取配置文件路径
 * 
 * @description 根据应用名称和运行环境获取配置文件的完整路径
 * 
 * @param filename - 配置文件名
 * @returns 返回配置文件的完整路径
 * 
 * @example
 * ```typescript
 * const configPath = getConfigPath('database.json');
 * // 开发环境: 'apps/base-system/src/resources/database.json'
 * // 生产环境: 'dist/apps/base-system/src/resources/database.json'
 * ```
 */
export function getConfigPath(filename: string): string {
  const appName = getAppName();
  const basePath = process.cwd();
  const resourcePath = path.join('src', 'resources', filename);

  if (isDevEnvironment) {
    return path.join(basePath, 'apps', appName, resourcePath);
  } else {
    return path.join(basePath, 'dist', 'apps', appName, resourcePath);
  }
}
