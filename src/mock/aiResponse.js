/**
 * Mock AI 回复数据生成器
 *
 * 每个场景都覆盖全部 6 种渲染能力：
 *   1. thinking  — 深度思考折叠块
 *   2. text      — Markdown（标题/列表/表格/引用/行内公式/行内代码）
 *   3. code      — 代码块（highlight.js 语法高亮）
 *   4. formula   — 块级 KaTeX 公式
 *   5. mermaid   — Mermaid 图表（流程图/时序图等）
 *   6. mindmap   — 思维导图（markmap 增量渲染）
 */

import { generateId, wrapMockResponse } from './streamSimulator.js'

// ===== 工具函数 =====

function bid() { return generateId('block_') }

function thinking(blockId, ...deltas) {
  const events = [{ type: 'thinking_start', data: { blockId } }]
  for (const d of deltas) {
    events.push({ type: 'thinking_delta', data: { blockId: null, delta: d } })
  }
  events.push({ type: 'thinking_end', data: { blockId: null } })
  return events
}

function text(blockIdForFirst, content) {
  return [{
    type: 'text_delta',
    data: { blockId: blockIdForFirst || null, delta: content }
  }]
}

function code(language, ...deltas) {
  const events = [
    { type: 'code_block_start', data: { blockId: bid(), language } }
  ]
  for (const d of deltas) {
    events.push({ type: 'code_delta', data: { blockId: null, delta: d } })
  }
  events.push({ type: 'code_block_end', data: { blockId: null } })
  return events
}

function formula(...deltas) {
  const events = [
    { type: 'formula_start', data: { blockId: bid() } }
  ]
  for (const d of deltas) {
    events.push({ type: 'formula_delta', data: { blockId: null, delta: d } })
  }
  events.push({ type: 'formula_end', data: { blockId: null } })
  return events
}

function mermaid(code) {
  return [
    { type: 'mermaid_start', data: { blockId: bid() } },
    { type: 'mermaid_delta', data: { blockId: null, delta: code } },
    { type: 'mermaid_end', data: { blockId: null } }
  ]
}

function mindmap(rootTitle, items) {
  const events = [
    { type: 'mindmap_start', data: { blockId: bid(), rootTitle } }
  ]
  for (const item of items) {
    // 兼容：如果 item 是字符串（markdown），直接流式发送；如果是对象（JSON 节点），转 markdown
    const delta = typeof item === 'string' ? item : nodeTreeToMd(item)
    events.push({ type: 'mindmap_delta', data: { blockId: null, delta } })
  }
  events.push({ type: 'mindmap_end', data: { blockId: null } })
  return events
}

// JSON 节点树 → markdown 标题（用 # 层级）
function nodeTreeToMd(node, depth = 2) {
  if (!node?.content) return ''
  const prefix = '#'.repeat(Math.min(depth, 6))
  let md = `${prefix} ${node.content}\n`
  for (const c of (node.children || [])) md += nodeTreeToMd(c, depth + 1)
  return md
}

function done(model, tokens, duration) {
  return [{
    type: 'message_done',
    data: {
      meta: {
        model,
        usage: { prompt_tokens: Math.round(tokens * 0.1), completion_tokens: tokens, total_tokens: Math.round(tokens * 1.1) },
        duration
      }
    }
  }]
}

function build(model, tokens, duration, ...eventGroups) {
  const events = eventGroups.flat()
  return wrapMockResponse(events, { model, usage: { prompt_tokens: Math.round(tokens * 0.1), completion_tokens: tokens, total_tokens: Math.round(tokens * 1.1) } })
}

