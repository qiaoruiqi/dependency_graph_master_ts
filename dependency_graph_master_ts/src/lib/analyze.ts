const util = require("util");
const anapath = require('path');
const resolve = util.promisify(require.resolve);
module.exports = {
  getViewerData
}
// 定义ViewerData接收参数的接口
interface ViewerDataProps {
  bundleStats: object; // 模块解析内容
  bundleStatsFile: string; // 模块所在文件夹
  param1?: any, // 传入的参数
  level_?: number; // 指定的深度
}
// 定义解析出模块的接口
interface bundleStatsProps {
  dependencies?: object,
  devDependencies?: object
}
// 定义返回数据graph接口
interface graphProps {
  source: any,
  target: any,
  type: number,
}
// 定义返回数据node接口
interface nodeArrayProps {
  id: string,
  weight: number,
  type: number
}
interface Dependencies {
  graph: graphProps[];
  nodeArray: nodeArrayProps[];
}

interface UniqueDependencies {
  uniqueGraph?: graphProps[];
  uniqueNodeArray?: nodeArrayProps[];
}

let visited = new Set();
let param1Processed: boolean = true; //首次传入参数
let visitedProcess: boolean = true; // 查到对应的搜索条件
let aimdepth: number;//目标深度
let folderPath: string = ""; // 实际的文件夹路径
async function getViewerData({
  bundleStats,
  bundleStatsFile: bundleDir,
  param1,
  level_:level,
}: ViewerDataProps) {
  if (typeof bundleStats === "object" && !Array.isArray(bundleStats)) {
    const filteredDependencies = handleDependency(bundleStats);
    visited = new Set();
    param1Processed = true;
    visitedProcess = true;
    aimdepth = level ? level : NaN;
    const dependencies = await buildDependencyGraph(
      bundleDir,
      null,
      filteredDependencies,
      0,
      1,
      param1
    );
    // 对数据进行处理，由于版本不同的原因，需要将重复的指向和节点给删除掉
    const uniquedependencies = handleUniquedependencies(dependencies);
    return uniquedependencies;
  }
}
// 构建依赖
async function buildDependencyGraph(
  baseDir: any,
  sourcedep: any,
  dependencies: { [key: string]: string },
  depth = 0,
  typeCounter = 1,
  param1: undefined | string
) {
  const graph: graphProps[] = [];
  const nodeArray: any[] = [];
  // 提前跳出递归
  if (depth > aimdepth) return { graph, nodeArray };
  for (const dependency in dependencies) {
    const dependency_ = dependency + dependencies[dependency].replace("^", "@");
    // 计算权重，深度越深，权重越小
    const weight = 1 / (depth + 1);
    // 首次传入参数，参数和当前依赖相同，加入节点
    if (param1 == dependency && param1Processed) {
      nodeArray.push({ id: dependency, weight, type: typeCounter });
      param1Processed = false;
    }
    // 查到对应的搜索条件
    if (param1 == sourcedep && visitedProcess) {
      visited = new Set();
      visitedProcess = false;
    }
    // 没有传入参数--全局搜索
    // 传入参数，且传入参数与父依赖相同 
    // 皆进入下面的逻辑
    if ((param1 != undefined && param1 == sourcedep) || param1 == undefined) {
      // 将依赖关系添加到图中
      if (sourcedep != null) {
        graph.push({
          source: sourcedep,
          target: dependency,
          type: typeCounter,
        });
      }
      if (visited.has(dependency_)) {
        continue; // 跳过处理，避免环形依赖
      }
      visited.add(dependency_);
      nodeArray.push({ id: dependency, weight, type: typeCounter });
    } else {
      if (visited.has(dependency_)) {
        continue; // 跳过处理，避免环形依赖
      }
      visited.add(dependency_);
    }
    //处理不同包依赖工具的路径逻辑相同
    // 首次进入
    if (!baseDir.includes('node_modules')) {
      folderPath = anapath.join(
        anapath.dirname(require.resolve(baseDir)),
        "/node_modules"
      );
    } else {
      // 非首次
      folderPath = baseDir;
      while (!folderPath.endsWith('node_modules')) {
        folderPath = anapath.dirname(folderPath);
      }
    }
    const dependencyFolder = anapath.join(folderPath, dependency);
    const dependencyPackageJsonPath = anapath.join(dependencyFolder, "package.json");
    let { status, path_ } = checkfileRequire(dependencyPackageJsonPath);
    if (status) {
      //  读取依赖的 package.json
      const bundleStats = readPackageJsonRequire(dependencyPackageJsonPath);
      if (bundleStats != null) {
        const filteredDependencies = handleDependency(bundleStats);

        // 递归构建子依赖关系图
        const subDependencies = await buildDependencyGraph(
          path_,
          dependency,
          filteredDependencies,
          depth + 1, // 递归深度增加,
          typeCounter,
          param1 !== undefined && param1 == sourcedep ? dependency : param1
        );
        // if (param1 != null && param1 == sourcedep ) {
        //   visited.delete(dependencyFolder);
        // }
        if (subDependencies.nodeArray)
          // 将子依赖关系图中的节点数组合并到当前节点数组
          nodeArray.push(...subDependencies.nodeArray);
        if (subDependencies.graph)
          // 将子依赖关系图中的图信息合并到当前图数组
          graph.push(...subDependencies.graph);
        typeCounter++;
      } else {
        continue;
      }
    } else {
      continue;
    }
  }
  return { graph, nodeArray };
}
// 依赖合并处理
function handleDependency(bundleStats: bundleStatsProps) {
  const dependencies_all = {
    ...bundleStats.dependencies,
    ...bundleStats.devDependencies,
  };
  return dependencies_all;
}
// 用require.resolve解决文件解析
function checkfileRequire(dependencyPackageJsonPath: string) {
  try {
    let path_ = require.resolve(dependencyPackageJsonPath);
    return { status: true, path_ }; // 返回true表示文件存在
  } catch (err: any) {
    if (err.code === "ENOENT") {
      console.error(`Files not found: ${dependencyPackageJsonPath}`);
    } else {
      console.error(`Error checking file: ${err.message}`);
    }
    return { status: false }; // 返回false表示文件不存在
  }
}
function readPackageJsonRequire(dependencyPackageJsonPath: string) {
  return require(dependencyPackageJsonPath);
}
// 删除不同版本带来重复的数据
function handleUniquedependencies(dependencies: Dependencies): UniqueDependencies {
  const { graph, nodeArray } = dependencies;
  const uniqueGraph: graphProps[] = [];
  const uniqueNodeArray: nodeArrayProps[] = [];
  for (const item of graph) {
    const isDuplicate = uniqueGraph.some(
      (uniqueItem) =>
        uniqueItem.source === item.source && uniqueItem.target === item.target
    );
    if (!isDuplicate) {
      uniqueGraph.push(item);
    }
  }
  for (const item of nodeArray) {
    const isDuplicate = uniqueNodeArray.some(
      (uniqueItem) => uniqueItem.id === item.id
    );

    if (!isDuplicate) {
      uniqueNodeArray.push(item);
    }
  }
  return { uniqueGraph, uniqueNodeArray };
}