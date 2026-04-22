/**
 * 大数据Agent工作流 - 节点类型定义
 */

export const NODE_CATEGORIES = [
  {
    label: '数据节点',
    key: 'data',
    nodes: ['dataSource', 'output'],
  },
  {
    label: '处理节点',
    key: 'process',
    nodes: ['sqlQuery', 'pythonScript', 'transform', 'filter', 'join'],
  },
  {
    label: 'AI 节点',
    key: 'ai',
    nodes: ['llmModel', 'agent'],
  },
  {
    label: '控制节点',
    key: 'control',
    nodes: ['condition'],
  },
]

export const NODE_TYPE_CONFIG = {
  dataSource: {
    type: 'dataSource',
    label: '数据源',
    icon: '🗄️',
    color: '#10b981',
    category: 'data',
    description: '连接数据库、文件或API获取数据',
    handles: { inputs: 0, outputs: 1 },
    defaultConfig: {
      sourceType: 'mysql',
      host: '',
      port: 3306,
      database: '',
      table: '',
      username: '',
      password: '',
      query: '',
    },
    configFields: [
      { key: 'sourceType', label: '数据源类型', type: 'select', options: ['mysql', 'postgresql', 'hive', 'hdfs', 'kafka', 'csv', 'api'] },
      { key: 'host', label: '主机地址', type: 'text', placeholder: '例如: localhost' },
      { key: 'port', label: '端口', type: 'number' },
      { key: 'database', label: '数据库', type: 'text' },
      { key: 'table', label: '表名', type: 'text' },
      { key: 'username', label: '用户名', type: 'text' },
      { key: 'password', label: '密码', type: 'password' },
      { key: 'query', label: '自定义查询', type: 'textarea', placeholder: 'SELECT * FROM ...' },
    ],
  },

  sqlQuery: {
    type: 'sqlQuery',
    label: 'SQL 查询',
    icon: '📊',
    color: '#3b82f6',
    category: 'process',
    description: '执行SQL查询进行数据处理',
    handles: { inputs: 1, outputs: 1 },
    defaultConfig: {
      engine: 'spark-sql',
      sql: '',
      timeout: 300,
      partitions: 4,
    },
    configFields: [
      { key: 'engine', label: '执行引擎', type: 'select', options: ['spark-sql', 'hive', 'presto', 'flink-sql'] },
      { key: 'sql', label: 'SQL语句', type: 'code', placeholder: 'SELECT * FROM ${input} WHERE ...' },
      { key: 'timeout', label: '超时时间(秒)', type: 'number' },
      { key: 'partitions', label: '分区数', type: 'number' },
    ],
  },

  pythonScript: {
    type: 'pythonScript',
    label: 'Python 脚本',
    icon: '🐍',
    color: '#f59e0b',
    category: 'process',
    description: '运行自定义Python脚本处理数据',
    handles: { inputs: 1, outputs: 1 },
    defaultConfig: {
      runtime: 'python3.10',
      code: '# 输入数据通过 df 变量获取\n# 处理后赋值给 result\nresult = df',
      dependencies: '',
      memory: '2g',
    },
    configFields: [
      { key: 'runtime', label: '运行环境', type: 'select', options: ['python3.8', 'python3.9', 'python3.10', 'python3.11'] },
      { key: 'code', label: '脚本代码', type: 'code', placeholder: '# 在此编写Python代码' },
      { key: 'dependencies', label: '依赖包', type: 'text', placeholder: 'pandas,numpy,scikit-learn' },
      { key: 'memory', label: '内存限制', type: 'select', options: ['1g', '2g', '4g', '8g', '16g'] },
    ],
  },

  llmModel: {
    type: 'llmModel',
    label: 'LLM 模型',
    icon: '🤖',
    color: '#8b5cf6',
    category: 'ai',
    description: '调用大语言模型进行智能处理',
    handles: { inputs: 1, outputs: 1 },
    defaultConfig: {
      model: 'gpt-4',
      prompt: '',
      systemPrompt: '你是一个大数据分析助手。',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
    },
    configFields: [
      { key: 'model', label: '模型', type: 'select', options: ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'qwen-max', 'deepseek-v2', 'glm-4'] },
      { key: 'systemPrompt', label: '系统提示词', type: 'textarea', placeholder: '定义AI角色和行为...' },
      { key: 'prompt', label: '提示词模板', type: 'textarea', placeholder: '使用 ${input} 引用输入数据' },
      { key: 'temperature', label: '温度', type: 'slider', min: 0, max: 2, step: 0.1 },
      { key: 'maxTokens', label: '最大Token数', type: 'number' },
      { key: 'topP', label: 'Top P', type: 'slider', min: 0, max: 1, step: 0.05 },
    ],
  },

  agent: {
    type: 'agent',
    label: 'Agent 智能体',
    icon: '🧠',
    color: '#ec4899',
    category: 'ai',
    description: 'AI Agent自主决策和工具调用',
    handles: { inputs: 1, outputs: 1 },
    defaultConfig: {
      agentType: 'react',
      model: 'gpt-4',
      systemPrompt: '',
      tools: [],
      maxIterations: 10,
      earlyStop: true,
    },
    configFields: [
      { key: 'agentType', label: 'Agent类型', type: 'select', options: ['react', 'plan-and-execute', 'auto-gpt', 'custom'] },
      { key: 'model', label: '基础模型', type: 'select', options: ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'qwen-max'] },
      { key: 'systemPrompt', label: '系统提示词', type: 'textarea', placeholder: '定义Agent的目标和行为...' },
      { key: 'tools', label: '可用工具', type: 'tags', placeholder: '添加工具名称' },
      { key: 'maxIterations', label: '最大迭代次数', type: 'number' },
      { key: 'earlyStop', label: '提前终止', type: 'switch' },
    ],
  },

  transform: {
    type: 'transform',
    label: '数据转换',
    icon: '🔄',
    color: '#06b6d4',
    category: 'process',
    description: '对数据进行格式转换和映射',
    handles: { inputs: 1, outputs: 1 },
    defaultConfig: {
      transformType: 'map',
      expression: '',
      columns: '',
      outputFormat: 'dataframe',
    },
    configFields: [
      { key: 'transformType', label: '转换类型', type: 'select', options: ['map', 'flatMap', 'aggregate', 'pivot', 'unpivot', 'rename'] },
      { key: 'expression', label: '转换表达式', type: 'code', placeholder: '# 定义转换逻辑' },
      { key: 'columns', label: '字段映射', type: 'textarea', placeholder: 'old_name:new_name, ...' },
      { key: 'outputFormat', label: '输出格式', type: 'select', options: ['dataframe', 'json', 'csv', 'parquet'] },
    ],
  },

  filter: {
    type: 'filter',
    label: '数据过滤',
    icon: '🔍',
    color: '#f97316',
    category: 'process',
    description: '按条件过滤数据',
    handles: { inputs: 1, outputs: 1 },
    defaultConfig: {
      filterType: 'expression',
      conditions: [{ column: '', operator: '==', value: '' }],
      expression: '',
      logic: 'and',
    },
    configFields: [
      { key: 'filterType', label: '过滤方式', type: 'select', options: ['expression', 'conditions'] },
      { key: 'expression', label: '过滤表达式', type: 'code', placeholder: "df['age'] > 18" },
      { key: 'logic', label: '条件逻辑', type: 'select', options: ['and', 'or'] },
    ],
  },

  join: {
    type: 'join',
    label: '数据合并',
    icon: '🔗',
    color: '#14b8a6',
    category: 'process',
    description: '合并多个数据源',
    handles: { inputs: 2, outputs: 1 },
    defaultConfig: {
      joinType: 'inner',
      leftKey: '',
      rightKey: '',
      suffixes: '_left,_right',
    },
    configFields: [
      { key: 'joinType', label: '合并类型', type: 'select', options: ['inner', 'left', 'right', 'outer', 'cross'] },
      { key: 'leftKey', label: '左表关联键', type: 'text', placeholder: '字段名' },
      { key: 'rightKey', label: '右表关联键', type: 'text', placeholder: '字段名' },
      { key: 'suffixes', label: '字段后缀', type: 'text', placeholder: '_left,_right' },
    ],
  },

  output: {
    type: 'output',
    label: '数据输出',
    icon: '📤',
    color: '#ef4444',
    category: 'data',
    description: '将处理结果输出到目标位置',
    handles: { inputs: 1, outputs: 0 },
    defaultConfig: {
      outputType: 'database',
      target: '',
      format: 'parquet',
      mode: 'overwrite',
      partitionBy: '',
    },
    configFields: [
      { key: 'outputType', label: '输出类型', type: 'select', options: ['database', 'hdfs', 'kafka', 'api', 'file'] },
      { key: 'target', label: '目标地址', type: 'text', placeholder: '输出目标路径或连接' },
      { key: 'format', label: '数据格式', type: 'select', options: ['parquet', 'csv', 'json', 'orc', 'avro'] },
      { key: 'mode', label: '写入模式', type: 'select', options: ['overwrite', 'append', 'ignore', 'error'] },
      { key: 'partitionBy', label: '分区字段', type: 'text', placeholder: '用逗号分隔' },
    ],
  },

  condition: {
    type: 'condition',
    label: '条件分支',
    icon: '🔀',
    color: '#a855f7',
    category: 'control',
    description: '根据条件进行流程分支',
    handles: { inputs: 1, outputs: 2 },
    outputLabels: ['True', 'False'],
    defaultConfig: {
      conditionType: 'expression',
      expression: '',
      column: '',
      operator: '==',
      value: '',
    },
    configFields: [
      { key: 'conditionType', label: '条件类型', type: 'select', options: ['expression', 'simple'] },
      { key: 'expression', label: '条件表达式', type: 'code', placeholder: 'len(df) > 0' },
      { key: 'column', label: '判断字段', type: 'text' },
      { key: 'operator', label: '运算符', type: 'select', options: ['==', '!=', '>', '<', '>=', '<=', 'contains', 'is_null'] },
      { key: 'value', label: '比较值', type: 'text' },
    ],
  },
}

export function getNodeTypeConfig(type) {
  return NODE_TYPE_CONFIG[type] || null
}

export function getDefaultNodeData(type) {
  const config = NODE_TYPE_CONFIG[type]
  if (!config) return {}
  return {
    type: config.type,
    label: config.label,
    icon: config.icon,
    color: config.color,
    description: config.description,
    handles: { ...config.handles },
    config: { ...config.defaultConfig },
  }
}