// ================================================================
//  场景1：数据仓库分层架构
// ================================================================
export function scenarioDataWarehouse() {
  return build('deepseek-chat', 920, 4.8,
    // —— 思考 ——
    thinking(bid(),
      '用户询问数据仓库分层架构。这是经典的数据工程问题，核心是 ODS→DWD→DWS→ADS 四层模型。',
      '我准备包含：SQL 代码示例、数据量估算公式、Mermaid 数据流转图、以及知识体系思维导图，全面展示每层的作用。'
    ),
    // —— 正文 Markdown ——
    text(bid(),
      '数据仓库分层是数据工程中最核心的方法论之一，通过将数据处理过程划分为不同层次，实现**数据的标准化、可维护性和可复用性**。\n\n' +
      '## 📊 经典四层架构\n\n' +
      '### 1. ODS（Operational Data Store）操作数据层\n\n' +
      'ODS 层是数据仓库的**原始数据缓冲区**，直接对接业务系统，保持数据原貌：\n\n' +
      '- 📥 从业务数据库（MySQL、Oracle）同步原始数据\n' +
      '- 🔄 保持与源系统 **1:1 的数据结构**\n' +
      '- ⏱️ 采用 T+1 或实时同步策略\n' +
      '- 📝 记录数据接入时间戳和来源标识\n\n' +
      '### 2. DWD（Data Warehouse Detail）明细数据层\n\n' +
      'DWD 层对 ODS 数据进行**清洗、标准化和维度建模**：\n\n' +
      '- 🧹 数据清洗：去重、空值处理、异常值过滤\n' +
      '- 📐 维度建模：星型模型 / 雪花模型\n' +
      '- 🏷️ 标准化：统一编码、统一命名规范\n\n' +
      '### 3. DWS（Data Warehouse Service）服务数据层\n\n' +
      'DWS 层进行**轻度汇总和宽表构建**，面向主题域组织数据：\n\n' +
      '- 📊 按天/周/月粒度汇总\n' +
      '- 🔗 跨主题域宽表关联\n' +
      '- 🎯 面向业务过程的指标计算\n\n' +
      '### 4. ADS（Application Data Service）应用数据层\n\n' +
      'ADS 层是**最终交付层**，直接对接报表、大屏、数据产品：\n\n' +
      '- 📈 固化报表指标\n' +
      '- 🖥️ 大屏可视化数据接口\n' +
      '- 🤖 机器学习特征工程输入\n\n'
    ),
    // —— 代码块 (SQL) ——
    text(null, '## 💻 ETL 代码示例\n\n从 ODS 清洗到 DWD 的典型 SQL 实现，使用 `LEFT JOIN` 关联维度表：\n\n'),
    ...code('sql',
      '-- DWD 层订单明细表 ETL\nINSERT OVERWRITE TABLE dwd_order_detail\nPARTITION (dt = \'${yesterday}\')\nSELECT\n  o.order_id,\n  o.user_id,\n  o.product_id,\n  o.order_amount,\n  o.order_status,\n  o.create_time,\n  u.user_name,\n  u.city,\n  p.product_name,\n  p.category_id',
      '\nFROM ods_order_info o\nLEFT JOIN dim_user u ON o.user_id = u.user_id\nLEFT JOIN dim_product p ON o.product_id = p.product_id\nWHERE o.dt = \'${yesterday}\'\n  AND o.order_status != \'CANCELLED\'\n  AND o.order_amount > 0',
      ';\n\n-- 数据质量检查\nSELECT\n  COUNT(*) AS total_records,\n  COUNT(DISTINCT order_id) AS unique_orders,\n  SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) AS null_users,\n  SUM(CASE WHEN order_amount < 0 THEN 1 ELSE 0 END) AS negative_amount\nFROM dwd_order_detail\nWHERE dt = \'${yesterday}\';'
    ),
    // —— 块级公式 ——
    text(null, '\n## 📐 数据量估算\n\n从 ODS 到 ADS，数据量经历"膨胀-收缩-再收缩"的过程。ODS 总量公式：\n\n'),
    ...formula('\\text{ODS}_{volume} \\approx \\sum_{i=1}^{n} \\text{SourceTable}_i \\times (1 + \\text{growth\\_rate})^{\\text{days}}'),
    text(null, '\n\nDWD 层约为 ODS 的 **80%-95%**（清洗去重），DWS 层约 **10%-30%**（聚合压缩），ADS 层仅 **1%-5%**（固化指标）。\n\n总体压缩比：\n\n'),
    ...formula('\\text{CompressionRatio} = \\frac{\\text{ADS}_{rows}}{\\text{ODS}_{rows}} \\approx \\prod_{i=1}^{k} \\frac{1}{f_i}'),
    // —— 性能对比表格 ——
    text(null, '\n\n### 各层数据量级对比\n\n' +
      '| 层级 | 数据量级 | 更新频率 | 查询延迟 | 存储引擎 |\n' +
      '|------|---------|---------|---------|----------|\n' +
      '| ODS | TB 级 | 实时/T+1 | — | HDFS/Hive |\n' +
      '| DWD | 百 GB 级 | T+1 | 分钟级 | Hive/Iceberg |\n' +
      '| DWS | 十 GB 级 | T+1 | 秒级 | ClickHouse/Doris |\n' +
      '| ADS | GB 级 | 小时级 | 毫秒级 | MySQL/Redis |\n\n'
    ),
    // —— Mermaid 流程图 ——
    text(null, '## 🔄 数据流转全景图\n\n'),
    ...mermaid(
      'graph LR\n' +
      '  A[业务数据库] -->|CDC/Sqoop| B[ODS 操作数据层]\n' +
      '  B -->|清洗/标准化| C[DWD 明细数据层]\n' +
      '  C -->|汇总/关联| D[DWS 服务数据层]\n' +
      '  D -->|指标计算| E[ADS 应用数据层]\n' +
      '  E -->|API/导出| F[报表系统]\n' +
      '  E -->|API/导出| G[大屏展示]\n' +
      '  E -->|API/导出| H[数据产品]\n' +
      '  C -.->|特征工程| I[ML 训练平台]\n' +
      '  style A fill:#e1f5fe\n' +
      '  style B fill:#fff3e0\n' +
      '  style C fill:#f3e5f5\n' +
      '  style D fill:#e8f5e9\n' +
      '  style E fill:#fce4ec\n' +
      '  style I fill:#fff8e1'
    ),
    // —— 思维导图 ——
    text(null, '\n## 🧠 知识体系思维导图\n\n'),
    ...mindmap('数据仓库知识体系', [
      {
        content: '数据分层',
        children: [
          { content: 'ODS 操作数据层' },
          { content: 'DWD 明细数据层' },
          { content: 'DWS 服务数据层' },
          { content: 'ADS 应用数据层' }
        ]
      },
      {
        content: '建模方法论',
        children: [
          { content: '星型模型' },
          { content: '雪花模型' },
          { content: 'Data Vault' },
          { content: 'Anchor Model' }
        ]
      },
      {
        content: 'ETL 工具',
        children: [
          { content: 'Apache Spark' },
          { content: 'Apache Flink' },
          { content: 'DataX' },
          { content: 'Kettle' }
        ]
      },
      {
        content: '数据质量',
        children: [
          { content: '完整性检查' },
          { content: '一致性校验' },
          { content: '及时性监控' },
          { content: '准确性评估' }
        ]
      },
      {
        content: '存储引擎',
        children: [
          { content: 'Hive' },
          { content: 'ClickHouse' },
          { content: 'Doris' },
          { content: 'Iceberg' }
        ]
      }
    ]),
    // —— 总结 ——
    text(null,
      '\n## 💡 总结\n\n' +
      '数据仓库分层的核心价值在于**分而治之**：\n\n' +
      '1. ✅ **解耦**：上游变更不影响下游\n' +
      '2. ✅ **复用**：中间层被多个应用共享\n' +
      '3. ✅ **质量**：逐层清洗保证数据质量\n' +
      '4. ✅ **效率**：预计算指标加速查询\n\n' +
      '> 记住：好的分层设计 = 合理的抽象粒度 + 清晰的数据流向 + 完善的质量监控 🎯'
    ),
    ...done('deepseek-chat', 920, 4.8)
  )
}

