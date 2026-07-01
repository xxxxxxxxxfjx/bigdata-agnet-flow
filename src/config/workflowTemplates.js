/**
 * 预设工作流模板
 * 包含完整的 nodes/edges 数据，加载即可渲染
 */

export const WORKFLOW_TEMPLATES = [
  {
    id: 'wf-tpl-data-pipeline',
    name: '数据ETL处理管线',
    description: '从数据源采集数据，经过SQL清洗和Python转换后输出到目标库',
    category: '数据处理',
    icon: '🔄',
    nodes: [
      {
        id: 'node_etl_1', type: 'custom', position: { x: 80, y: 180 },
        data: { type:'dataSource', label:'用户行为日志', icon:'🗄️', color:'#10b981', description:'从 Kafka 消费实时日志', handles:{inputs:0,outputs:1}, config:{ sourceType:'kafka', host:'kafka.cluster.local', port:9092, database:'', table:'', username:'', password:'', query:'' } }
      },
      {
        id: 'node_etl_2', type: 'custom', position: { x: 380, y: 120 },
        data: { type:'sqlQuery', label:'数据清洗', icon:'📊', color:'#3b82f6', description:'过滤脏数据并格式化', handles:{inputs:1,outputs:1}, config:{ engine:'spark-sql', sql:'SELECT user_id, event_type, event_time, properties\nFROM raw_events\nWHERE event_time > CURRENT_DATE - 7\n  AND user_id IS NOT NULL', timeout:300, partitions:8 } }
      },
      {
        id: 'node_etl_3', type: 'custom', position: { x: 380, y: 330 },
        data: { type:'transform', label:'格式转换', icon:'🔄', color:'#06b6d4', description:'JSON字段展开与重命名', handles:{inputs:1,outputs:1}, config:{ transformType:'map', expression:'df.withColumn("props", from_json(col("properties"), schema))', columns:'user_id:uid,event_type:action', outputFormat:'dataframe' } }
      },
      {
        id: 'node_etl_4', type: 'custom', position: { x: 680, y: 180 },
        data: { type:'filter', label:'有效事件过滤', icon:'🔍', color:'#f97316', description:'仅保留核心事件', handles:{inputs:1,outputs:1}, config:{ filterType:'expression', expression:"df.action.isin(['click','purchase','login','share'])", logic:'and' } }
      },
      {
        id: 'node_etl_5', type: 'custom', position: { x: 950, y: 180 },
        data: { type:'output', label:'写入数据仓库', icon:'📤', color:'#ef4444', description:'输出到 Hive 分区表', handles:{inputs:1,outputs:0}, config:{ outputType:'database', target:'hive://dw.user_events', format:'parquet', mode:'overwrite', partitionBy:'dt' } }
      }
    ],
    edges: [
      { id:'e-etl-1-2', source:'node_etl_1', target:'node_etl_2', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-etl-1-3', source:'node_etl_1', target:'node_etl_3', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-etl-2-4', source:'node_etl_2', target:'node_etl_4', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-etl-3-4', source:'node_etl_3', target:'node_etl_4', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-etl-4-5', source:'node_etl_4', target:'node_etl_5', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
    ]
  },
  {
    id: 'wf-tpl-ai-agent',
    name: 'AI智能分析Agent',
    description: 'LLM驱动的数据分析Agent，自动理解需求并调用工具完成分析',
    category: 'AI Agent',
    icon: '🤖',
    nodes: [
      {
        id: 'node_ai_1', type: 'custom', position: { x: 80, y: 180 },
        data: { type:'dataSource', label:'业务数据库', icon:'🗄️', color:'#10b981', description:'MySQL 订单与用户数据', handles:{inputs:0,outputs:1}, config:{ sourceType:'mysql', host:'db.internal', port:3306, database:'business', table:'orders', username:'reader', password:'***', query:'' } }
      },
      {
        id: 'node_ai_2', type: 'custom', position: { x: 380, y: 60 },
        data: { type:'agent', label:'数据分析Agent', icon:'🧠', color:'#ec4899', description:'ReAct模式自主决策分析', handles:{inputs:1,outputs:1}, config:{ agentType:'react', model:'gpt-4', systemPrompt:'你是一个专业的数据分析师，帮助用户理解业务数据。分析订单趋势、用户行为、异常检测。', tools:['sql_query','chart_generator','report_writer'], maxIterations:10, earlyStop:true } }
      },
      {
        id: 'node_ai_3', type: 'custom', position: { x: 380, y: 320 },
        data: { type:'llmModel', label:'LLM总结生成', icon:'🤖', color:'#8b5cf6', description:'生成自然语言分析报告', handles:{inputs:1,outputs:1}, config:{ model:'claude-3', systemPrompt:'根据分析结果生成面向业务人员的分析报告', prompt:'请总结以下数据:\n${input}', temperature:0.7, maxTokens:2048, topP:1 } }
      },
      {
        id: 'node_ai_4', type: 'custom', position: { x: 680, y: 180 },
        data: { type:'condition', label:'置信度判断', icon:'🔀', color:'#a855f7', description:'评估分析结果的可靠性', handles:{inputs:1,outputs:2}, outputLabels:['高置信度','低置信度'], config:{ conditionType:'expression', expression:"result.confidence >= 0.8", column:'', operator:'>=', value:'0.8' } }
      },
      {
        id: 'node_ai_5', type: 'custom', position: { x: 950, y: 100 },
        data: { type:'output', label:'推送报告', icon:'📤', color:'#ef4444', description:'邮件/企微推送分析报告', handles:{inputs:1,outputs:0}, config:{ outputType:'api', target:'https://api.company.com/reports', format:'json', mode:'overwrite', partitionBy:'' } }
      },
      {
        id: 'node_ai_6', type: 'custom', position: { x: 950, y: 300 },
        data: { type:'pythonScript', label:'人工复核脚本', icon:'🐍', color:'#f59e0b', description:'生成需要人工确认的异常清单', handles:{inputs:1,outputs:1}, config:{ runtime:'python3.10', code:'import pandas as pd\ndf = input_data\ndf["needs_review"] = True\ndf["review_reason"] = "置信度不足"\nresult = df', dependencies:'pandas', memory:'2g' } }
      }
    ],
    edges: [
      { id:'e-ai-1-2', source:'node_ai_1', target:'node_ai_2', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-ai-1-3', source:'node_ai_1', target:'node_ai_3', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-ai-2-4', source:'node_ai_2', target:'node_ai_4', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-ai-3-4', source:'node_ai_3', target:'node_ai_4', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-ai-4-5', source:'node_ai_4', target:'node_ai_5', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#10b981', strokeWidth:2 } },
      { id:'e-ai-4-6', source:'node_ai_4', target:'node_ai_6', sourceHandle:'output-1', targetHandle:'input-0', animated:true, style:{ stroke:'#ef4444', strokeWidth:2 } },
    ]
  },
  {
    id: 'wf-tpl-realtime',
    name: '实时流计算管线',
    description: 'Flink实时消费Kafka数据，流式聚合处理后写入实时数仓',
    category: '实时计算',
    icon: '⚡',
    nodes: [
      {
        id: 'node_rt_1', type: 'custom', position: { x: 80, y: 180 },
        data: { type:'dataSource', label:'IoT设备数据流', icon:'🗄️', color:'#10b981', description:'Kafka 50万条/秒实时消费', handles:{inputs:0,outputs:1}, config:{ sourceType:'kafka', host:'kafka-stream.prod', port:9092, database:'', table:'', username:'', password:'', query:'topic: iot.sensor.data' } }
      },
      {
        id: 'node_rt_2', type: 'custom', position: { x: 400, y: 60 },
        data: { type:'sqlQuery', label:'流式聚合窗口', icon:'📊', color:'#3b82f6', description:'5分钟滚动窗口聚合', handles:{inputs:1,outputs:1}, config:{ engine:'flink-sql', sql:'SELECT\n  device_id,\n  TUMBLE_START(event_time, INTERVAL \'5\' MINUTE) AS win_start,\n  AVG(temperature) AS avg_temp,\n  MAX(pressure) AS max_pressure,\n  COUNT(*) AS reading_count\nFROM sensor_readings\nGROUP BY device_id, TUMBLE(event_time, INTERVAL \'5\' MINUTE)', timeout:60, partitions:16 } }
      },
      {
        id: 'node_rt_3', type: 'custom', position: { x: 400, y: 280 },
        data: { type:'filter', label:'异常检测过滤', icon:'🔍', color:'#f97316', description:'筛选温度异常的记录', handles:{inputs:1,outputs:1}, config:{ filterType:'expression', expression:"avg_temp > threshold OR max_pressure > 1000", logic:'or' } }
      },
      {
        id: 'node_rt_4', type: 'custom', position: { x: 400, y: 420 },
        data: { type:'condition', label:'告警分流', icon:'🔀', color:'#a855f7', description:'根据严重程度分流', handles:{inputs:1,outputs:2}, outputLabels:['严重告警','普通通知'], config:{ conditionType:'expression', expression:'avg_temp > 80', column:'', operator:'', value:'' } }
      },
      {
        id: 'node_rt_5', type: 'custom', position: { x: 720, y: 100 },
        data: { type:'output', label:'写入ClickHouse', icon:'📤', color:'#ef4444', description:'实时OLAP数仓存储', handles:{inputs:1,outputs:0}, config:{ outputType:'database', target:'clickhouse://rt.warehouse', format:'parquet', mode:'append', partitionBy:'dt,win_start' } }
      },
      {
        id: 'node_rt_6', type: 'custom', position: { x: 720, y: 320 },
        data: { type:'pythonScript', label:'告警推送', icon:'🐍', color:'#f59e0b', description:'钉钉/企微/短信多渠道告警', handles:{inputs:1,outputs:1}, config:{ runtime:'python3.10', code:'import requests\n\n# 推送严重告警到钉钉和短信\ndingtalk_url = "https://oapi.dingtalk.com/robot/send"\nsms_url = "https://sms.api.company.com/send"\n\nfor _, row in df.iterrows():\n    msg = f"[严重] 设备{row.device_id} 温度异常: {row.avg_temp}°C"\n    requests.post(dingtalk_url, json={"msgtype":"text","text":{"content":msg}})', dependencies:'requests', memory:'1g' } }
      },
      {
        id: 'node_rt_7', type: 'custom', position: { x: 720, y: 460 },
        data: { type:'output', label:'通知记录', icon:'📤', color:'#ef4444', description:'普通通知归档', handles:{inputs:1,outputs:0}, config:{ outputType:'database', target:'mysql://ops.notifications', format:'json', mode:'append', partitionBy:'' } }
      }
    ],
    edges: [
      { id:'e-rt-1-2', source:'node_rt_1', target:'node_rt_2', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-rt-1-3', source:'node_rt_1', target:'node_rt_3', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-rt-3-4', source:'node_rt_3', target:'node_rt_4', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-rt-2-5', source:'node_rt_2', target:'node_rt_5', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-rt-4-6', source:'node_rt_4', target:'node_rt_6', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#ef4444', strokeWidth:2 } },
      { id:'e-rt-4-7', source:'node_rt_4', target:'node_rt_7', sourceHandle:'output-1', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
    ]
  },
  {
    id: 'wf-tpl-ml-train',
    name: '机器学习训练流程',
    description: '数据预处理→特征工程→模型训练→评估→部署的完整ML Pipeline',
    category: 'AI/ML',
    icon: '🧪',
    nodes: [
      {
        id: 'node_ml_1', type: 'custom', position: { x: 80, y: 180 },
        data: { type:'dataSource', label:'训练数据集', icon:'🗄️', color:'#10b981', description:'HDFS海量特征数据', handles:{inputs:0,outputs:1}, config:{ sourceType:'hdfs', host:'hdfs://datalake', port:8020, database:'', table:'', username:'', password:'', query:'/data/training/features/v3/*.parquet' } }
      },
      {
        id: 'node_ml_2', type: 'custom', position: { x: 380, y: 60 },
        data: { type:'pythonScript', label:'数据预处理', icon:'🐍', color:'#f59e0b', description:'缺失值填充+归一化', handles:{inputs:1,outputs:1}, config:{ runtime:'python3.10', code:'from sklearn.preprocessing import StandardScaler\nfrom sklearn.impute import SimpleImputer\nimport pandas as pd\n\nimputer = SimpleImputer(strategy="median")\nscaler = StandardScaler()\n\ndf = input_data.copy()\nnumeric_cols = df.select_dtypes(include=["number"]).columns\ndf[numeric_cols] = imputer.fit_transform(df[numeric_cols])\ndf[numeric_cols] = scaler.fit_transform(df[numeric_cols])\n\nresult = df', dependencies:'pandas,scikit-learn', memory:'8g' } }
      },
      {
        id: 'node_ml_3', type: 'custom', position: { x: 380, y: 260 },
        data: { type:'transform', label:'特征工程', icon:'🔄', color:'#06b6d4', description:'特征交叉+降维', handles:{inputs:1,outputs:1}, config:{ transformType:'map', expression:'# PCA降维 + 特征交叉\nfrom sklearn.decomposition import PCA\npca = PCA(n_components=50)\nfeatures = pca.fit_transform(df)', columns:'', outputFormat:'dataframe' } }
      },
      {
        id: 'node_ml_4', type: 'custom', position: { x: 680, y: 120 },
        data: { type:'pythonScript', label:'XGBoost训练', icon:'🐍', color:'#f59e0b', description:'分布式梯度提升训练', handles:{inputs:1,outputs:1}, config:{ runtime:'python3.10', code:'import xgboost as xgb\nfrom sklearn.model_selection import train_test_split\n\nX = df.drop("label", axis=1)\ny = df["label"]\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)\n\nmodel = xgb.XGBClassifier(\n    n_estimators=200,\n    max_depth=8,\n    learning_rate=0.05,\n    subsample=0.8\n)\nmodel.fit(X_train, y_train)\naccuracy = model.score(X_test, y_test)\n\nresult = {"model": model, "accuracy": accuracy, "features": list(X.columns)}', dependencies:'pandas,xgboost,scikit-learn', memory:'16g' } }
      },
      {
        id: 'node_ml_5', type: 'custom', position: { x: 680, y: 320 },
        data: { type:'condition', label:'模型评估', icon:'🔀', color:'#a855f7', description:'准确率达标则部署', handles:{inputs:1,outputs:2}, outputLabels:['达标上线','回炉优化'], config:{ conditionType:'expression', expression:'accuracy >= 0.85', column:'', operator:'', value:'' } }
      },
      {
        id: 'node_ml_6', type: 'custom', position: { x: 980, y: 80 },
        data: { type:'output', label:'模型仓库', icon:'📤', color:'#ef4444', description:'MLflow模型注册', handles:{inputs:1,outputs:0}, config:{ outputType:'api', target:'https://mlflow.company.com/api/models', format:'json', mode:'overwrite', partitionBy:'' } }
      },
      {
        id: 'node_ml_7', type: 'custom', position: { x: 980, y: 300 },
        data: { type:'agent', label:'超参优化Agent', icon:'🧠', color:'#ec4899', description:'自动搜索最优参数', handles:{inputs:1,outputs:1}, config:{ agentType:'plan-and-execute', model:'gpt-4', systemPrompt:'你是ML优化专家，分析模型不足后调整训练参数', tools:['retrain','evaluate','log_params'], maxIterations:5, earlyStop:true } }
      }
    ],
    edges: [
      { id:'e-ml-1-2', source:'node_ml_1', target:'node_ml_2', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-ml-2-3', source:'node_ml_2', target:'node_ml_3', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-ml-3-4', source:'node_ml_3', target:'node_ml_4', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-ml-4-5', source:'node_ml_4', target:'node_ml_5', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#6366f1', strokeWidth:2 } },
      { id:'e-ml-5-6', source:'node_ml_5', target:'node_ml_6', sourceHandle:'output-0', targetHandle:'input-0', animated:true, style:{ stroke:'#10b981', strokeWidth:2 } },
      { id:'e-ml-5-7', source:'node_ml_5', target:'node_ml_7', sourceHandle:'output-1', targetHandle:'input-0', animated:true, style:{ stroke:'#f59e0b', strokeWidth:2 } },
    ]
  }
]

export function getTemplateById(id) {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id) || null
}
