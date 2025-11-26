/**
 * 树节点类型
 *
 * @description 定义树节点的数据结构，包含可选的子节点数组
 *
 * @template T - 原始数据类型
 */
type TreeNode<T> = T & {
  /** 子节点数组 */
  children?: TreeNode<T>[];
};

/**
 * 生成树形结构
 *
 * @description 将扁平列表转换为树形结构，支持自定义父节点字段、ID 字段和排序字段
 *
 * @param items - 要转换成树形结构的原始列表
 * @param parentIdField - 父节点字段名称（默认 'pid'）
 * @param idField - 唯一主键字段名称（默认 'id'）
 * @param orderField - 排序字段名称（可选）
 * @returns 返回树形结构数组
 *
 * @example
 * ```typescript
 * const items = [
 *   { id: 1, name: 'Parent', pid: 0 },
 *   { id: 2, name: 'Child', pid: 1 }
 * ];
 * const tree = buildTree(items, 'pid', 'id', 'sort');
 * // 返回: [{ id: 1, name: 'Parent', pid: 0, children: [{ id: 2, name: 'Child', pid: 1 }] }]
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildTree<T extends Record<string, any>>(
  items: T[],
  parentIdField: keyof T = 'pid',
  idField: keyof T = 'id',
  orderField?: keyof T,
): TreeNode<T>[] {
  const itemMap = new Map<string | number, TreeNode<T>>();
  const rootNodes: TreeNode<T>[] = [];

  items.forEach((item) => {
    const nodeId = item[idField];
    const node: TreeNode<T> = { ...item, children: [] };
    itemMap.set(nodeId, node);
  });

  items.forEach((item) => {
    const nodeId = item[idField];
    const parentId = item[parentIdField];
    const node = itemMap.get(nodeId);

    if (node) {
      if (parentId === 0 || parentId === '0') {
        rootNodes.push(node);
      } else {
        const parent = itemMap.get(parentId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(node);
        } else {
          console.error('Parent node not found for ID:', parentId);
        }
      }
    }
  });

  if (orderField) {
    rootNodes.sort(
      (a, b) => (a[orderField] as number) - (b[orderField] as number),
    );
    itemMap.forEach((node) => {
      node.children?.sort(
        (a, b) => (a[orderField] as number) - (b[orderField] as number),
      );
    });
  }

  return rootNodes.map((rootNode) => {
    buildSubTree(rootNode);
    return rootNode;
  });
}

/**
 * 构建子树
 *
 * @description 递归构建子树结构（内部辅助函数）
 *
 * @param node - 树节点
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSubTree<T extends Record<string, any>>(node: TreeNode<T>) {
  if (node.children) {
    node.children.forEach((child) => buildSubTree(child));
  }
}