// ================================================================
//  场景2：快速排序（Python 代码）
// ================================================================
export function scenarioCodeQuestion() {
  return build('deepseek-chat', 680, 3.2,
    // —— 思考 ——
    thinking(bid(),
      '用户想用 Python 实现快速排序。这是经典的排序算法，核心是分治 + 分区操作。',
      '我准备给出完整实现代码、Mermaid 递归流程图、时间复杂度公式推导、以及排序算法对比思维导图。'
    ),
    // —— 正文 ——
    text(bid(),
      '## 🎯 快速排序（Quick Sort）\n\n' +
      '快速排序是一种基于**分治思想**的高效排序算法，由 Tony Hoare 于 1960 年提出。其核心思想非常优雅：\n\n' +
      '1. 选择一个**基准元素**（pivot）\n' +
      '2. 将数组分为两部分：小于 pivot 的放左边，大于 pivot 的放右边\n' +
      '3. **递归**地对左右两部分重复上述过程\n\n' +
      '> 💡 快排的精妙之处在于：一次分区操作后，pivot 的最终位置就已经确定，不会再变化。\n\n' +
      '### 复杂度分析\n\n' +
      '快排的性能依赖于 pivot 的选择。每次恰好选到中位数时性能最优——这需要一些概率分析。\n\n'
    ),
    // —— 块级公式 ——
    ...formula('T(n) = \\frac{1}{n} \\sum_{k=0}^{n-1} \\left[ T(k) + T(n-k-1) \\right] + O(n)'),
    text(null, '\n\n通过求解递归方程可证：平均情况下 $T(n) = O(n \\log n)$。最坏情况（每次 pivot 恰好是最大/最小值）退化为 $O(n^2)$。\n\n' +
      '### Python 实现\n\n使用 `Lomuto` 分区方案的实现如下——`partition` 函数将小于 pivot 的元素交换到左侧：\n\n'
    ),
    // —— 代码块 (Python) ——
    ...code('python',
      'def quick_sort(arr, low=0, high=None):\n' +
      '    """快速排序 - 原地排序\n' +
      '    时间复杂度: O(n log n) 平均\n' +
      '    空间复杂度: O(log n) 递归栈\n' +
      '    """\n' +
      '    if high is None:\n' +
      '        high = len(arr) - 1\n' +
      '    if low < high:\n' +
      '        pivot_idx = partition(arr, low, high)\n' +
      '        quick_sort(arr, low, pivot_idx - 1)\n' +
      '        quick_sort(arr, pivot_idx + 1, high)\n' +
      '    return arr\n\n' +
      'def partition(arr, low, high):\n' +
      '    """Lomuto 分区：选最后一个元素为 pivot"""\n' +
      '    pivot = arr[high]\n' +
      '    i = low - 1  # 小于 pivot 区域的边界\n' +
      '    for j in range(low, high):\n' +
      '        if arr[j] <= pivot:\n' +
      '            i += 1\n' +
      '            arr[i], arr[j] = arr[j], arr[i]\n' +
      '    arr[i + 1], arr[high] = arr[high], arr[i + 1]\n' +
      '    return i + 1\n\n' +
      '# 测试\n' +
      'if __name__ == \'__main__\':\n' +
      '    data = [3, 6, 8, 10, 1, 2, 1]\n' +
      '    quick_sort(data)\n' +
      '    print(data)  # [1, 1, 2, 3, 6, 8, 10]'
    ),
    // —— 性能表格 ——
    text(null,
      '\n## 📊 排序算法对比\n\n' +
      '| 排序算法 | 平均时间 | 最坏时间 | 空间 | 稳定性 |\n' +
      '|---------|---------|---------|------|------|\n' +
      '| 快速排序 | $O(n \\log n)$ | $O(n^2)$ | $O(\\log n)$ | ❌ |\n' +
      '| 归并排序 | $O(n \\log n)$ | $O(n \\log n)$ | $O(n)$ | ✅ |\n' +
      '| 堆排序 | $O(n \\log n)$ | $O(n \\log n)$ | $O(1)$ | ❌ |\n' +
      '| 插入排序 | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ✅ |\n' +
      '| 计数排序 | $O(n+k)$ | $O(n+k)$ | $O(k)$ | ✅ |\n\n'
    ),
    // —— Mermaid 流程图（递归过程） ——
    text(null, '## 🔄 递归分区流程图\n\n'),
    ...mermaid(
      'graph TD\n' +
      '  A[输入数组] --> B{len > 1?}\n' +
      '  B -->|是| C[选择 pivot 基准]\n' +
      '  C --> D[分区 partition]\n' +
      '  D --> E[左子数组 < pivot]\n' +
      '  D --> F[右子数组 > pivot]\n' +
      '  E --> G[递归排序左半]\n' +
      '  F --> H[递归排序右半]\n' +
      '  G --> I[合并结果]\n' +
      '  H --> I\n' +
      '  B -->|否| J[返回数组]\n' +
      '  I --> J\n' +
      '  style C fill:#fce4ec\n' +
      '  style D fill:#fff3e0\n' +
      '  style J fill:#e8f5e9'
    ),
    // —— 思维导图 ——
    text(null, '\n## 🧠 排序算法知识体系\n\n'),
    ...mindmap('排序算法分类', [
      {
        content: '比较排序',
        children: [
          { content: '快速排序 O(n log n)' },
          { content: '归并排序 O(n log n)' },
          { content: '堆排序 O(n log n)' },
          { content: '插入排序 O(n²)' }
        ]
      },
      {
        content: '非比较排序',
        children: [
          { content: '计数排序 O(n+k)' },
          { content: '基数排序 O(d·n)' },
          { content: '桶排序 O(n+k)' }
        ]
      },
      {
        content: '优化技巧',
        children: [
          { content: '三数取中选 pivot' },
          { content: '小数组切换插入排序' },
          { content: '尾递归优化' },
          { content: 'IntroSort 混合策略' }
        ]
      }
    ]),
    text(null,
      '\n## 💡 工程实践建议\n\n' +
      '1. 实际工程中，Python 内置的 `list.sort()` 使用 **Timsort**（归并+插入混合），比纯快排更稳定\n' +
      '2. C++ 的 `std::sort` 使用 **Introsort**（快排+堆排混合），避免最坏情况\n' +
      '3. 快排的 `partition` 也可以改用 **Hoare 方案**（双边扫描），常数更优\n\n' +
      '> 🎯 面试要点：能说清楚 pivot 选择策略和分区过程，就掌握了快排的 80%。'
    ),
    ...done('deepseek-chat', 680, 3.2)
  )
}

// ================================================================
//  场景3：高斯积分推导
// ================================================================
export function scenarioMathQuestion() {
  return build('deepseek-reasoner', 560, 6.5,
    // —— 思考 ——
    thinking(bid(),
      '用户想推导高斯积分 ∫e^{-x²}dx = √π。这是概率论中最著名的积分，需要用到极坐标变换技巧。',
      '这个推导的巧妙之处在于：通过计算 I² 将一维积分转为二维，然后在极坐标下积分。我还会补充正态分布、Python 数值验证代码、以及概率分布思维导图。'
    ),
    // —— 正文 ——
    text(bid(),
      '## 🔢 高斯积分\n\n' +
      '高斯积分（Gaussian Integral）是概率论和统计学中最重要的积分之一，以数学家高斯命名。它的结果简洁优美：\n\n'
    ),
    ...formula('I = \\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}'),
    text(null,
      '\n\n### 推导步骤\n\n' +
      '**第一步 — 计算 $I^2$**：将一维积分扩展到二维平面——\n\n'
    ),
    ...formula('I^2 = \\left( \\int_{-\\infty}^{\\infty} e^{-x^2} dx \\right) \\left( \\int_{-\\infty}^{\\infty} e^{-y^2} dy \\right) = \\iint_{\\mathbb{R}^2} e^{-(x^2 + y^2)} \\, dx \\, dy'),
    text(null,
      '\n\n**第二步 — 极坐标变换**：令 $x = r\\cos\\theta$, $y = r\\sin\\theta$，雅可比行列式 $|J| = r$，于是 $dx\\,dy = r\\,dr\\,d\\theta$：\n\n'
    ),
    ...formula('I^2 = \\int_{0}^{2\\pi} \\int_{0}^{\\infty} e^{-r^2} \\cdot r \\, dr \\, d\\theta'),
    text(null,
      '\n\n**第三步 — 换元积分**：令 $u = r^2$，则 $du = 2r\\,dr$，内层积分变为：\n\n'
    ),
    ...formula('\\int_{0}^{\\infty} e^{-r^2} \\cdot r \\, dr = \\int_{0}^{\\infty} e^{-u} \\cdot \\frac{1}{2} \\, du = \\frac{1}{2}'),
    text(null,
      '\n\n**最终结果**：\n\n'
    ),
    ...formula('I^2 = \\int_{0}^{2\\pi} \\frac{1}{2} \\, d\\theta = \\pi \\quad \\Rightarrow \\quad I = \\sqrt{\\pi}'),
    text(null,
      '\n\n### 🌍 应用场景\n\n' +
      '- 📊 **正态分布**：概率密度 $f(x) = \\frac{1}{\\sqrt{2\\pi}\\sigma} e^{-(x-\\mu)^2/(2\\sigma^2)}$，归一化直接依赖高斯积分\n' +
      '- 🔬 **量子力学**：谐振子基态波函数 $\\psi_0(x) \\propto e^{-x^2/2}$ 的归一化\n' +
      '- 🎲 **布朗运动**：扩散方程基本解 $p(x,t) = \\frac{1}{\\sqrt{4\\pi Dt}} e^{-x^2/(4Dt)}$\n\n'
    ),
    // —— 代码块 (Python 数值验证) ——
    text(null, '### 🐍 Python 数值验证\n\n用 SciPy 和 Monte Carlo 方法验证：\n\n'),
    ...code('python',
      'import numpy as np\nfrom scipy.integrate import quad\n\n# 方法1：数值积分\nresult, error = quad(lambda x: np.exp(-x**2), -np.inf, np.inf)\nprint(f"数值积分: {result:.6f}  (误差: {error:.2e})")\nprint(f"√π:        {np.sqrt(np.pi):.6f}")\n\n# 方法2：Monte Carlo 验证（极坐标）\nn = 1_000_000\nr = np.sqrt(-2 * np.log(np.random.random(n)))\n# I² = ∫₀²ᵖ∫₀^∞ e^{-r²} r dr dθ\n# 采样得到的 r 分布应满足 e^{-r²}\nestimate = np.mean(np.exp(-r**2/2)) * 2 * np.pi\nprint(f"MC 估计 I²: {estimate:.4f}")\nprint(f"实际 π:      {np.pi:.4f}")'
    ),
    // —— 表格 ——
    text(null,
      '\n\n### 📊 常见概率分布归一化常数\n\n' +
      '| 分布 | 密度函数 | 归一化依赖 |\n' +
      '|------|---------|----------|\n' +
      '| 正态分布 | $\\frac{1}{\\sqrt{2\\pi}\\sigma} e^{-x^2/(2\\sigma^2)}$ | $\\int e^{-x^2}dx = \\sqrt{\\pi}$ |\n' +
      '| Gamma 分布 | $\\frac{\\beta^\\alpha}{\\Gamma(\\alpha)} x^{\\alpha-1}e^{-\\beta x}$ | $\\Gamma$ 函数 |\n' +
      '| Beta 分布 | $\\frac{1}{B(a,b)} x^{a-1}(1-x)^{b-1}$ | $B$ 函数 |\n' +
      '| Cauchy 分布 | $\\frac{1}{\\pi} \\frac{\\gamma}{(x-x_0)^2+\\gamma^2}$ | $\\int \\frac{dx}{1+x^2} = \\pi$ |\n\n'
    ),
    // —— Mermaid ——
    text(null, '### 🔄 极坐标变换示意图\n\n'),
    ...mermaid(
      'graph LR\n' +
      '  A[一维高斯积分 I] -->|平方| B[二维积分 I²]\n' +
      '  B -->|极坐标变换| C["I² = ∫∫ e^{-(x²+y²)} dxdy"]\n' +
      '  C -->|换元 u=r²| D["I² = ∫₀²ᵖ (1/2) dθ"]\n' +
      '  D -->|积分| E[I² = π]\n' +
      '  E -->|开方| F["I = √π"]\n' +
      '  style A fill:#e3f2fd\n' +
      '  style C fill:#fff3e0\n' +
      '  style F fill:#e8f5e9'
    ),
    // —— 思维导图 ——
    text(null, '\n### 🧠 概率积分知识体系\n\n'),
    ...mindmap('特殊积分体系', [
      {
        content: '高斯积分族',
        children: [
          { content: '∫e^{-x²}dx = √π' },
          { content: '∫x²e^{-x²}dx = √π/2' },
          { content: '∫e^{-ax²}dx = √(π/a)' }
        ]
      },
      {
        content: 'Gamma 函数',
        children: [
          { content: 'Γ(n) = (n-1)!' },
          { content: 'Γ(1/2) = √π' },
          { content: 'Beta 函数 B(a,b)' }
        ]
      },
      {
        content: '应用领域',
        children: [
          { content: '正态分布归一化' },
          { content: '量子谐振子' },
          { content: '路径积分' },
          { content: '扩散方程' }
        ]
      }
    ]),
    text(null,
      '\n\n> 🎓 这个极坐标变换技巧体现了数学中**从不同维度看同一问题**的威力——升维后反而更简单，这是反常积分中的经典手法。'
    ),
    ...done('deepseek-reasoner', 560, 6.5)
  )
}

// ================================================================
//  场景4：敏捷开发流程（Mermaid 图表）
// ================================================================
export function scenarioDiagramQuestion() {
  return build('deepseek-chat', 720, 3.8,
    // —— 思考 ——
    thinking(bid(),
      '用户想了解敏捷开发流程。Scrum 是应用最广的敏捷框架，核心角色包括 Product Owner、Scrum Master 和开发团队。',
      '我准备用 Mermaid 时序图展示角色协作、甘特图展示 Sprint 计划、流程图展示 CI/CD 流水线。还会补充敏捷估算公式和思维导图。'
    ),
    // —— 正文 ——
    text(bid(),
      '## 🔄 敏捷 Scrum 开发流程\n\n' +
      '现代软件开发普遍采用**敏捷 Scrum** 方法论。核心角色包括 `Product Owner`（定义需求）、`Scrum Master`（推动流程）和 `开发团队`（交付增量）。\n\n' +
      '### 协作时序图\n\n下面用 Mermaid 时序图展示一次完整 Sprint 中各角色的交互：\n\n'
    ),
    // —— Mermaid 时序图 ——
    ...mermaid(
      'sequenceDiagram\n' +
      '  participant PO as 产品负责人\n' +
      '  participant SM as Scrum Master\n' +
      '  participant Team as 开发团队\n' +
      '  participant QA as 测试团队\n' +
      '  participant Ops as 运维团队\n\n' +
      '  PO->>SM: 创建 Product Backlog\n' +
      '  SM->>Team: Sprint Planning 会议\n' +
      '  Team->>Team: 拆解 User Stories\n' +
      '  Team->>Team: 每日站会 Daily Scrum\n' +
      '  Team->>QA: 提交 Sprint 增量\n' +
      '  QA->>QA: 自动化测试 + 手动测试\n' +
      '  QA-->>Team: Bug Report\n' +
      '  Team->>QA: 修复确认\n' +
      '  QA->>Ops: 发布到预发布环境\n' +
      '  Ops->>Ops: 灰度发布\n' +
      '  Ops->>PO: Sprint 交付确认\n' +
      '  SM->>Team: Sprint Retrospective'
    ),
    // —— Mermaid 甘特图 ——
    text(null, '\n### 📅 Sprint 甘特图\n\n一个典型的两周 Sprint 迭代计划：\n\n'),
    ...mermaid(
      'gantt\n' +
      '  title Sprint #12 迭代计划\n' +
      '  dateFormat YYYY-MM-DD\n' +
      '  axisFormat %m/%d\n\n' +
      '  section 需求分析\n' +
      '  PRD 评审        :done, req1, 2025-01-06, 2d\n' +
      '  技术方案设计     :active, req2, after req1, 2d\n\n' +
      '  section 开发\n' +
      '  Feature A 开发   :dev1, after req2, 3d\n' +
      '  Feature B 开发   :dev2, after req2, 4d\n' +
      '  API 接口开发     :dev3, after req2, 2d\n\n' +
      '  section 测试\n' +
      '  单元测试         :test1, after dev1, 2d\n' +
      '  集成测试         :test2, after dev2, 2d\n' +
      '  QA 回归测试      :test3, after test2, 2d\n\n' +
      '  section 发布\n' +
      '  预发布环境部署    :deploy1, after test3, 1d\n' +
      '  生产环境灰度发布  :deploy2, after deploy1, 1d'
    ),
    // —— 正文 ——
    text(null,
      '\n## 🏗️ CI/CD 流水线\n\n' +
      '持续集成/持续交付是现代 DevOps 的核心实践。一个完整的流水线从 `git push` 触发：\n\n'
    ),
    // —— Mermaid 流程图 ——
    ...mermaid(
      'graph TB\n' +
      '  A[Git Push] --> B{代码检查}\n' +
      '  B -->|ESLint| C[静态分析]\n' +
      '  B -->|Prettier| C\n' +
      '  C --> D[单元测试]\n' +
      '  D -->|通过| E[Docker Build]\n' +
      '  D -->|失败| Z[🔔 通知开发者]\n' +
      '  E --> F[推送镜像仓库]\n' +
      '  F --> G[部署 Staging]\n' +
      '  G --> H[E2E 测试]\n' +
      '  H -->|通过| I[部署 Production]\n' +
      '  H -->|失败| Z\n' +
      '  I --> J[健康检查]\n' +
      '  J -->|异常| K[自动回滚]\n' +
      '  style A fill:#e3f2fd\n' +
      '  style I fill:#e8f5e9\n' +
      '  style Z fill:#ffebee\n' +
      '  style K fill:#fff3e0'
    ),
    // —— 块级公式 ——
    text(null,
      '\n## 📐 团队效能公式\n\n' +
      '敏捷团队的吞吐量可以用 Little\'s Law 建模。设 $WIP$ 为进行中任务数，$CT$ 为平均完成时间：\n\n'
    ),
    ...formula('\\text{Throughput} = \\frac{WIP}{CT}'),
    text(null,
      '\n\n降低 $WIP$（限制并行任务数）能直接缩短交付周期。当 $WIP = 1$ 时，吞吐量由瓶颈决定：\n\n'
    ),
    ...formula('T_{\\max} = \\min(T_1, T_2, \\dots, T_n) \\quad \\text{其中 } T_i \\text{ 为第 } i \\text{ 阶段的处理能力}'),
    // —— 代码块 ——
    text(null, '\n\n## 💻 Sprint 燃尽图计算\n\n用 Python 计算并可视化 Sprint 进度：\n\n'),
    ...code('python',
      'import matplotlib.pyplot as plt\nimport numpy as np\n\n# Sprint 燃尽图数据\nsprint_days = 10\ntotal_story_points = 50\n\n# 理想燃尽线\nideal = np.linspace(total_story_points, 0, sprint_days + 1)\n\n# 实际剩余点数（模拟）\nactual = [50, 47, 42, 38, 33, 25, 20, 15, 8, 3, 0]\n\nplt.plot(range(sprint_days + 1), ideal, \'b--\', label=\'理想线\')\nplt.plot(range(sprint_days + 1), actual, \'r-o\', label=\'实际线\')\nplt.fill_between(range(sprint_days + 1), ideal, actual,\n                 alpha=0.2, color=\'orange\', label=\'偏差\')\nplt.xlabel(\'Sprint 天数\')\nplt.ylabel(\'剩余 Story Points\')\nplt.title(\'Sprint 燃尽图\')\nplt.legend()\nplt.grid(True, alpha=0.3)\nplt.show()'
    ),
    // —— 思维导图 ——
    text(null, '\n## 🧠 DevOps 知识体系\n\n'),
    ...mindmap('DevOps 实践体系', [
      {
        content: '敏捷框架',
        children: [
          { content: 'Scrum' },
          { content: 'Kanban' },
          { content: 'XP 极限编程' },
          { content: 'SAFe 规模化敏捷' }
        ]
      },
      {
        content: 'CI/CD 工具链',
        children: [
          { content: 'Jenkins' },
          { content: 'GitHub Actions' },
          { content: 'GitLab CI' },
          { content: 'ArgoCD' }
        ]
      },
      {
        content: '质量保障',
        children: [
          { content: '单元测试 Jest/Pytest' },
          { content: 'E2E 测试 Playwright' },
          { content: '性能测试 K6' },
          { content: '安全扫描 SonarQube' }
        ]
      },
      {
        content: '可观测性',
        children: [
          { content: '日志 ELK' },
          { content: '监控 Prometheus' },
          { content: '链路追踪 Jaeger' },
          { content: '告警 Grafana' }
        ]
      }
    ]),
    text(null,
      '\n## 💡 最佳实践\n\n' +
      '1. ✅ **小批量交付**：每个 Sprint 产出可部署的增量\n' +
      '2. ✅ **自动化优先**：能自动化的绝不手动操作\n' +
      '3. ✅ **度量驱动**：用 DORA 指标（部署频率、变更前置时间、故障恢复时间、变更失败率）评估团队效能\n' +
      '4. ✅ **持续改进**：Retro 不是走过场，每次 Sprint 至少落地一条改进项\n\n' +
      '> 🎯 敏捷的本质不是 Scrum 仪式，而是**快速反馈 + 持续改进**的工程文化。'
    ),
    ...done('deepseek-chat', 720, 3.8)
  )
}

// ================================================================
//  场景5：Kubernetes（原来是 default 场景，现在完整覆盖所有功能）
// ================================================================
export function scenarioKubernetes() {
  return build('deepseek-chat', 780, 4.2,
    // —— 思考 ——
    thinking(bid(),
      '用户问"什么是 Kubernetes"。这是云原生领域最核心的技术，需要从容器编排的视角讲清楚。',
      'K8s 的核心抽象包括 Pod、Service、Deployment、ConfigMap 等。我准备用 Mermaid 架构图展示组件关系、YAML 代码示例、资源调度公式、以及云原生思维导图。'
    ),
    // —— 正文 ——
    text(bid(),
      '## ☸️ Kubernetes 是什么？\n\n' +
      '**Kubernetes**（简称 K8s，8 代表中间省略的 8 个字母）是 Google 开源的**容器编排平台**，用于自动化部署、扩展和管理容器化应用。\n\n' +
      '> 💡 一句话概括：K8s 是容器世界的"操作系统"，它决定容器应该在哪个机器上运行、怎么联网、怎么存储数据、出故障了怎么恢复。\n\n' +
      '### 🏗️ 核心架构\n\n' +
      'K8s 集群由 **Master（控制平面）** 和 **Worker Node（数据平面）** 组成：\n\n' +
      '- **API Server**：集群统一入口，所有操作通过 REST API\n' +
      '- **etcd**：分布式 KV 存储，保存集群所有状态\n' +
      '- **Scheduler**：决定 Pod 调度到哪个 Node\n' +
      '- **Controller Manager**：维护期望状态（如副本数）\n' +
      '- **kubelet**：每个 Node 上的代理，管理容器生命周期\n' +
      '- **kube-proxy**：网络代理，实现 Service 的负载均衡\n\n'
    ),
    // —— Mermaid 架构图 ——
    ...mermaid(
      'graph TB\n' +
      '  subgraph Control Plane\n' +
      '    API[API Server]\n' +
      '    Scheduler[Scheduler]\n' +
      '    CM[Controller Manager]\n' +
      '    etcd[(etcd)]\n' +
      '  end\n' +
      '  subgraph Node-1\n' +
      '    K1[kubelet] --> P1[Pod A]\n' +
      '    K1 --> P2[Pod B]\n' +
      '    KP1[kube-proxy]\n' +
      '  end\n' +
      '  subgraph Node-2\n' +
      '    K2[kubelet] --> P3[Pod C]\n' +
      '    K2 --> P4[Pod D]\n' +
      '    KP2[kube-proxy]\n' +
      '  end\n' +
      '  API <--> etcd\n' +
      '  Scheduler --> API\n' +
      '  CM --> API\n' +
      '  K1 -.-> API\n' +
      '  K2 -.-> API\n' +
      '  style API fill:#e3f2fd\n' +
      '  style etcd fill:#fff3e0\n' +
      '  style P1 fill:#e8f5e9\n' +
      '  style P2 fill:#e8f5e9\n' +
      '  style P3 fill:#e8f5e9\n' +
      '  style P4 fill:#e8f5e9'
    ),
    // —— 代码块 (YAML) ——
    text(null, '\n### 📝 Deployment YAML 示例\n\n定义一个 3 副本的 Nginx 部署：\n\n'),
    ...code('yaml',
      'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx-deployment\n  labels:\n    app: nginx\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: nginx\n  template:\n    metadata:\n      labels:\n        app: nginx\n    spec:\n      containers:\n      - name: nginx\n        image: nginx:1.25\n        ports:\n        - containerPort: 80\n        resources:\n          requests:\n            memory: "64Mi"\n            cpu: "250m"\n          limits:\n            memory: "128Mi"\n            cpu: "500m"',
      '\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: nginx-service\nspec:\n  selector:\n    app: nginx\n  ports:\n  - port: 80\n    targetPort: 80\n  type: LoadBalancer'
    ),
    // —— 公式 ——
    text(null,
      '\n## 📐 资源调度模型\n\n' +
      'Scheduler 为每个待调度 Pod 计算节点得分，选择最优节点。资源匹配的核心约束为：\n\n'
    ),
    ...formula('\\forall \\, \\text{node}_j, \\quad \\sum_{i \\in \\text{pods}(j)} \\text{request}_i + \\text{request}_{\\text{new}} \\leq \\text{capacity}_j'),
    text(null,
      '\n\nPod 副本数的弹性伸缩（HPA）根据 CPU 利用率动态调整。设目标利用率为 $U_{\\text{target}}$：\n\n'
    ),
    ...formula('\\text{replicas}_{\\text{new}} = \\left\\lceil \\text{replicas}_{\\text{current}} \\times \\frac{\\text{CPU}_{\\text{current}}}{\\text{CPU}_{\\text{target}}} \\right\\rceil'),
    // —— 表格 ——
    text(null,
      '\n\n### 📊 K8s 核心资源对象\n\n' +
      '| 资源 | 作用 | 作用域 | 类比 |\n' +
      '|------|------|------|------|\n' +
      '| Pod | 最小调度单元 | Namespace | 进程 |\n' +
      '| Deployment | 无状态应用管理 | Namespace | 部署脚本 |\n' +
      '| StatefulSet | 有状态应用管理 | Namespace | 数据库集群管理器 |\n' +
      '| Service | 服务发现与负载均衡 | Namespace | 反向代理 |\n' +
      '| ConfigMap | 配置管理 | Namespace | 配置文件 |\n' +
      '| Ingress | 外部流量入口 | Namespace | Nginx/API 网关 |\n' +
      '| PVC | 持久化存储声明 | Namespace | 磁盘申请单 |\n\n'
    ),
    // —— 思维导图 ——
    text(null, '## 🧠 云原生技术栈\n\n'),
    ...mindmap('云原生技术栈', [
      {
        content: '容器运行时',
        children: [
          { content: 'Docker' },
          { content: 'containerd' },
          { content: 'CRI-O' },
          { content: 'Kata Containers' }
        ]
      },
      {
        content: '编排调度',
        children: [
          { content: 'Kubernetes' },
          { content: 'K3s 边缘轻量版' },
          { content: 'Nomad' }
        ]
      },
      {
        content: '服务网格',
        children: [
          { content: 'Istio' },
          { content: 'Linkerd' },
          { content: 'Consul Connect' }
        ]
      },
      {
        content: '可观测性',
        children: [
          { content: 'Prometheus 监控' },
          { content: 'Grafana 可视化' },
          { content: 'Jaeger 链路追踪' },
          { content: 'Fluentd 日志' }
        ]
      },
      {
        content: 'GitOps',
        children: [
          { content: 'ArgoCD' },
          { content: 'FluxCD' },
          { content: 'Helm Charts' }
        ]
      }
    ]),
    text(null,
      '\n## 💡 学习路径建议\n\n' +
      '1. 🟢 **入门**：理解容器 vs 虚拟机，用 `minikube` 搭本地环境\n' +
      '2. 🟡 **进阶**：掌握 YAML 声明式配置、RBAC 权限模型、Helm 包管理\n' +
      '3. 🔴 **深入**：阅读 Controller 源码、自定义 CRD + Operator、集群安全加固\n\n' +
      '> 🎯 Kubernetes 的学习曲线陡峭但回报巨大——它是云原生时代的"通用控制平面"，几乎所有现代基础设施都构建在它之上。'
    ),
    ...done('deepseek-chat', 780, 4.2)
  )
}

// ================================================================
//  默认场景 & 错误场景
// ================================================================
export function scenarioDefault() {
  return build('deepseek-chat', 320, 1.5,
    thinking(bid(),
      '用户提出了一个通用问题。作为 AI 助手，我需要介绍自己的能力范围，并用示例引导用户探索完整功能。',
      '我打算用一段 Markdown 开头，然后给一个公式示例、一个代码示例、一个 Mermaid 图和一个思维导图，让用户看到所有渲染能力。'
    ),
    text(bid(),
      '你好！我是 **AI 智能助手**，基于大语言模型构建。\n\n' +
      '## 🎯 我能做什么\n\n' +
      '我可以帮你完成以下工作，每一项都会展示我支持的全部渲染能力：\n\n' +
      '- 💬 **Markdown 渲染**：标题、列表、**粗体**、`行内代码`、表格、引用\n' +
      '- 💻 **代码高亮**：支持 `python`、`javascript`、`java`、`sql`、`yaml` 等多种语言\n' +
      '- 📐 **公式渲染**：支持行内公式 $E=mc^2$ 和块级 KaTeX 公式\n' +
      '- 📊 **图表生成**：Mermaid 流程图、时序图、甘特图\n' +
      '- 🧠 **思维导图**：markmap 增量渲染的知识图谱\n' +
      '- 💭 **深度思考**：像 DeepSeek-R1 一样展示推理过程\n\n'
    ),
    // —— 公式 ——
    text(null, '### 示例：贝叶斯定理\n\n'),
    ...formula('P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}'),
    // —— 代码 ——
    text(null, '\n### 示例：Hello World\n\n'),
    ...code('javascript',
      '// AI 助手支持的 Markdown 渲染器\n' +
      'const capabilities = [\n' +
      '  "code", "formula",\n' +
      '  "mermaid", "mindmap",\n"  "thinking"\n' +
      '];\n' +
      'console.log(`🚀 我支持: ${capabilities.join(", ")}`);'
    ),
    // —— Mermaid ——
    text(null, '\n### 示例：AI 问答流程\n\n'),
    ...mermaid(
      'graph LR\n' +
      '  A[用户提问] --> B{场景匹配}\n' +
      '  B --> C[Markdown 渲染]\n' +
      '  B --> D[代码高亮]\n' +
      '  B --> E[公式渲染]\n' +
      '  B --> F[图表生成]\n' +
      '  B --> G[思维导图]\n' +
      '  C --> H[SSE 流式输出]\n' +
      '  D --> H\n' +
      '  E --> H\n' +
      '  F --> H\n' +
      '  G --> H\n' +
      '  style A fill:#e3f2fd\n' +
      '  style H fill:#e8f5e9'
    ),
    // —— 思维导图 ——
    text(null, '\n### 示例：功能全景\n\n'),
    ...mindmap('AI 助手能力矩阵', [
      {
        content: '文本渲染',
        children: [
          { content: 'Markdown GFM' },
          { content: '表格/列表/引用' },
          { content: '行内代码' }
        ]
      },
      {
        content: '代码',
        children: [
          { content: 'highlight.js' },
          { content: '复制按钮' },
          { content: '语言标识' }
        ]
      },
      {
        content: '可视化',
        children: [
          { content: 'KaTeX 公式' },
          { content: 'Mermaid 图表' },
          { content: 'markmap 思维导图' }
        ]
      }
    ]),
    text(null,
      '\n\n> 💡 推荐试试这些输入，每个都会触发**全部渲染能力**：\n' +
      '> - "解释数据仓库分层架构"\n' +
      '> - "用 Python 实现快速排序"\n' +
      '> - "推导高斯积分公式"\n' +
      '> - "画出敏捷开发流程图"\n' +
      '> - "什么是 Kubernetes？"\n\n' +
      '输入框下方也有快捷标签，点击即可体验 🚀'
    ),
    ...done('deepseek-chat', 320, 1.5)
  )
}

export function scenarioError() {
  const events = [
    { type: 'text_delta', data: { blockId: bid(), delta: '正在处理您的请求...\n\n' } },
    { type: 'error', data: { message: '服务暂时不可用，请稍后重试。（这是一个模拟的错误响应）', code: 'SERVICE_UNAVAILABLE' } }
  ]
  return wrapMockResponse(events)
}

// ================================================================
//  场景匹配
// ================================================================
export function matchScenario(userInput) {
  const input = userInput.toLowerCase()

  if (/数据仓库|数仓|etl|分层|数据架构/.test(input)) return scenarioDataWarehouse
  if (/快速排序|排序算法|python.*排序|实现.*排序/.test(input)) return scenarioCodeQuestion
  if (/代码|编程|算法|python|java|leetcode|函数/.test(input)) return scenarioCodeQuestion
  if (/数学|公式|积分|推导|定理|证明|高斯/.test(input)) return scenarioMathQuestion
  if (/流程图|时序图|甘特图|图表|架构图|开发流程|ci.*cd|敏捷|scrum/.test(input)) return scenarioDiagramQuestion
  if (/kubernetes|k8s|容器|docker|云原生/.test(input)) return scenarioKubernetes
  if (/错误|error|测试错误/.test(input)) return scenarioError
  return scenarioDefault
}

export function getAvailableScenarios() {
  return [
    { key: 'dataWarehouse', label: '数据仓库分层', desc: '思考+Markdown+SQL+公式+Mermaid+思维导图' },
    { key: 'codeQuestion', label: '快速排序', desc: '思考+Markdown+Python代码+公式+流程图+思维导图' },
    { key: 'mathQuestion', label: '高斯积分推导', desc: '思考+Markdown+多个LaTeX公式+Python验证+思维导图' },
    { key: 'diagramQuestion', label: '敏捷开发流程', desc: '思考+Markdown+时序图+甘特图+CI/CD+公式+思维导图' },
    { key: 'kubernetes', label: 'Kubernetes', desc: '思考+Markdown+YAML+Mermaid架构图+公式+思维导图' },
    { key: 'default', label: '通用回复', desc: '展示全部能力的功能介绍' },
    { key: 'error', label: '错误模拟', desc: '模拟API错误响应' }
  ]
}
