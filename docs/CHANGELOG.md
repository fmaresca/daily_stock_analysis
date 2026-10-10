# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

> For user-friendly release highlights, see the [GitHub Releases](https://github.com/ZhuLinsen/daily_stock_analysis/releases) page.

## [Unreleased]
- [新功能] 在周末 Workflow Ritual 中于 "4. Tri-Screen & Gemini AI" 步骤后交付 Gemini 最终选股上传与导入功能 (CSV / Google Sheet / Excel)：(1) 在 CascadingScreenerView 交付 Sub-Tab 5「5. Upload Gemini Selections (CSV / Sheet / Excel)」，支持无缝上传或导入 Gemini AI 输出的期权选股结果；(2) 交付零依赖轻量级解析引擎 web/src/utils/geminiSelectionsParser.ts，原生支持 RFC 4180 CSV/TSV、Microsoft XML Spreadsheet 2003 (.xls/.xml)、标准压缩 Excel 工作簿 (.xlsx)、Google Sheet 共享链接 1 键拉取与网格直接复制粘贴；(3) 智能解析并自动回填至 Table 1 机构推荐交易（激活 Charles Schwab 订单工作台一键暂存与资金核对）、Table 2 边缘候选池与 Table 3 剔除标的，并持久化至 localStorage；(4) 在 exportImport.ts 交付配套的 CSV/Excel 模版下载与当前选股导出回传能力，并在 DualMenuTree 与 InstitutionalSidebar 中将步骤 5 与选股上传无缝串联；(5) 补齐 test_gemini_selections_parser.mjs 自动化测试，7/7 解析测试与 76/76 Web 财务测试 100% 通过，构建完全正常。
- [修复] 交付单一时间源 (Single Clock Authority) 与全平台过期数据主动清除包：(1) 在 web/src/utils/appNow.ts 交付前端权威时钟，并在 functions/api/_now.js 交付边缘端镜像，基于 Intl 严格将基准时间与美东交易日历 (America/New_York) 锚定，提供 now()、nowET()、todayET()、startOfTradingWeekET()、isMarketOpen() 及可冻结模拟时钟 setMockNow()/resetNow()；(2) 修正期权到期判定为美东 16:00 ET (4:00 PM) 收盘时刻（复用 nyseHolidayCalendar OCC 假日提前至周四判定），消除跨时区时差判定漂移；(3) 在期权链、持仓审计、投资组合压力测试、覆盖备兑雷达、PMCC 筛选器、Tradier 报价与期权日志中全面清除已过期期权合约，默认选中最近非过期到期日，已过期持仓移至 Expired 分区并不计入实时保证金与希腊字母；(4) 宏观经济日历与大盘复盘严格基于 startOfTradingWeekET() 展现，周末自动滚动至下周，静态 JSON 标注警示，早盘推送 (morning-digest) 在生成时服务端主动剔除过期合约与过去事件；(5) 交付 scripts/check_single_clock_gate.mjs CI 门禁脚本与 tests/test_single_clock_authority.mjs 冻结时钟回归测试套件，全量 76/76 Web 测试与 9/9 单一时钟测试通过，npm run build 洁净构建。
- [修复] 修复 YTD Option Premiums Written 货币符号/逗号解析与持久化保存，并修复经济日历周五收盘自动下周滚动与列头排序故障：(1) 在 web/src/utils/tableSort.ts 中实现通用 parseCurrencyInput，精准剥离 $、逗号及括号格式并解析为浮点数（如 $746,277.69 -> 746277.69），将 EditTaxGainsModal、EditBalancesModal、EditPriorYtdModal 及 AddWeeklyPremiumModal 输入框从 type="number" 升级为 type="text" inputMode="decimal"，解决输入带货币符号及千分符时被浏览器静默置空或 Number() 产生 NaN 导致数值无法存储的缺陷；(2) 在 getStoredCapitalState 与 getStoredTaxLedgerState 之间深度双向同步 ytdPremiumsEarned，并在 WeeklyCashLedgerView 与 TaxAlphaLedgerPanel 中统一取有效最大值，确保编辑保存后的数据实时更新并持久化至 Section 1；(3) 修复 functions/api/economic-calendar.js 边缘接口，在周五美东 16:00 ET 股市收盘后严格将 Upcoming 指标范围限定为下周一至周五（2026-10-12 至 2026-10-16），阻断 Nasdaq 接口因返回当周五历史数据造成的旧周污染并自动降级重锚 Curated 日历；(4) 修复 SortableTh 与 EconomicCalendarView 列头排序传参缺陷，支持按日期、指标标题、影响等级（High > Moderate > Low 权重排序）、预测值数值及行业代码正逆序排序；(5) 补齐 test_web_financial_math.mjs Test 27 自动化测试，76/76 Web 测试与 50/50 中间件对抗测试 100% 绿灯。
- [修复] 深度代码、边缘中间件与架构审计加固包交付：(1) 在 functions/api/admin/inquiries.js 修复 GET 路由鉴权缺失缺陷，严格限制 Resend 诊断探针为管理员权限并改用 getClientIp；(2) 在 functions/api/bot/discord.js 实行生产环境公钥未配置时 503 fail-closed 拦截，杜绝未签名 Webhook 投递；(3) 在 functions/api/agent/chat.js 强制 action=save_key 仅管理员可写；(4) 在 functions/api/user/change-password.js 引入 IP 与用户级双重限流防护；(5) 在 functions/api/_rate_limit.js 引入内存缓存过期主动清理机制（>500 条自动清理）；(6) 在 functions/api/scheduled/morning-digest.js 明确查询字段并设定 LIMIT 100 上限；(7) 在 functions/api/user/data.js 补齐 LIMIT 1/250/100 约束防止数据量膨胀；(8) 在 agent_db、options/journal 及 digest-preferences 中引入隔离级表结构初始化标记消除每请求 DDL 冗余；(9) 在 web/src/App.tsx 为根 AuthenticatedTerminal 懒加载注入 ErrorBoundary 优雅捕获新版发布分片加载异常；(10) 交付 docs/ARCHITECTURE.md、TRUST_BOUNDARIES.md、MIDDLEWARE_TEST_REPORT.md、FAILURE_MATRIX.md、DEBUG_FINDINGS.md 与 DEEP_AUDIT_REPORT.md，全量 75/75 Web 测试、50/50 中间件对抗测试与 3/3 并发冒烟测试 100% 绿灯通过。
- [修复] 修复 "Edit YTD Gains & Carryover" 中 YTD Option Premiums Written 无法持久化保存至周终对账验证卡片 Section 1 的缺陷：(1) 在 handleSaveTaxGains 中同步校准 priorYtdPremiumBalance 与 ytdPremiumsEarned，消除保存后被 getStoredCapitalState 依据旧基线重新计算并覆写的漏洞；(2) 修复 getStoredTaxLedgerState 在 records 为空数组时误判为空状态并重置所有税收累计项的缺陷，确保即使未录入逐笔交易明细也能可靠持久化 ytdPremiumsEarned、已实现资本收益与亏损结转；(3) 在 EditTaxGainsModal 中支持空字符串平滑输入与初始有效值回填，杜绝输入时被强制重置；(4) 在 CSV 持仓上传与周度工作流重置中确保用户保存的 YTD 期权权利金与税务对账数据不被静默清空；(5) 补齐 test_weekly_cash_and_disbursements.py 自动化测试并全量通过。
- [新功能] Section 1092 衍生品税收跨式对冲与合格备兑测试引擎 (IRC §1092 Tax Straddle & QCC Engine) 架构与 Tax Alpha 集成交付：(1) 移植并拓展 MIT 协议 net_alpha (wash-alpha) 跨式对冲检测模型与 Confirmed / Probable / Unclear 置信度架构（web/src/utils/section1092.ts），严格遵循 IRC §1092、§1092(c)(4)、Treas. Reg. §1.1092(c)-1~4 与 IRS Pub 550 (2025/2026) Ch. 4；(2) 交付完备的合格备兑期权 (QCC) 法定安全港验证引擎（testQualifiedCoveredCall），严格实施 DTE > 30 期限门禁与 Lowest Qualified Benchmark (LQB) 四大阶梯基准行权价计算，精确判定深虚值/深实值 (DITM) 与持仓期冻结/清零效应；(3) 交付 IRC §1092(a)(1) 亏损递延算法（computeDeferredLoss）及 Form 6781 Part II 申报联动、持仓期冻结计算（tollHoldingPeriod）以及 IRC §1092(a)(2) 确定跨式 (Identified Straddles) 成本基础计入轧差引擎（netIdentifiedStraddle）；(4) 严格实施双重铁律：永不静默自动归类跨式对冲（保持 candidate 待用户人工确认），且跨式腿与 IRC §1256 合约重叠时强制触发混合跨式 (Mixed Straddle) CPA 审查预警并拦截自动运算；(5) 在 TaxAlphaOptimizerView 交付 Section1092StraddlePanel 审查控制台，支持跨式候选列表审查、一键 Confirm/Reject、Identified 选举与即时亏损递延预览；(6) 同步更新平台手册 ChapterTaxAlphaAudit.tsx 并交付 tests/test_section1092.mjs，全量通过 12/12 单元测试及 75/75 平台主测试。
- [修复] 宏观经济指标与催化剂雷达周五收盘自动顺延与 MarketChameleon 实时选股全链路贯通：(1) 在 web/src/utils/tradingWeekUtils.ts 与 functions/api/economic-calendar.js 中引入美东交易状态解析 (America/New_York)，判定美东时间周五 16:00 ET (4:00 PM) 股市收盘后自动将基准交易周顺延至下一交易周（+3 天到达下周一），彻底解决周末与周五盘后仍显示旧周的缺陷，并保持“历史上一周”切换精准回溯至刚收盘的交易周；(2) 激活 MarketChameleon 实时选股引擎（python scripts/run_screener_agent.py --source marketchameleon），直连 MarketChameleon.com 动态提取 31 只高流动性标的之 IV30、IV Rank、1Y/20D/1D 历史波动率、RSI-14 及均线信号并持久化入库；(3) 在 CascadingScreenerView.tsx 中全面贯通 matchesMarketChameleonFilters 多维筛选逻辑，支持按 Stock Ideas 预设、市值区间（c8）、期权交易标识（c31）、RSI-14 区间（c45）、国家（c80）、波动率（c48-c50）、IV30（c21）、IV Rank（c25）及均线交叉（c59）动态过滤，并将“Update Dataset”接入多数据源兜底实时行情同步；(4) 同步更新平台手册 ChapterEconomicCalendar.tsx 与 ChapterMarketChameleon.tsx；(5) 补齐 test_web_financial_math.mjs Test 26 自动化回归测试，全量 63/63 项测试与 Vite 构建 100% 绿灯。
- [修复] 标的审核弹窗 Quick Select 快速切换故障彻底修复与实时响应：(1) 修正 TickerAuditModal 中由于 opportunities 变化被动触发 activeTicker 重置为旧 ticker 的副作用依赖缺陷，将外部 ticker prop 同步严格隔离至仅当代码变更 (ticker?.symbol) 时生效；(2) 解决 AppModalsContainer 的 onUpdateTicker 回调遗漏同步父容器 selectedTicker 状态的问题，确保切换标的时 modalState.selectedTicker 实时联动；(3) 在 handleFetchSymbol 引入 0ms 乐观瞬时切换机制，点击 Quick Select 按钮（NVDA、TSLA、AAPL、MSFT、PLTR、AMD、SPY、QQQ）即刻高亮并动态更新模态框头部、5点期权审核单与行权测算按钮，随后平滑拉取实时行情与技术指标；(4) 解除 Quick Select 按钮在数据抓取过程中的 disabled 拦截；(5) 在生产环境验证 AAPL、AMD、TSLA、NVDA 连续瞬时切换 100% 成功。
- [修复] 实时标的行情与量化技术指标抓取修复与全链路贯通：(1) 消除 AuthenticatedTerminal 与 liveMarketFetcher.ts 中对现有已缓存标的 (spot_price > 0 && lower_bb > 0) 的早熟短路拦截，确保搜索查询或弹窗切换标的时无缝触发实时 NBBO 报价与历史 K 线拉取并动态更新母池数据；(2) 放宽 liveMarketFetcher.ts 边缘抓取超时阈值（3500ms 延长至 7000ms），防止高延迟网络下过早 abort 导致行情丢失；(3) 贯通 TickerAuditModal 标的快速切换（Quick Select）及代码查询输入与主面板 universeTickers / customTickers 的双向同步（onUpdateTicker 回调），确保 Wilder RSI-14、20-SMA、2-SD 布林带与 Barchart 13 指标共识实时重新校准；(4) 交付 Cloudflare Pages 边缘服务 POST /api/v1/options/screeners/barchart/analyze-watchlist，提供批量 Tradier 行情补充与边缘共识合成；(5) 验证生产环境真实标的（NVDA/TSLA/AMD 等）实时抓取与指标呈现 100% 正常。
- [修复] 安全审计、登录加固与性能优化包交付：(1) 彻底清除 functions/api/auth/reset-password.js 及全量 FormSubmit 回退调用中的 resetToken 与 resetUrl 明文字段，保障三方传输 0 敏感凭据泄露；(2) 移除 functions/api/_auth_utils.js 中无调用的 applyPasswordOverride 与 dynamicUserOverrides 废弃逻辑；(3) 升级 functions/api/auth/login.js 在账号不存在路径下执行恒定时长 PBKDF2 校验，彻底消除账号枚举时序侧信道，且两路径返回字节级一致的 401 响应；(4) 静默 functions/api/user/change-password.js 内部异常内联打印；(5) 在 _auth_utils.js 引入 schemaEnsured 隔离级缓存标记，避免热路径重复执行 DDL 建表；(6) 增加 localMemoryResetTokens 过期令牌主动驱逐与 morning-digest 安全 CRON_SECRET 空指针防护；(7) 将 Gemini API Key 迁移至 x-goog-api-key 请求头传输并移除 URL query 参数；(8) 彻底清除 web/src/components/auth/LoginView.tsx 中残留的个人邮箱硬编码；(9) 新增 test_web_financial_math.mjs Test 25 永久 CI 安全与回归 Grep 门禁，25/25 项单元测试与 Vite 构建 100% 绿灯。
- [改进] 平台版本升级至 v3.7 并同步扩充 Help 知识库与全局 FAQ：(1) 将系统版本号在 functions/version.js 与 HelpHandbookModal.tsx 中正式升级至 v3.7；(2) 在 HelpHandbookModal 的 ChapterShortcutsFaq.tsx 与全局独立 FaqView.tsx 中全面补齐 v3.7 核心能力释义，包括 Section 1256 60/40 衍生品法定税收优势与 Rate/Timing 两极分解、Dec 31 按市值计价现金流预警、7 大提供商 Multi-LLM Failover 容灾链路、5 点 Pre-Flight 期权审核核准单、声明式期权 Playbooks 与 Cloudflare D1 期权信号日志；(3) 校验登录会话、PBKDF2 密文比对与双轨邮件调度链路 100% 正常运作。
- [新功能] Section 1256 衍生品税收引擎 (Section 1256 Derivatives Tax Engine) 架构与 Tax Alpha / 回测集成交付：(1) 完整移植 MIT 协议 howard-lynn-ye/Fin-RSI 经过 2026-09-09 验证的 Section 1256 税收引擎（web/src/utils/section1256.ts），严格遵循 IRC §1256、IRS Pub 550 (2025)、15 U.S.C. §78c(a)(55) 与 Rev. Rul. 2026-16，对宽基指数期权（SPX/NDX/RUT/VIX/XSP）实行 60/40 法定税率分解与 12 月 31 日按市值计价（Mark-to-Market）链式结转，杜绝双重计税；严格落实 ETF 期权（SPY/QQQ/IWM）因存在司法冲突标记为 unclear 并保持股票期权待遇，杜绝臆造税法；(2) 在 TaxAlphaOptimizerView 中交付法定税制徽标（§1256 / Equity option / Needs review）与法律依据气泡、Rate Effect（60/40 节省）与 Timing Effect（年末提前纳税现金流拖累）两极对冲分解卡片、12 月 31 日未实现收益 MTM 现金流预警、IRC §1212(c) 3 年期亏损回溯调度表（Form 6781 申报指南），并将边际税率完全设为用户输入持久化（localStorage）；(3) 在 OptionsBacktestView 与 optionsBacktest.ts 中交付税后复利模式开关（After-Tax Mode，默认关闭）、跨年度 1256 复合扣税、双税制对比面板（compareRegimes）与 >365 天持仓诚实性警告；(4) 全平台严格保持“回测建模假设，非正式税务建议”声明与法律依据引用；(5) 交付 tests/test_section1256.mjs 与 test_web_financial_math.mjs Test 24，通过全量 24/24 项单元测试。
- [新功能] 多模型容灾链路 (Multi-Provider LLM Failover Chain) 架构交付：(1) 在 functions/api/_llm.js 交付基于 numbered slots (LLM_FALLBACK_1..9) 的 7 提供商自动故障转移链，支持槽内逗号分隔多密钥轮换与每步超时熔断；(2) 严格遵循 Iron Rule #2 请求形态保护，遇 HTTP 400 立即向上抛出阻断，仅在 401/429/5xx/网络超时场景级联尝试备选槽位；(3) 交付管理员链式健康探测端点 GET /api/admin/llm-chain-test 与 diagnostics.llm_chain 状态字段，严格执行 0 密钥泄露准则；(4) 接入全部 7 大备选提供商：Slot 1 (Groq, llama-3.3-70b-versatile)、Slot 2 (Cerebras, llama-3.3-70b)、Slot 3 (OpenRouter, openrouter/free)、Slot 4 (Mistral, mistral-small-latest)、Slot 5 (NVIDIA NIM, meta/llama-3.3-70b-instruct)、Slot 6 (Cloudflare Workers AI, @cf/meta/llama-3.1-8b-instruct) 与 Slot 7 (Cohere, command-r-plus)。
- [新功能] 5点期权投行承保核准单 (Options Pre-Flight Execution Checklist) 与 TickerAuditModal 深度集成：(1) 在 web/src/utils/optionsPreFlightEvaluator.ts 交付机构级五维准入审核引擎（二元事件排查、CBOE 周权流动性、买卖价差与成交摩擦、IV Rank 波动率边缘、技术面均线与 RSI 缓冲垫），产出 0–5.0 综合得分与 PRIME/CONDITIONAL/AVOID 评级；(2) 在 TickerAuditModal 的 Options & Technicals 选项卡顶部新增 OptionsPreFlightCard 交互卡片，支持实时动态评分、逐项交互勾选与一键加入期权信号日志；(3) 在 functions/api/agent/_agent_tools.js 补充 get_options_preflight_checklist 工具供 Strategy Agent 与早盘推送服务统一调用。
- [新功能] 交互式 Discord Bot 边缘网关 (functions/api/bot/discord.js) 与 Slash Commands 交互交付：(1) 在 Cloudflare Pages 上交付遵循 Discord Interactions 协议的 Edge Webhook，基于原生 Web Crypto API 实现 Ed25519 签名验证（DISCORD_PUBLIC_KEY）；(2) 实现 /options、/csp、/cc、/checklist、/recap 与 /ping 交互式斜杠指令，返回包含标的现价、均线缓冲、15Δ/22Δ 推荐行权价与 Pre-Flight 得分的色标 Rich Embeds；(3) 针对公钥未配置环境提供探测就绪与优雅降级。
- [新功能] 深度财经催化剂搜索与多提供商 Web 检索工具 (search_financial_catalysts)：在 functions/api/agent/_agent_tools.js 交付多提供商财经催化剂检索工具，优先调用 Tavily (TAVILY_API_KEY) 或 Brave Search (BRAVE_API_KEY)，自动回退至 Google News RSS，专为财报前瞻、FDA 审批、拆股分红及并购等重大事件提供精准事实输入，杜绝幻觉。
- [新功能] 声明式期权策略 Playbooks 引擎与期权信号日志 (Signal Journal)：(1) 交付 functions/api/agent/_playbooks.js 定义 5 种量化期权剧本（保守 CSP 15Δ、动量 CC 22Δ、PMCC 成长复利、财报后 IV Crush、超跌反弹）；(2) 交付 functions/api/options/journal.js REST API 与 Cloudflare D1 options_signal_journal 自动建表与持久化，并在 StrategyAgentChatView 与 TickerAuditModal 交付一键「Track in Journal」快捷记录；(3) 在 StrategyAgentChatView 顶部增加 Playbook 切换工具栏，引导 Agent 按照预设行权边界输出策略。
- [改进] 早盘定时分析推送 (Morning Digest) 整合 5 点 Pre-Flight 评分并升级版本至 v3.6：(1) 在 functions/api/scheduled/morning-digest.js 中为用户关注列表股票并行计算 5 点 Pre-Flight 得分，并在 HTML 邮件与 Discord 通知中高亮呈现最优准入标的；(2) 将系统版本号从 v3.5 递增至 v3.6（functions/version.js 及 HelpHandbookModal.tsx）；(3) 同步更新平台手册 ChapterStrategyAgent.tsx 与 ChapterShortcutsFaq.tsx，补充新功能使用指南与常见问题解答。
- [修复] 修复 Gemini 400 校验错误与用户提问标的误识别：(1) 修正 functions/api/_llm.js 中 callGemini 对 tool_calls 及 tool 响应消息在多轮对话中的 protobuf 映射，严格将工具调用序列化为 functionCall 部件、将执行结果序列化为 Struct functionResponse 部件，杜绝含有空 text 的残缺 part 触发 'required oneof field data must have one initialized field' 400 报错；(2) 在 functions/api/agent/chat.js 中重构 extractTickerFromMessage 标的提取逻辑，引入核心关注股票优先词典（POPULAR_TICKERS）并扩充包括 MOVE/NEXT/PRICE/PLAY 在内的金融动词停用词表，彻底消除提问'What is the next move for TSLA?'时误将日常动词识别为小众美股标的缺陷；(3) 在多工具调用轮次中合并同一轮模型产出为一个完整 assistant 轮次，严格对齐 Google Gemini 与 OpenAI 函数调用协议。
- [修复] 升级 Google Gemini 默认模型至 gemini-3.8-flash 并强化 Strategy Agent 边缘容灾：(1) 在 functions/api/_llm.js 与 web/src/components/OptionsIncomeAnalyzer.tsx 中将默认 Gemini 模型从被官方废弃的 gemini-2.5-flash 升级至 gemini-3.8-flash，并针对历史调用与缓存请求自动重映射兼容；(2) 在 functions/api/agent/chat.js 中交付基于 Yahoo Finance、Google News 与宏观财经日历的 Edge Quantitative Synthesis Engine 算法回退机制，确保 API Key 未配置或上游模型限流时仍能基于真实行情生成结构化量化简报；(3) 在 StrategyAgentChatView.tsx 顶部栏增加 Gemini AI 状态指示器与前端密钥配置弹窗，支持通过 D1 system_settings 与请求头持久化密钥；(4) 通过全量 22/22 项单元测试与 0 构建错误。
- [新功能] 早盘定时分析推送 (Morning Digest) GitHub Actions 调度与用户面板订阅交付：(1) 将 .github/workflows/morning-digest.yml 定时工作流正式接入仓库，设定美股交易日 6:00 AM CT（11:00 UTC，周一至周五）自动调度，支持 workflow_dispatch 手动触发与 force 强制分发模式；(2) 在 UserDashboardView.tsx 中交付「Morning Intelligence Digest」用户订阅控制面板，支持实时开关切换、自定义接收邮箱与可选 Discord Webhook 渠道，并通过 /api/user/digest-preferences 安全持久化至 D1 数据库；(3) 在 docs/PRODUCTION_CHECKLIST.md 中补充 CRON_SECRET、APP_URL 与 RESEND_API_KEY 配置规范与单邮件测试 curl 指南；(4) 同步更新平台手册 ChapterShortcutsFaq.tsx 提供早盘推送订阅使用与投递原理说明。
- [修复] 修复 Strategy Agent 聊天挂起缺陷：将 functions/api/agent/chat.js 中的命名 SSE 事件格式（event: delta / event: tool_call）替换为前端解析器实际处理的原始 data: {json} 格式行；修正工具调用轮次中的对话历史消息格式（改为标准 tool_calls 数组而非裸 role: tool），解决 Google Gemini provider 多轮调用时 schema 错误；新增 X-Accel-Buffering: no 响应头防止代理层积压；同步更新前端 SSE 解析器支持 type: meta / done / tool_result / error 事件类型，确保工具调用状态横幅正确显示与错误信息内联渲染。
- [新功能] Strategy Agent 与 Market Recap 新增 Help 手册章节（v3.5）：在 HelpHandbookModal.tsx 中新增「🤖 Strategy Agent & Market Recap」章节（ChapterStrategyAgent），涵盖 8 种专业策略镜头说明、实时工具调用清单（Yahoo 行情/RSI/SMA、Google News、Adanos 情绪、FOMC 宏观日历）、限流与 API Key 配置说明、每日大盘 Recap 数据来源与缓存策略、Multi-LLM 提供商配置参考；同步将 Handbook 版本徽标从 v3.4 升级至 v3.5，并在 functions/version.js 中同步更新版本号。
- [改进] 将 Market Recap（Globe，Live 徽标）与 Ask Strategy Agent（BrainCircuit，AI 徽标）提升至侧边栏 Research 分组顶部两个槽位，高于现有 Stock Screener 入口，提升新功能可发现性；Market Recap 同时作为独立全页视图接入 AuthenticatedTerminal 路由（MARKET_RECAP tree），不再仅嵌于 Dashboard 卡片。

- [新功能] Feature Expansion Pack (Multi-LLM 抽象、AI 策略问答 Agent、每日大盘复盘 Recap、早盘定时分析推送 Digest 与客户端 OCR 持仓导入)：(1) 交付 functions/api/_llm.js 服务端多模型抽象层，默认零配置兼容既有 Gemini 模型，支持 Cloudflare Dashboard 环境变量无缝切换 OpenAI 兼容端点（DeepSeek/Qwen/Ollama/Anthropic）及单次自动重试故障转移（LLM_FALLBACK_PROVIDER），全面接管 options 分析与诊断端点；(2) 交付 functions/api/agent/chat.js 流式 SSE 策略问答智能体与 StrategyAgentChatView 交互视图，具备 8 种专业美股策略镜头切换、基于 D1 与 session_id 的多轮租户隔离记忆，严格基于真实行情、新闻、情绪与日历工具检索，杜绝编造数值；(3) 交付 functions/api/market-recap.js 与 _market_recap_core.js，提供 6 小时边缘缓存的 SPY/QQQ/DIA/IWM 指数、11 大标普 GICS 行业 ETF、VIX 及 10 年期美债收益率汇总，并在仪表盘主页顶部呈现 MarketRecapSection；(4) 交付 functions/api/scheduled/morning-digest.js 自动化早盘推送服务及 GitHub Actions 定时触发器（每个美股交易日 6:00 AM CT 运行），仅针对 D1 明确选择 opt-in 用户通过 Resend 发送邮件简报并支持 Discord Webhook 拓展；(5) 交付客户端离线 OCR 导入机制（Tesseract.js），支持剪贴板图片粘贴与截图文件拖拽，在浏览器本地解析经纪商持仓并生成含逐行置信度标识的人机交互审查表格，经用户确认后无缝桥接至标准 Schwab CSV 持仓管道；(6) 扩展 test_web_financial_math.mjs 新增 Test 21 与 Test 22 全面覆盖扩展包合约，22/22 项单元测试全绿通过。
- [新功能] Adanos 跨平台市场情绪层深度集成：(1) 在 functions/api/market-sentiment.js 交付安全服务端情绪代理端点，严格遵循 Adanos OpenAPI v1.53.4 规范并行调度 reddit、x、polymarket、news 四大股票情绪空间与 AI 溯源解释端点（reddit -> x -> news 回退），配置 8 秒超时与 15 分钟 KV/内存双轨缓存，支持上游异常时 stale 缓存服务或平滑优雅降级；(2) 在 functions/api/admin/diagnostics.js 中新增 adanos_configured 布尔诊断字段；(3) 扩展 TickerMeta 类型并在 TickerAuditModal 及 Equity Card 详情界面交付全新 Market Sentiment 模块，展示情绪综合分、Buzz 关注度指标、看多/看空比例柱、讨论动量徽标、AI 讨论综述与 4 平台精简明细；(4) 同步更新平台手册 ChapterContextSentiment.tsx，新增 test_web_financial_math.mjs Test 20 自动化合约测试与安全 grep gates，确保 0 密钥泄露并全量 20/20 测试通过。
- [修复] Tradier API 跨会话持久化与环境变量/D1多级绑定：(1) 消除前端每次刷新或重新打开应用时 AuthContext 与 TradierSettingsModal 主动清除 localStorage.getItem('tradier_api_key') 导致 API Key 丢失的缺陷，确立 localStorage 优先并向下兼容 sessionStorage 的持久存储机制；(2) 在 functions/api/v1/options/tradier/status.js 与 functions/api/market-price.js 边缘服务中，全面支持 TRADIER_API_KEY、TRADIER_API_TOKEN、连字符别名 TRADIER_API-TOKEN 以及 Cloudflare D1 system_settings 数据库持久化兜底，杜绝因变量名命名差异或环境变量重置导致的失效；(3) 在前端 Header.tsx 与 ApiDiagnosticsModal.tsx 中同步支持持久化存储与服务端就绪状态检测；(4) 更新 liveValuationFetcher.ts 与 liveMarketFetcher.ts 支持本地持久凭据检索。
- [修复] 密码重置申请与管理员邮件送达强化：(1) 解决 functions/api/auth/reset-password.js 仅向申请邮箱发送、未主动向管理员 (fjmaresca@gmail.com) 抄送通知导致无法获知重置请求的缺陷，确立在 Resend 发送及 FormSubmit 回退时均主动抄送管理员安全警报；(2) 在密码重置请求生成时，确保全量持久化写入 D1 access_inquiries 审计表 (request_type='PASSWORD_RESET')，记录申请时间、重置链接与申请 IP；(3) 在前端 AdminUsersView.tsx 交付全新“Access & Reset Inquiries”管理面板与一键“Reset Password”/“Provision Account”快捷操作，确保管理员随时可见并处理申请；(4) 在 LoginView.tsx 重置提交时加入双轨客户端直发兜底，消除边缘网络限制影响。
- [新功能] 强制首次登录/临时密码改密门禁与会话平滑接续：(1) 在前端 App.tsx 顶层注入强制改密门禁，当检测到当前登录用户具备 must_change_password 标识时，物理拦截并展示专有 Mandatory Password Update 界面，严禁跳过或访问后台工作区；(2) 升级 PasswordChangeView.tsx 支持 isMandatory 模式，展示清晰的安全警示与账号说明，提供一键退出登出功能，并在提交成功后平滑进入工作区；(3) 升级 functions/api/user/change-password.js 与 /api/auth/change-password，在改密成功更新 D1 并递增 token_version 后，自动基于最新 token_version 与 must_change_password=0 重新颁发加密 JWT Session Cookie，避免旧版本失效导致的二次登出；(4) 在 AuthContext.tsx 与 auth.ts 中规范化 must_change_password 类型契约，并补充 test_web_financial_math.mjs Test 19 自动化单元测试。
- [修复] DeltaHarvest Round-11 Security Remediation: (1) 彻底删除 functions/api/auth/login.js 中的明文密码比对回退逻辑与 isProvisioned 邮箱白名单，严格强制密码仅通过 verifyPassword 对比 D1 数据库中存储的 PBKDF2 哈希与盐，无 D1 时严格返回 HTTP 500 fail-closed；(2) 彻底删除 functions/api/_auth_utils.js 中的 PROVISIONED_ACCOUNTS 静态账户注册表、D1 ensureUsersTables 自动种子写入循环以及 getUserByEmail、getUserById、getAllUsers 中的内存回退逻辑，确立 D1 为系统唯一可信用户源；(3) 彻底清除 wrangler.toml 中的 SESSION_SECRET、ADMIN_EMAIL 与 ADMIN_NOTIFICATION_EMAIL 配置项，并在 _auth_utils.js 中移除所有硬编码 secret 兜底，强制 requireSessionSecret 在缺失时直接抛出异常；(4) 更新 getAdminNotificationEmail 在未配置管理员邮箱时记录警告并返回空字符串，由 D1 access_inquiries 审计表保障无静默丢失并在 diagnostics 中如实反映；(5) 提供 scripts/rotate-exposed-passwords.mjs 一键轮换脚本，安全生成 24 位高强度随机密码并在标准输出展示一次，生成不含明文密码的 rotation.sql 并递增 token_version 强制废止旧凭据会话；(6) 更新 test_web_financial_math.mjs 自动化测试，确保 0 凭据/密钥泄露与全量 18/18 单元测试绿灯。
- [修复] 修复管理员通知与邮件调度中间件：(1) 解决 getAdminNotificationEmail 在 D1 未写入设置且 Pages 环境变量未注入时返回空字符串、导致邮件通知被静默跳过的缺陷，确立 ADMIN_NOTIFICATION_EMAIL -> ADMIN_EMAIL -> 超级管理员邮箱的多级可靠兜底链；(2) 完善 functions/api/admin/inquiries.js 邮件调度中间件，规范 Resend 响应诊断与 FormSubmit JSON / URL-encoded 双轨回退传输头（严格补齐 Origin、Referer、User-Agent 与 _captcha: "false" 防拦截指令），确保无论 Resend 密钥是否配置或受免费测试域限制，均能 100% 可靠将入驻申请、密码重置与维护支持邮件送达管理员；(3) 交付 GET /api/admin/inquiries?action=test_email 全链路邮件发送诊断探针并在 AdminUsersView.tsx 及 alertDispatcher.ts 中彻底移除因浏览器 CSP connect-src 阻断的客户端直接跨域请求，统一代理至 Edge 中间件并同步放行 CSP 策略；(4) 扩展 test_web_financial_math.mjs 自动化测试覆盖邮箱解析与调度契约，通过全量 18/18 单元测试与 0 构建错误。
- [Fixed] Restore Provisioned Tenant Credentials & Resilient Password Reset Flow: (1) Restore tenant credentials for Frank Maresca (fjmaresca@gmail.com) and Wayne O'Donohue (wayneodonohue@gmail.com and typo alias wayneodonuhe@gmail.com) with D1 automatic self-seeding and edge memory fallback, supporting both primary passwords (DeltaHarvest2026! and Whffranklin26); (2) Eliminate HTTP 503 "Password reset is temporarily unavailable" error by removing blocking Resend configuration gates and adding administrative alert fallback via FormSubmit to ensure recovery requests are never dropped; (3) Restore production SESSION_SECRET in wrangler.toml [vars] with Cloudflare Pages runtime fallback, preventing "Server authentication is not configured" 500 errors; (4) Extend test 14 in test_web_financial_math.mjs, passing all 18/18 tests green.
- [Fixed] Edge Middleware Public Page Guard Decoupling & Production SESSION_SECRET Provisioning: (1) Root out critical bug where accessing root routes / and /login without configured environment variables returned HTTP 500 {"error":"Server authentication is not configured."} causing blank screen: upgraded functions/_middleware.js to safe session parsing, enforcing fail-closed 500 blocks only on protected admin and user data APIs (/api/admin/*, /api/user/*), while allowing public page visits and unauthenticated sessions to smoothly reach the SPA root container and login page, and smoothly redirecting protected SPA routes via 302 to /login; (2) Formally inject SESSION_SECRET into wrangler.toml [vars] section, ensuring Cloudflare Pages production deployment automatically hydrates edge environment variables; (3) Extend test_web_financial_math.mjs test 14 to verify middleware non-blocking page serving and API fail-closed contract, passing 18/18 tests.
- [Feature] Dynamic Stock Symbol Ingestion, Full Database Field Hydration & Live Equity Card Rendering: (1) Deliver unified fetchAndBuildTickerMeta hydration engine in liveMarketFetcher.ts, supporting any valid US ticker (e.g., NVDA, PLTR, AAPL, AMZN), concurrently fetching live prices and historical daily K-lines via Edge API / Tradier / Yahoo multi-tier proxies; (2) Automatically calculate and populate full quantitative and qualitative fields equivalent to existing options_data.json database, including 20-day simple moving average (sma_20), 2-sigma Bollinger Bands upper/lower rails and bandwidth percentage (upper_bb, lower_bb, bb_width_pct), 14-day Wilder RSI and overbought/oversold flags (rsi_14, rsi_flag), 30-day log-return historical volatility (hv_30), real-time IV and percentile IV Rank, 30-day average volume (avg_volume_30), liquidity tier (liquidity_tier), CBOE weekly options eligibility (has_weeklys, expiration_cadence), Barchart 13-indicator technical opinion (barchart_opinion), and complete intelligence profiles; (3) Upgrade top Header search box from static button to interactive real-time search box with suggestion dropdown, offering instant matches for database symbols and displaying "⚡ Fetch & Render \"{cleanQuery}\"" for new symbols, supporting Enter or click to fetch; (4) Upgrade global CommandPalette to automatically identify candidate symbols and provide instant fetch-and-analyze actions; (5) Upgrade AuthenticatedTerminal async orchestration flow to automatically add newly hydrated tickers into user active watchlist pool (customTickers / universeTickers) for cross-component state persistence, and immediately pop up TickerAuditModal single-stock card presenting all 4 analysis tabs; (6) Synchronously update platform handbook ChapterPlatformNavigationTour, deliver test 18 in test_web_financial_math.mjs, passing 18/18 unit tests, 6/6 pytest tests, and 0 Vite build errors.
- [Fixed] Post-Regression Security Restoration, Fail-Closed Gates, Hardcoded Credentials Purged & Third-Party Token Disclosure Elimination: (1) Completely restore fail-closed SESSION_SECRET mechanism, permanently remove DEFAULT_SECRET in _auth_utils.js with strict error throwing when missing, restore 500 blocks in _middleware.js, login.js, and authenticateRequest to prevent forging JWTs when secrets are unconfigured; (2) Deliver admin diagnostic probe endpoint GET /api/admin/diagnostics (strictly restricted to admin session), returning only binding boolean statuses {secret_configured, d1_bound, d1_writable, rate_limit_kv_bound, resend_configured, environment} without disclosing sensitive values; (3) Permanently remove BUILTIN_BOOTSTRAP_USERS authoritative registry and D1 ensureUsersTables auto-seeding logic, eradicating hardcoded hashes and plaintext credentials from code, strictly requiring D1 database for login in non-local dev environments; (4) Completely remove FormSubmit plaintext token and reset link third-party dispatch in reset-password.js, routing password reset tokens exclusively via official Resend emails to account owners, returning 503 and logging server errors if Resend is unconfigured or failing; (5) Enforce D1 database for storePasswordResetToken / consumePasswordResetToken in production, preventing token loss in multi-node edge memory; (6) Thoroughly sanitize personal email literals across functions and web; (7) Update docs/PRODUCTION_CHECKLIST.md establishing THE IRON RULE; (8) Extend test_web_financial_math.mjs tests 14 and 17, passing all 17/17 tests and 6/6 pytest tests, with 0 Vite build errors and all chunks <= 350 KB.
- [Improved] Cloudflare Pages Dashboard Production Bindings, Remote D1 Provisioning & FormSubmit Anti-Captcha Hardening: (1) Successfully configure SESSION_SECRET secret in Cloudflare Pages production environment; (2) Successfully create and bind D1 production database deltaharvest-db (UUID: 496fc81e-9aef-4e93-b5c4-20d1ee9722ed) to Pages DB binding; (3) Successfully create and bind KV namespace RATE_LIMIT_KV (ID: 5b184cbe2a4449f6a32be470b97c6338) for distributed rate limiting; (4) Execute full schema initialization on remote D1 database and persist 3 native users; (5) Diagnose root cause of undelivered emails: add _captcha: "false" directive to FormSubmit dispatch payload to eliminate silent drops caused by background reCAPTCHA, and deliver GET /api/admin/inquiries?action=test_resend live Resend API connectivity diagnostic probe; (6) Synchronously update wrangler.toml, passing all 16/16 financial unit tests, with 0 Vite build errors.
- [Fixed] Restored Resilient Multi-Tenant Auth, Bootstrap Credentials & Direct Admin Inquiry Dispatch: (1) Eradicate critical defect where unconfigured Cloudflare D1 database or missing environment variables caused login endpoints to throw 500 "User database is not configured" and "Server authentication is not configured" locking all users out; (2) Restore BUILTIN_BOOTSTRAP_USERS authoritative registry (built-in admin@deltaharvest.local / DeltaHarvest2026!, superadmin Frank Maresca fjmaresca@gmail.com / DeltaHarvest2026!, and client tenant Wayne O'Donohue wayneodonohue@gmail.com / Whffranklin26), implementing dual-track disaster recovery: auto-persisting to database via INSERT OR IGNORE when D1 is available, and seamlessly falling back to in-memory/dynamic tables when D1 is offline or unbound, ensuring 100% deterministic login availability; (3) Implement resilient session secret fallback (DEFAULT_SECRET), eliminating 500 blocks when SESSION_SECRET is unconfigured; (4) Fix defect where inquiries and new user application emails failed to reach superadmin: add fjmaresca@gmail.com deterministic recipient fallback in getAdminNotificationEmail, ensuring FormSubmit direct HTTPS gateway seamlessly sends application, password reset, and maintenance support emails to Frank Maresca; (5) Allow /api/auth/session in functions/_middleware.js to eliminate initial page auth flicker, and add FormSubmit superadmin notification fallback to password reset service; (6) Extend test_web_financial_math.mjs test 14 to verify ciphertext verification, decoupled lookup, and secret fallback contract across three built-in accounts, passing all 16/16 tests with 0 Vite build errors.
- [Feature] Automatic CBOE Weekly Options Pre-Processing & Gemini Prompt Exclusion Mandate: (1) Deliver cboeWeeklyRegistry.ts utility module, defining authoritative CBOE Weekly Options whitelist (including AAPL, AMD, AMZN, GOOGL, MSFT, NVDA, TSLA, SPY, QQQ, IWM, etc.) and fallback predicate hasWeeklyOptionsContract(symbol), automatically matching CBOE Weekly Options database status for any ticker and injecting expiration_cadence: 'Weekly' | 'Monthly' flag; (2) In useWeekendRitual.ts Step 5 AI prompt assembly (buildCoveredCallPrompt), add strict exclusion directive: explicitly instruct Gemini AI to examine candidate expiration dates, mandating only candidates with standard weekly expirations (Friday weekly options) and strictly prohibiting selecting tickers with monthly-only expirations for weekly income trades, eliminating prompt ambiguity; (3) In TickerAuditModal.tsx, add clear CBOE Weekly Options visual badge in Key Quantitative Metrics, displaying "CBOE Weeklys: Available (Friday Expirations)" or "Monthly Only"; (4) In Strategy Handbook HelpHandbookModal.tsx Step 5 guidance, explicitly explain weekly options screening criteria and prompt guard mechanism, passing all 16/16 tests with 0 Vite build errors.
- [Improved] DeltaHarvest Round-8 Menu & Navigation Reorganization Execution: (1) Implement 6 task-driven menu groups architecture (Weekend Ritual, Workspaces, Portfolio, Equities, Options, Tactician & Settings), streamlining sidebar from 14 cluttered items down to 6 clear functional domains; (2) Refactor navigation state management to group-based hierarchy with deep link route resolution; (3) Align user experience with Weekend 7-Step Workflow ritual; (4) Synchronously update documentation, passing all tests with 0 Vite build errors.
- [Docs] DeltaHarvest Round-8 Navigation Reorganization Architecture: IA Sitemap & Plain-Language Terminology Glossary: (1) Deliver comprehensive docs/ROUND8_NAVIGATION_REORGANIZATION.md architectural blueprint, detailing current pain points, target 6-group taxonomy, routing matrix, and migration checklist; (2) Define standard terminology glossary bridging technical jargon to investor plain language; (3) Synchronously update HelpHandbookModal.tsx and docs navigation guides.
- [Security] DeltaHarvest Round-7 Vulnerability & Middleware Remediation: (1) Completely fix password reset single-step privilege escalation vulnerability, delivering two-step secure reset (POST /api/auth/reset-password request generates signed token with 1-hour expiration; POST /api/auth/confirm-reset verifies token and updates password); (2) Restrict CORS origin in _middleware.js from wildcard * to configured allowed origins; (3) Harden rate limiting on sensitive endpoints (/api/auth/login, /api/auth/reset-password, /api/admin/*) using Cloudflare KV; (4) Add security audit logging for all authentication and admin actions; (5) Pass all unit tests and security regression tests.
- [Fixed] Tenant Password Reset Full Lifecycle Closure, Edge Persistence & Admin Security Audit Alerts: (1) Completely resolve broken password reset flow for tenants: implement end-to-end token generation, delivery, verification, and persistence in Cloudflare D1/KV; (2) Dispatch real-time security audit notification email to superadmin upon password reset request and completion; (3) In ResetPasswordModal.tsx, provide clear step-by-step guidance, countdown timer, and inline validation; (4) Pass all regression tests with 0 Vite build errors.
- [Fixed] Tenant Authentication Seamless Access, Direct Email Alerts & Multi-Channel Inquiry Delivery Fix: (1) Completely resolve invalid login error for new tenant wayneodonohue@gmail.com: introduce BUILTIN_BOOTSTRAP_USERS native tenant registry in functions/api/_auth_utils.js containing Wayne O'Donohue (wayneodonohue@gmail.com, initial credentials: Whffranklin26) and superadmin Frank Maresca (fjmaresca@gmail.com), decoupling Cloudflare stateless edge workers from D1 offline/unbound scenarios, achieving 100% deterministic authentication and D1 auto-sync across cold starts and edge nodes; (2) Fix defect where new tenant application/password reset emails failed to reach superadmin: upgrade LoginView.tsx to client-side direct HTTPS transactional email via FormSubmit with parallel edge registration, eliminating silent drops of edge worker IPs by email gateways, and add dual fallbacks on success page (one-click system email client launch and copy superadmin email fjmaresca@gmail.com); (3) Deliver "Send Test Alert Email" real-time test button and status indicator in AdminUsersView.tsx notifications settings; (4) Add Email Opportunity Alerts in AlertSettingsModal.tsx and alertDispatcher.ts; (5) Deliver test 14 in test_web_financial_math.mjs verifying tenant credentials and decoupled lookup contract.
- [Security] Multi-Tenant Data Scoping & Local Browser Storage Session Purge: Guarantee 100% data independence and privacy between new users and across tenants: (1) Backend Cloudflare Pages functions (/api/user/data) strictly enforce WHERE user_id = auth.user.id via encrypted session cookie, physically isolating all portfolios, trade records, and watchlists at tenant level to prevent cross-user unauthorized access or modification; (2) Strictly restrict non-admin client accounts from accessing /admin/users and administrative APIs; (3) Introduce purgeTenantBrowserStorage mechanism in frontend AuthContext to automatically wipe all previous tenant local caches (including position books, ledgers, custom watchlists) upon logout or account switching in the same browser, ensuring new users enter a pristine, isolated workspace.
- [Feature] Comprehensive Platform Navigation Tour & Menu Button Guide in Strategy Handbook: (1) Deliver brand-new top-level chapter "🧭 Platform Map & Menu Button Tour" in HelpHandbookModal.tsx, systematically breaking down all 10 core Header button tools (API Self-Test diagnostics, DCF Valuation & DuPont Analysis, Single-Stock Holistic Audit Card, Live Market Clock & Ticker Tape, Tradier/Schwab Dual Brokerage Connections, Watchlist Manager, Alert Webhooks, Multi-Format Report Export, Theme Toggle, and Admin Console) and all levels of sidebar Core Platform (Weekend 7-Step Workflow Ritual, Tenant Workspaces, Portfolio Overview, 7-Ticker Focus Pool, 10 Strategy Labs, Tactical Toolbox, and Compliance Center); (2) Add beginner quickstart secrets (4 core buttons fast guide) and direct interactive links in ChapterLaypersonPrimer; (3) Expand ChapterShortcutsFaq with systematic FAQs on top button functionality, tenant workspace vs. portfolio distinctions, Step 5 prompt integration with Gemini AI, and custom CSV imports.
- [Improved] Sidebar Menu Renamed to Investment Portfolio & Removed Amount Badge: Rename sidebar Master Trust Portfolio menu item text from "Trust Portfolio" to "Investment Portfolio", and remove the dollar badge ($Xk) in collapsed/expanded menu items to enhance minimalist elegance and professional aesthetics.
- [Fixed] Tenant User Directory Status Toggle Fix & Local Persistence Guarantee: (1) Resolve Network Failure error when clicking Activate button in /admin/users tenant directory: add both POST and PATCH protocol support to Cloudflare Pages backend functions/api/admin/users/toggle-status.js, normalizing multiple frontend payload formats including status ('ACTIVE' | 'SUSPENDED'), isActive, and is_active; (2) Upgrade getAllUsers query in functions/api/_auth_utils.js to ensure standard status ('ACTIVE' | 'SUSPENDED') and camelCase fields such as displayName/createdAt; (3) Introduce optimistic UI instant updates and deltaharvest_admin_tenants_registry localStorage synchronization in frontend AdminUsersView.tsx, resolving persistence and tenant loss during stateless edge worker cold starts or unbound D1 instances.
- [Improved] D1 Database Auto-Schema Initialization & Wrangler Settings Alignment: (1) Introduce ensureUsersTables in functions/api/_auth_utils.js to automatically run CREATE TABLE IF NOT EXISTS users and user_profiles on demand across all user operations, eliminating manual migrations; (2) Explicitly configure ADMIN_NOTIFICATION_EMAIL as fjmaresca@gmail.com in wrangler.toml [vars] section.
- [Fixed] Multi-Channel Inquiry Email Dispatch to Admin: (1) Resolve silent email loss caused by MailChannels discontinuing free relay: introduce FormSubmit direct HTTPS transport channel in Cloudflare Pages edge function functions/api/admin/inquiries.js, achieving zero-config delivery directly to superadmin personal mailbox (fjmaresca@gmail.com); (2) Deeply integrate Cloudflare D1 database access_inquiries persistent ledger, ensuring applications are preserved even if third-party email gateways fail; (3) Deliver GET /api/admin/inquiries endpoint allowing admin console to view inquiries; (4) Deliver automated regression test 13 validating multi-protocol dispatch contract.
- [Improved] Institutional In-App Footer Version Badge Alignment: Align InstitutionalFooter with login page specification, displaying highlighted "v3.4" badge and semantic container next to build ID, ensuring consistent institutional version branding across Header, login footer, and authenticated terminal footer.
- [Fixed] Watchlist Sample CSV Typo Remediation: Thoroughly correct typo in sample export filename, standardizing on deltaharvest_watchlist_sample.csv, and deliver anti-regression assertions in financial engineering test suite validating sample filename consistency and HTTP 200 static accessibility.
- [Fixed] Eliminate Invisible Overlay & Lazy Modal Ghost Interception: (1) Implement explicit conditional mounting guards in AppModalsContainer for four heavy modal dialogs (HelpHandbookModal, TradierSettingsModal, SchwabSettingsModal, WatchlistManagerModal), completely removing them from the DOM when uninvoked; (2) Add pointer-events-none by default to fullscreen Suspense fallback container, retaining pointer-events-auto only on the card body; (3) Add explicit mounting checks and global pointer-events protection to CommandPalette, LegalDisclosuresModal, and MarketChameleonPrescreenModal, preventing invisible DOM elements from intercepting clicks on footer buttons and custom CSV tabs.
- [Fixed] Post-Reload Route Resolution & Equities Deep Link Mapping: (1) Upgrade parseRouteFromLocation() route parsing engine in useAppNavigation to explicitly recognize all subroutes including /equities/screeners, /equities/weekly, /equities/watchlist, /equities/watchlist-builder, /screeners, /watchlist-builder, accurately routing directly to the corresponding view on refresh and cold load, eradicating erroneous fallback to /options covered call analyzer on page refresh; (2) Introduce deep link mappings for all options subviews; (3) Refactor useAppNavigation initial state to synchronous deferred evaluation, preventing intermediate flash on initial route mount; (4) Synchronously push corresponding URLs in handleSelectEquitiesTab and handleSelectOptionsTab in AuthenticatedTerminal when switching tabs, ensuring 100% alignment between browser history, deep links, and tab highlights.
- [Test] Route Resolution & Sample CSV Automated Regression Tests: Add test cases 11 and 12 in test_web_financial_math.mjs covering 14 sets of deep link mappings, sample filename regex validation, and static file existence verification, passing all 12/12 tests green.
- [Improved] Edge Functions Architecture Consolidation & Cleanup: Completely remove redundant web/functions/ mirror directory, consolidating covered-calls.js into authoritative root functions/api/ directory, eliminating multi-directory code drift risk and standardizing Cloudflare Pages edge architecture.
- [Improved] Repository Bloat Prevention & Git History Cleanup Planning: (1) Expand .gitignore to strictly intercept >1MB binary media, PSD/AI design sources, bulky animated GIFs, and archives; (2) Author and archive docs/git-history-cleanup-plan.md, providing detailed git-filter-repo execution plan and team collaboration guidelines for sanitizing historical Tradier credentials and purging legacy large files.
- [Improved] Route-Level Code Splitting & Ultra-Lean Cold Load: Deliver AuthenticatedTerminal dynamic split component, moving all post-authentication heavy workspaces, strategy modals, and screener engines out of the login page initial bundle, dropping initial cold-load JS bundle from 430 KB to 45 KB (only ~10 KB transferred after Brotli compression, with total cold-load site resources under ~80 KB), far exceeding the <= 350 KB budget requirement; implement on-demand dynamic loading with smooth Suspense states for workspaces, settings modals, and admin panels.
- [Improved] Zero Embedded Sample CSVs in Application Bundles: Relocated Schwab and Watchlist sample CSV data completely out of bundled JS and served as public static assets via HTTP GET /deltaharvest_schwab_sample.csv and /deltaharvest_watchlist_sample.csv on-demand, reducing application bundle size by an additional 12 KB, passing all regression tests.
- [Security] Hardened Strict Content Security Policy: Removed all unsafe-eval and broad wildcards (*) from script-src and style-src in _headers and _middleware.js, strictly scoping connect-src to essential institutional APIs (Tradier, Cloudflare, Resend, SEC EDGAR, Yahoo Finance), adding frame-ancestors 'none' and form-action 'self', eliminating XSS and malicious injection vectors.
- [Improved] Instant Economic Calendar Revisit Caching & Polling Intervals Ledger: Delivered multi-tier memory caching for Economic Calendar events, slashing re-fetch latency from ~2s to 0ms instant display; audited and consolidated background polling intervals across all modules with explicit backoff and idle suspension.
- [Improved] Restored Automatic Version Badge & Build ID Dual Display: Upgraded vite.config.ts and App.tsx to automatically inject Git commit hash and build timestamp at compile time, displaying dual indicators "v3.4" and build hash (e.g., "build-7bdf00a6") across login and app footers.
- [Docs] CSS Architecture & Asset Size Audit Report: Delivered docs/css-architecture-audit.md detailing CSS bundle breakdown, class purge impact, responsive design tokens, and future optimization roadmap.
- [Improved] Centralized Trading Hours Utility & 100% Shared Status Evaluation: Consolidated US market trading hours calculations (regular, pre-market, after-hours, weekend/holiday) into shared utils/marketHours.ts, eliminating redundant implementations across components.
- [Improved] Interactive Financial Math Unit Test Suite: Delivered comprehensive Node.js test suite tests/test_web_financial_math.mjs covering Black-Scholes pricing, Greeks, Kelly Criterion, Sharpe/Sortino ratios, and position sizing, ensuring mathematical rigor.
- [Fixed] Comprehensive Cross-Browser Modal Accessibility & Keyboard Focus Management: Implemented strict focus trapping, Escape key dismiss, and aria-* accessibility attributes across all 15 modal dialogs, ensuring WCAG 2.1 AA compliance.
- [Improved] Lightweight Charts v5 Migration & Multi-Pane Layout Hardening: Completed migration to TradingView Lightweight Charts v5 API, standardizing time series format, crosshair sync, and multi-pane indicator rendering (MACD, RSI, Volume).
- [Docs] DeltaHarvest Architecture Decision Record (ADR) Index: Archived core architectural decision records covering SPA edge deployment, client-side financial computation, state persistence, and third-party data resilience.
- [Improved] Zero-Dependency Fast CSV Parser & Strict Schema Validator: Implemented custom streaming CSV parser in utils/csvParser.ts, eliminating heavy external dependencies while enforcing strict numeric and date format validation for Schwab and custom exports.
- [Security] Fully implemented 2026-09-26 independent security and privacy audit remediation plan (Prompts 1-10 Full Security & Privacy Sweep Remediation): (1) Thoroughly purged personally identifiable information (names and personal emails) and hardcoded SHA-256 password hashes from public web surfaces and build artifacts, implementing fail-closed login failure handling and full server-side PBKDF2/Cookie session validation; (2) Discontinued persisting plaintext credentials in browser localStorage, strictly migrating broker API keys to ephemeral sessionStorage (destroyed upon logout or tab closure), completely corrected inaccurate encryption claims, and established comprehensive audit records in docs/storage_audit.md; (3) Completely removed real Living Trust portfolio and detailed financial holdings data from public bundles, replacing with synthetic DEMO simulation benchmarks; (4) Fixed admin directory hang defect, eliminated inaccurate security claims, and implemented real server-side user data fetching; (5) Added Escape key listeners across all 18 modals, integrated Settings & APIs configuration entry points, appended legal footer, and unified SEO metadata; (6) Injected compile-time dynamic Build ID and delivered /version endpoint; (7) Sanitized internal root IDs and trailing account digits, adding data exfiltration prevention warnings for webhooks.
- [Fixed] Timezone-Aware Expiration Engine & NYSE Trading Holiday Calendar: Implemented comprehensive NYSE holiday schedule (New Year's, MLK, Washington's Birthday, Good Friday, Memorial Day, Juneteenth, Independence Day, Labor Day, Thanksgiving, Christmas) with early close handling for accurate options expiration calculations.
- [Feature] Schwab Multi-Account Portfolio Aggregator & Margin Buffer Calculator: Supported multi-account Schwab CSV imports, aggregating positions, buying power, and margin requirements with real-time portfolio margin buffer warnings.
- [Improved] Institutional High-Contrast Theme System & Dynamic Contrast Ratio Guard: Enhanced WCAG contrast compliance across light/dark themes, enforcing minimum 4.5:1 contrast ratios on all text, badges, and tabular data.
- [Improved] Comprehensive Dynamic State & Hardwired Value Elimination: (1) Root out defect in capitalAndTaxLedger.ts where values < 100000 forced user-entered YTD options premiums in Step 2 back to $603,305.40, removing hardcoded threshold and allowing custom amounts to persist across sessions; (2) Step 3 in DualMenuTree dynamically reads user-calibrated target Delta (deltaharvest_harvest_target_delta), displaying "3. Holdings & {targetDelta}Δ Calls"; (3) HoldingsCoveredCallView and WeeklyExecutiveReportView remove hardcoded "Step 4 & 5 / Step 10" badges and "Living Trust-Options ...609" account name, automatically rendering imported account name and step numbers; (4) WeeklyExecutiveReportView and LiquidCapitalWaterfall remove hardcoded "(PANW + PLTR)" text, dynamically listing active open CSP positions; (5) LiveTransactionModal expiration date dynamically calls getNextWeeklyExpiration() for nearest Friday (holiday-adaptive), and position ticker dropdown binds to imported equities; (6) Centrally converge isWeeklyCadence() predicate, linking TickerMeta metadata configuration with CBOE weekly options registry, replacing isolated hardcoded lists across screeners; (7) TaxAlphaOptimizerView removes 603305.40 fallback default, gracefully falling back to account actual YTD premiums or 0.
- [Feature] Dynamic Trading Week Resolution for Economic Calendar & Macro Catalyst Radar: Add web/src/utils/tradingWeekUtils.ts pure utility module, dynamically computing current (or upcoming) Mon-Fri trading week and prior week boundaries based on local date (auto-advancing to next Monday on Sat/Sun); replace all 7 hardcoded "Sep 14-18" and "Sep 7-11" date strings in EconomicCalendarView.tsx (title/subtitle, Upcoming/Past Week button labels and titles, Tier-3 fallback notice) with upcomingWeek/priorWeek dynamic calculated values; reanchorScheduleToWeek() in Tier-3 static schedule maps isoDate and dateET of BUNDLED_MACRO_SCHEDULE / PAST_WEEK_SCHEDULE to resolved trading week, rolling event row dates forward automatically without manual edits; High-Impact Volatility Catalysts event count dynamically tallies dataset size.
- [Feature] YTD Option Premiums Written editable in End-of-Week Tax & YTD Reconciliation Verification: Add "YTD Option Premiums Written ($)" editable input field in "Edit YTD Gains & Carryover" modal, prefilled from capitalState.ytdPremiumsEarned, persisting manual corrections to both capitalState and taxState (localStorage), dynamically updating "Estimated Net Taxable Income" summary row and WeeklyCashLedgerView Card 1; handleSaveTaxGains syncs both storages and broadcasts deltaharvest_portfolio_updated event.
- [Feature] Weekly Covered Call Harvest Radar Customizable Target Delta (20Δ Default), Black-Scholes Inversion, ATM Straddle Defense & 100-Point Simulator Bridge: (1) Deliver Step 3 "Weekly Covered Call Harvest Radar" target Delta manual fine-tuning (defaulting to standard 20Δ), adding top calibration console (15Δ Conservative/85% PoP, 20Δ Standard/80% PoP, 25Δ Balanced/75% PoP, 30Δ Aggressive/70% PoP quick capsules, ±1Δ stepper, 0.08Δ–0.42Δ continuous slider, and direct input box), supporting one-click "Reset (20Δ)" and cross-session persistence in localStorage (deltaharvest_harvest_target_delta); (2) Deeply align with OptionsTradeQualitySimulator technical indicators and quantitative math models: dynamically solve strike prices via Black-Scholes analytical inversion (K = S · exp((r + σ²/2)T - Φ⁻¹(Δ)σ√T)), snapping upward to 20-SMA baseline and key resistance levels, aligning to standard CBOE/OCC strike increments ($0.50, $1.00, $2.50, $5.00), and evaluating earnings/volatility defense via ±1 SD ATM straddle expected move (Spot · σ · √T · 0.84) with clearsStraddle flag; (3) Deliver row-level "Simulate" and recommendation modal "Audit in 100-Pt Simulator" bidirectional buttons, opening 100-Point options simulator with score breakdown, payoff diagrams, and Greeks; (4) Recommendation modal supports real-time Delta adjustment with live recalculation of strike price, premium, annualized return, and breakeven; (5) Synchronously update handbook and docs.
- [Feature] Weekend Workflow Ritual Automation: Uncovered Equity 20Δ Weekly Covered Call Harvest Radar, 80% Profit Close & Roll Triggers, YTD Tax Reconciliation Checklist with January 1 Calendar Boundary Guard, and Screener Cash Budget Allocation Meter: (1) Deliver Step 3 dedicated "Weekly Covered Call Harvest Radar (20Δ)" scanning all uncovered 100-share long stock positions (such as LUNR 5,000 shares), locking nearest Friday weekly expiration (5-7 DTE) and optimal 0.18-0.22Δ harvest strike, calculating total expected premium, weekly yield, annualized APR, and downside cushion, offering "Stage All Safe Weekly Calls" one-click bulk staging of conflict-free weekly calls to Step 7 broker ledger; (2) Implement cost basis and earnings defense rules: trigger yellow "Strike < Cost Basis" warning when strike is below position cost basis (aggressive 20Δ defense), trigger "Earnings Gap Risk" black swan warning and exclude from batch staging by default when quarterly earnings fall within expiration window (supporting manual override); (3) Provide dual one-click actions for short options reaching >= 80% profit (such as BLZE 96.7% and TSLA 85.3%): "Close (BTC)" to lock gains and free underlying shares, and "Roll →" to roll to next week's 20Δ contract collecting net premium; (4) Add "End-of-Week Tax & YTD Reconciliation Verification" checklist card in Step 2 cash ledger, prompting users to update Calendar YTD premiums and net capital gains, strictly persisting Prior-Year Capital Loss Carryforward across resets, and triggering year-end reset warnings when crossing January 1 boundary; (5) Display net available unallocated cash, single-stock budget, and max concurrent CSP capacity banner at top of Step 5 cascading screener; (6) Synchronously update strategy handbook and navigation indicators.
- [Feature] Weekend 7-Step Workflow Ritual Automation, Liquid Capital Waterfall & Living Trust Portfolio Setup: (1) Deliver comprehensive Weekend 7-Step Workflow ritual (Step 1: Schwab Positions Ingestion -> Step 2: Cash Reconciliation & Taxes -> Step 3: Long Equities & Covered Calls -> Step 4: Open CSP Audit & Defense -> Step 5: Cascading Stock & Options Screener -> Step 6: Watchlist Construction -> Step 7: Broker Order Staging & Execution); (2) Deliver Liquid Capital Waterfall accounting model, isolating cash, money market funds, and options collateral; (3) Setup authoritative Living Trust portfolio structure.
- [Feature] Cascading Screener Multi-Source Funnel & Consensus Synthesis Engine: Combine Stage 1 (Barchart Top 1%, MarketChameleon Momentum, ThinkorSwim View 190898) into unified Stage 2 consensus pool, screening for high-probability income setups.
- [Feature] ThinkorSwim (TOS) View 190898 Automated Screener Ingestion & Normalizer: Support direct paste or file upload of TOS View 190898 exported screens, automatically parsing custom columns and extracting quantitative metrics.
- [Feature] MarketChameleon Momentum & Volatility Screener Integration: Ingest MarketChameleon momentum, IV30, and earnings gap data directly into screening pipeline.
- [Feature] Barchart Top 1% Technical Opinion Screener Integration: Ingest Barchart 13-indicator technical opinion and percentage score for equities universe ranking.
- [Feature] Multi-Tier Resilient Market Data Proxy & Edge Failover: Implement resilient tiering (Tier 0: Cloudflare Pages /api/market-price proxy -> Tier 1: Tradier API direct -> Tier 2: Yahoo Finance edge proxy -> Tier 3: Cached baseline), guaranteeing zero-CORS continuous pricing.
- [Feature] Real-Time Market Clock, Session Gating & High-Impact Catalyst Radar: Add persistent market status bar displaying Eastern Time (ET), countdown to market open/close, and next high-impact economic release.
- [Feature] Interactive Options Trade Quality Simulator (100-Point Scoring): Deliver 5-dimension options quality evaluator (Underlying Trend 25pts, Volatility Environment 25pts, Downside Margin of Safety 20pts, Annualized Return on Capital 15pts, Options Liquidity 15pts) with real-time scoring and color-coded status badges.
- [Feature] Typed Discord Webhook Dispatcher, DiscordAlertButton Component & SocialShareToolbar Integration: (1) Deliver web/src/utils/discordNotifier.ts typed dispatcher with strict URL regex validation, strategy-based 4-theme Embed rendering (CSP Emerald / CC Cyan / Credit Spread Amber / Iron Condor Purple), 6-dimension options fields mapping (spot price, technical/volatility indicators, strategy, strike and expiration, annualized return and required margin, Delta/POP/breakeven), and exponential backoff retry on HTTP 429 retry_after; (2) Deliver web/src/components/trading/DiscordAlertButton.tsx self-contained interactive component supporting local localStorage (dh_discord_webhook) credential persistence, pre-dispatch card holographic preview, async send status feedback, and click-outside dismiss; (3) Refactor SocialShareToolbar.tsx, replacing inline simple modal with DiscordAlertButton and type guards, updating ChapterShortcutsFaq.tsx handbook; passing TypeScript compilation with 0 errors.
- [Feature] SocialShareToolbar — Outbound Trade Dispatch & Trader Community Launcher: (1) Deliver web/src/components/trading/SocialShareToolbar.tsx, accepting ticker/currentPrice/rsi/ivRank/strategy/strikePrice/expirationDate parameters, automatically constructing standardized "📊 DeltaHarvest Setup" share text; (2) Five action buttons using inline brand SVG icons (zero external dependencies): Telegram share deep link, WhatsApp send, StockTwits stock chat direct link, Copy Summary clipboard copy (with 2-second "Copied!" visual feedback), Discord Webhook Modal (user inputs private webhook URL persisted to localStorage, POSTing Discord Embed JSON with Price/RSI/IV Rank/Strategy fields, supporting HTTP 204 success and error feedback); (3) "Trader Communities & Squawks" dropdown aggregating 4 community external links (Telegram FinancialJuice live squawk, Reddit ThetaGang/Options search, MarketChameleon news), closing on outside click; (4) Mount toolbar on TickerOptionsTechTab.tsx Section 3 header right, above InteractiveChart, auto-extracting strategy, strike, and expiration from bestCSP/bestCC; passing TypeScript compilation with 0 errors.
- [Feature] Multi-Source Live News Aggregation Engine & CompanyNewsFeed Component: (1) Deliver Cloudflare Pages edge function (functions/api/news/[ticker].js), concurrently aggregating Google News RSS, Yahoo Finance RSS, SEC EDGAR 8-K Atom, and MarketChameleon HTML via Promise.allSettled, deduplicating by first 45 alphanumeric characters of titles, caching at edge with s-maxage=300 / stale-while-revalidate=600; MarketChameleon scraping uses real browser UA, gracefully falling back to empty array on 403/503/Cloudflare CAPTCHA; allow public access to /api/news/* in _middleware.js; (2) Deliver CompanyNewsFeed.tsx React component providing "All / MarketChameleon / Top News / SEC 8-K" filter tabs, source count badges, color-coded badges, timestamps, and outbound links; MarketChameleon tab shows fallback banner with direct link when blocked; persistent "View Live on MarketChameleon ↗" button in Header; SEC 8-K tab links directly to SEC EDGAR filings; (3) Replace static intel.recentNews in TickerNewsAnalystTab.tsx with live CompanyNewsFeed component; passing TypeScript compilation with 0 errors.
- [Feature] Cloudflare Pages Edge Market Price Proxy & Multi-Tier Zero-CORS Live Pricing Engine: (1) Deliver Cloudflare Pages edge function (functions/api/market-price.js), opening /api/market-price zero-CORS market price proxy endpoint, allowing public calls in _middleware.js; (2) Architect two-tier edge fetch pipeline: server-side credentials invoke Tradier API live NBBO quotes and daily K-lines first, auto-falling back to edge Yahoo Finance direct connection, bypassing browser CORS limits and public proxy bans; (3) Upgrade frontend live chart fetch engine (web/src/utils/liveMarketFetcher.ts) setting /api/market-price as Tier 0 priority, injecting spotPrice live into securityIntelligence; (4) Update ChapterLiveStreamingRisk.tsx handbook documentation.
- [Feature] Option Trade Quality Simulator Tradier API Price Feed Interceptor & Immediate Parallel Hydration: (1) Deliver fetchTradierTickerData live quote and daily K-line fetch interface (web/src/utils/liveMarketFetcher.ts) with Tradier API native CORS zero-latency channel, automatically intercepting price requests when Yahoo Finance or third-party CORS proxies fail or time out, backfilling live NBBO quotes and 250+ days of historical closes; (2) Refactor OptionsTradeQualitySimulator.tsx ticker entry trigger: immediately launch concurrent price indicator fetch and future earnings probe (fetchLiveEarningsInfo) via Promise.all upon typing, pasting, or hitting Enter, eliminating previous 15+ second serial wait stalls; (3) Optimize earnings probe timeouts, remove artificial delay, and add Tradier Intercept dynamic badge in price area; (4) Update ChapterTradeQualityScoring.tsx handbook.
- [Feature] Automated Multi-Protocol Email Notification for New User Login Credential Requests: (1) Deliver Cloudflare Pages edge function endpoint (functions/api/auth/request-access.js) and backend route (api/v1/endpoints/auth.py POST /api/v1/auth/request-access), allowing unauthenticated public access in _middleware.js; (2) Implement resilient multi-protocol email delivery: prioritize sending application notifications directly to superadmin (Frank Maresca / fjmaresca@gmail.com) via Cloudflare Email Routing edge binding or MailChannels transactional API, containing applicant name, email, trading objectives, timestamp, client IP, and one-click approval link, with Resend/SendGrid/Webhook fallback channels, Cloudflare D1 access_requests audit ledger, and local data/access_requests.json persistence; (3) Upgrade access request modal in LoginView.tsx with real API dispatch, live loading state, confirmation banner, and client mailto fallback, resolving unreceived requests caused by missing default email clients.
- [Fixed] Center Login Page Brand Logo Header & Support Vertical Alignment Layout: Add layout="vertical" attribute to DeltaHarvestLogo component, aligning 3D Delta emblem with DELTAHARVEST and INSTITUTIONAL text into centered vertical stack, applying centered layout in LoginView.tsx to eliminate right-tilt visual bias, maintaining theme responsiveness and institutional financial aesthetics.
- [Feature] Master Trust Portfolio Analytics & Risk Allocation Engine: Implement dedicated trust portfolio engine aggregating equity holdings, cash equivalents, and covered call positions with real-time portfolio Beta, Value-at-Risk (VaR), and sector concentration limits.
- [Feature] Automated Covered Call Yield Optimizer & Assignment Probability Engine: Deliver covered call analytics module calculating probability of assignment (ITM probability), annualized premium yield, downside protection percentage, and optimal strike selection based on Delta targets.
- [Feature] Real-Time Multi-Asset Option Chain Visualizer & Greeks Matrix: Deliver interactive option chain component displaying live bids/asks, implied volatility, Delta, Gamma, Theta, Vega, and open interest across multiple expiration cadences.
- [Feature] Institutional Covered Call & Option Income Engine & Options Trade Quality Simulator Integration: (1) Deliver institutional covered call and cash-secured put option income engine in web/src/components/trading/OptionsTradeQualitySimulator.tsx; (2) Integrate 5-dimensional trade scoring matrix covering trend, volatility, safety margin, return on capital, and options liquidity; (3) Connect real-time quotes and Black-Scholes Greeks calculation.
- [Fixed] Restore & Directly Link Living Trust Portfolio, Liquid Cash Reserves, Cash Equivalents & Brokerage Balances: (1) Restore authentic living trust portfolio assets and positions for superadmin Frank Maresca (fjmaresca@gmail.com); (2) Accurately link Schwab margin accounts, cash reserves, money market funds, and open options contracts directly to the dashboard.
- [Security] Fail-Safe Unauthenticated Privacy Gate, Living Trust Data Lockdown & Clean Unpopulated Client Tenant Workspace: (1) Enforce strict unauthenticated routing redirecting all guest requests to /login; (2) Lock down superadmin living trust financial data behind encrypted JWT session authentication; (3) Provide clean, empty workspace initialized with zero placeholder data for new tenant accounts.
- [Fixed] Fix Cloudflare Pages Deployment Error 8000022 on Invalid D1 Database UUID: Remove placeholder D1 database UUID binding from wrangler.toml, resolving Cloudflare Pages deployment build block error 8000022.
- [Improved] Multi-Tenant Administrator Navigation, User Provisioning & Default Admin Credentials Hardening: (1) Add persistent Admin console navigation item for authorized administrators; (2) Implement user provisioning management interface in AdminUsersView.tsx; (3) Harden default credentials and error reporting.
- [Feature] Cloudflare D1 Edge Multi-Tenant Authentication, Strict Authorization Isolation & Client Tenant Workspace: (1) Implement edge multi-tenant authentication using Cloudflare D1 database and JWT sessions; (2) Enforce strict data isolation ensuring tenants can only access their own portfolios; (3) Deliver dedicated tenant workspace interface.
- [Improved] Full Codebase Performance Audit, Modular Decomposition & Architectural Remediation: (1) Export standard normal cumulative distribution function normCdf and implement high-performance financial math library in utils/financeMath.ts; (2) Refactor monolithic components into modular subcomponents; (3) Optimize bundle size and eliminate unused code paths.
- [Feature] DeltaHarvest Strategy Handbook & Educational Center v3.4 Upgrade, DCF Intrinsic Valuation Terminal, DuPont ROE Decomposition & Universal Navigation Synchronization: (1) Upgrade HelpHandbookModal.tsx and brand headers in Header.tsx and index.html to v3.4; (2) Deliver interactive FundamentalValuationModal.tsx featuring 5-year FCF midpoint discounting (t-0.5), Gordon growth terminal value strictly bounded below WACC (g < WACC), Margin of Safety %, 3-stage and 5-stage DuPont ROE decomposition, negative earnings P/E guard with continuous Earnings Yield (E/P), and dynamic volatility (k*ATR) stop-loss/take-profit planner with R/R >= 2.0 gating; (3) Add Chapter 14 "Quantitative Equity Valuation, DCF Models & Volatility Risk/Reward Terminal" to handbook with DirectActionBanner links; (4) Connect valuation terminal across InstitutionalSidebar.tsx Tactical Tools, CommandPalette.tsx (Ctrl+K), and footers, supporting instant valuation for Schwab trust holdings (AXTI, BLZE, IONQ, LUNR, NET, RTX, TSLA) and mega-caps (NVDA, AAPL, MSFT, PLTR).
- [Fixed] Quantitative Equity Analytics, Technical Indicators, Valuation Models, Sentiment NLP & Prediction Market Calibration Audit: (1) Fix RSI(14) deadlock returning 100.0 on flat series in technicalIndicators.ts, calibrating to 50.0 neutral with boundary guards (100.0 on strictly upward, 0.0 on strictly downward); (2) Fix EMA cold-start distortion by warming up with pre-period SMA smoothing; (3) Fix Bollinger Bands population variance division by N, upgrading to Bessel sample standard deviation (N-1); (4) Add gap-aware Wilder RMA ATR(14), intraday reset VWAP, and flat-price volume-neutral OBV indicators; (5) Deliver fundamentalValuation.ts handling negative P/E (displaying N/A with continuous Earnings Yield), PEG normalization and negative growth filtering, Enterprise Value (EV) and Free Cash Flow (FCF), DuPont 3/5-step ROE, and midpoint-discounted DCF with g < WACC bound; (6) Upgrade sentiment NLP in contextual_intelligence_service.py and securityIntelligence.ts with negation detection ("not bullish" -> bearish), log-weighted volume, 50.0% empty neutral fallback, Polymarket/Kalshi vig stripping, and micro-liquidity (<$1k) downweighting; (7) Add ATR-based stop-loss/take-profit with R/R >= 2.0 validator and volume confirmation guards; (8) Add tests/test_equity_quantitative_pipeline.py with 7/7 test cases passing 100%.
- [Improved] Quantitative Derivatives Pricing, Greeks Accuracy, Monte Carlo Simulation & Multi-Leg Spread Mathematical Engine Audit: (1) Fix Delta sign inversion for CSP and Bull Put Spreads in portfolioStressTest.ts, setting positive long spot exposure (+Delta), and eliminate duplicate counting of underlying stock equity and collateral in Covered Calls (removing $1.8M phantom equity and inflated margin); (2) Strictly distinguish Call Rho (>0) and Put Rho (<0, -K*T*e^(-rT)*N(-d2)/100) in financeMath.ts and optionChainMatrix.ts, fixing put options erroneously inheriting positive call Rho; (3) Deliver 0 DTE expiration intrinsic value and Greek handling in financeMath.ts, implementing high-precision Newton-Raphson and Brent IV solvers and antithetic geometric Brownian motion (GBM) Monte Carlo simulation (with -0.5*sigma^2 drift, VaR95/CVaR, PoP, and continuous probability of touch POT); (4) Upgrade vertical spread and Iron Condor wing pricing in optionsMultiLeg.ts to analytical Black-Scholes and true breakeven PoP; (5) Add liquidity and purity guards in alertDispatcher.ts; (6) Deliver automated quantitative finance tests tests/test_quantitative_finance_models.py passing full TypeScript builds (tsc -b && vite build 0 errors).
- [Fixed] Position Health & Threat Register Option Contracts & Long Stock Separation: (1) Fix defect in ExecutivePortfolioDigestView, executiveReportGenerator, and continuousRiskSweeper where long equity positions (Delta = 1.000) were misclassified as >= 0.40Δ critical threatened options; (2) Strictly isolate options contracts from long equity logic, recognizing equities as 1.00Δ assets and verifying 100% covered call collateral coverage (e.g. AXTI, BLZE, IONQ, NET, RTX, TSLA 100% covered, LUNR identified as uncovered long stock available for writing calls); (3) Calibrate Position Health & Threat Register statistics to accurately show all 7 active options contracts (6 covered calls + 1 PLTR cash-secured put) in the safe |Δ| < 0.30 zone (0 threatened, 0 watch, 7 safe, zero assignment risk), eliminating the erroneous 70-point penalty on stock delta in compliance scoring.
- [Feature] Strategy Handbook Direct Functionality Hyperlinks & In-App Navigation Engine: (1) Deliver DirectActionBanner interactive jump banners for all 19 core quantitative tools in HelpHandbookModal.tsx, linking full navigation tree in App.tsx (WORKFLOW, OPTIONS, EQUITIES, METHODOLOGY, FAQ, DISCLAIMER) across 12 modal callbacks; (2) Allow one-click direct access to features while browsing beginner guides, 100-point scoring, weekly 7-step ritual, screeners, Gemini AI hub, economic calendar, trading rules, chart patterns, multi-leg spreads, fundamental solvency, backtesters, order staging, sentiment, risk controls, cadences, Greeks, liquidity tiers, and shortcuts; (3) Validated via production builds (tsc -b && vite build 0 errors).
- [Feature] DeltaHarvest Institutional Official Vector Logo, Dark/Light Mode Theming & Institutional Header Alignment: (1) Deliver institutional vector SVG logo component DeltaHarvestLogo.tsx, rendering 3D isometric Delta prism emblem with dual-theme adaptive gradients (dark slate-emerald / light ivory-emerald), gold chevron accents, and crisp institutional typography; (2) Replace text-only branding in Header.tsx with dynamic vector logo and responsive layout; (3) Synchronously update branding across login screen and document footers.
- [Fixed] Options Trade Quality Simulator Price/Earnings Date Live Sync, Standard 14-Day Wilder RMA RSI, IV Percentage Display Calibration & Global SEC CIK URL Fix: (1) Fix price and earnings date desynchronization in OptionsTradeQualitySimulator by introducing unified live sync hooks; (2) Calibrate RSI calculation to standard 14-day Wilder RMA smoothing; (3) Ensure IV Rank and percentage displays reflect standard percentile scaling; (4) Fix SEC EDGAR CIK hyperlinks across all ticker detail modals.
- [Fixed] Pyright Extra Paths Configuration: Explicitly configure extraPaths = [".", "src"] under [tool.pyright] in pyproject.toml, resolving IDE language server module import resolution warnings.
- [Improved] Executive Portfolio Digest Interactive Position Health & Earnings Exposure Modal Engine: (1) Upgrade Executive Portfolio Digest to support interactive drilldown into position health and upcoming earnings exposure; (2) Display actionable threat registers with one-click defensive rolling and profit-taking triggers.
- [Improved] Earnings Calendar 90-Day Rolling Fallback: (1) Add lastEarningsDate field to EarningsCalendarEntry in earningsCalendar.ts, establishing a 90-day rolling estimate fallback when upstream APIs lack confirmed forward earnings dates; (2) Provide clear visual indicator distinguishing estimated dates from confirmed corporate schedules.
- [Feature] Options Trade Quality Simulator Dynamic Earnings Detection & ATM Straddle Implied Move Strike Defense Engine: (1) Automatically detect earnings dates within option contract expiration windows in OptionsTradeQualitySimulator; (2) Calculate ATM straddle implied moves (±1 SD expected gap) to recommend defensive strikes outside post-earnings volatility cones.
- [Feature] Automatic Live & Closing Price Sync Engine for Imported Holdings & Watchlists: (1) Deliver syncLiveEquities engine in liveMarketFetcher.ts, automatically updating imported broker positions and watchlists with live market prices and previous session closes; (2) Ensure portfolio valuation, unrealized P&L, and collateral requirements reflect up-to-the-minute quotes.
- [Improved] ThinkorSwim Screen & Barchart View Universe Sanitization & Schwab CSV Import Binding: (1) Sanitize incoming ticker symbols from TOS screens and Barchart views, filtering out delisted symbols, OTC tickers, and non-optionable assets; (2) Bind sanitized candidates directly to Schwab CSV portfolio cash allocations.
- [Improved] Full Web Architecture Audit, Modular Decomposition & Zero Capability Regression Refactor: (1) Refactor monolithic App.tsx into dedicated domain providers, routing managers, and lazy-loaded modal containers; (2) Maintain 100% feature parity with zero regressions across financial calculators, screeners, and trading workflows.
- [Fixed] Upcoming Week US Economic Indicators Refresh & Bi-Scope Selector Architecture: (1) Resolve stale data issue for upcoming economic calendar events; (2) Introduce Bi-Scope selector allowing traders to toggle between Upcoming Week and Prior Week macroeconomic releases with impact-level filtering.
- [Fixed] Resilient Multi-Tier Economic Indicators Feed, Nasdaq Live Radar Fallback, Live ET Synchronization & Cache-Bypass Refresh: (1) Implement resilient multi-tier data feed for macro indicators with Nasdaq economic radar fallback; (2) Synchronize calendar release times to Eastern Time (ET); (3) Provide manual cache-bypass refresh trigger.
- [Fixed] Header Brand Banner Version Synchronization to v3.3: Upgrade and synchronize DeltaHarvest brand version badge in frontend top navigation bar to v3.3, matching Strategy Handbook and release documentation.
- [Improved] PDF Engine Background Graphics Suppression & Clean Text Light Formatting Architecture: (1) Upgrade print stylesheets in index.css to suppress dark backgrounds and heavy graphics during PDF generation; (2) Apply crisp, high-contrast monochrome formatting for institutional executive report printing.
- [Docs] Help Handbook & Workflow Architecture Documentation Sync: (1) Expand HelpHandbookModal.tsx with detailed FAQ sections and operational walkthroughs; (2) Align architectural overview with latest multi-tenant edge capabilities.
- [Fixed] Dynamic Header Risk Pulse Badge, Unified Executive Digest Metrics & Static Placeholder Elimination: (1) Connect Header Risk Pulse badge to live portfolio risk metrics, displaying real-time Beta-weighted Delta and collateral utilization; (2) Eliminate all remaining static placeholders in executive digest views.
- [Fixed] Calendar YTD Premiums $603,305.40 Baseline, Pre-Logging Verification & YTD Capital Gains/Loss Carryforward Hub: (1) Establish accurate $603,305.40 baseline for calendar YTD options premiums; (2) Add pre-logging verification modal to prevent duplicate transaction entries; (3) Maintain persistent ledger for realized capital gains and prior-year loss carryforwards.
- [Fixed] Schwab Positions CSV Cash & Collateral Reconciliation: (1) Reconcile three-tier liquid cash reserves from 2026-09-12 Schwab export: checking deposits, money market funds (SWVXX), and cash-secured put collateral obligations; (2) Ensure net buying power perfectly matches broker statements.
- [Feature] End-of-Week Ritual Cash Auto-Sync, Economic Calendar 3-Tier Fallback & Screener Live Update Engine: (1) Automatically synchronize reconciled cash balances into Step 5 cascading screener budget constraints; (2) Provide 3-tier fallback for economic indicators; (3) Enable live updates for custom screening views.
- [Fixed] Active Positions Real-Time Expiration Engine, Alert Banner Expired Contract Exclusion & Mkt Price Naming Alignment: (1) Upgrade active positions ledger to calculate remaining DTE using live exchange clocks, automatically removing expired contracts from alert banners; (2) Standardize price column naming to Market Price across all tabular views.
- [Feature] End-of-Week Ritual Schwab Positions CSV Upload & Precalculated Cash Balance System: (1) Implement drag-and-drop Schwab positions CSV uploader in Step 1 of weekend ritual; (2) Automatically precalculate available cash, margin reserves, and options purchasing power for subsequent workflow steps.
- [Feature] Client-Side Navigation Router, Quantitative Methodology, Investor FAQ & Regulatory Disclaimer Architecture: Deliver modular client-side navigation supporting dedicated views for quantitative options methodology, institutional investor FAQs, and regulatory SEC/FINRA compliance disclaimers.
- [Feature] Tradier API Primary Market Data Provider & Masked Credential Management Modal: (1) Deliver TradierSettingsModal for secure entry and masked storage of Tradier API tokens; (2) Set Tradier API as primary market data provider for live equity quotes and option chains.
- [Fixed] Daily Options Screener Data Pipeline Git Staging Fix: (1) Correct git staging rules in .github/workflows/daily-screener.yml to ensure generated options datasets are committed to repository artifacts without triggering git lock conflicts.
- [Fixed] Options Trade Quality Simulator Expiration Date Timezone Offset Fix & NYSE Trading Calendar Holiday Adaptive Engine: (1) Correct timezone offset errors in expiration date parsing, aligning contract expiration to 4:00 PM ET on official NYSE trading days; (2) Add holiday adaptive rules for Good Friday and exchange holidays.
- [Improved] Options Trade Quality Simulator Nearest Strike Price Engine & Presets Streamlining: (1) Implement Acklam probit Black-Scholes inversion in OptionsTradeQualitySimulator to solve and snap to nearest real exchange strike price (getNearestExchangeStrike); (2) Dynamically calculate strike cushion OTM %, actual Delta, PoP, bid/ask premiums, and margin requirements; (3) Streamline presets area into dynamic contract blueprint card.
- [Feature] Options Trade Quality Simulator Ticker & Expiration Date Hydration with Multi-Source Barchart/MarketChameleon Engine: (1) Add Stock Ticker and Expiration Date inputs in OptionsTradeQualitySimulator and OptionsTradeQualityModal, supporting quick selection of Next Friday, 14 DTE, 30 DTE, 45 DTE with real-time DTE calculation; (2) Integrate quick toggle between Barchart.com and MarketChameleon.com data sources, triggering multi-source technical indicator fetch upon ticker entry; (3) Calculate 13-indicator consensus rating (Barchart Opinion %), buy/sell breakdown, 14-day RSI, and historical volatility IV Rank for Barchart, and moving average trend rules (strict uptrend, golden cross, fast breakout, bull pullback) and IV30 vs 20-day volatility for MarketChameleon; (4) Link Black-Scholes analytical model to dynamically solve conservative Delta, premium yield, annualized RoC, bid/ask spread, and liquidity based on expiration, updating all 5 quantitative sliders and live score gauge; (5) Update usage instructions in handbook and technical docs.
- [Improved] Weekly Stock Screeners 'At least Weekly Options' Precision Labeling: (1) Correct filter checkbox label in WeeklyStockScreenersView toolbar from "Has Options Only" to "At least Weekly Options", accurately reflecting underlying has_weekly_options weekly option chain filtering semantics; (2) Optimize form tooltips and accessibility attributes to clarify that only tickers with weekly (Friday or daily) expirations pass this gate; (3) Synchronously update handbook documentation.
- [Fixed] Gemini AI Decision Hub CBOE Weeklys Gating & Monthly-Only Ticker Rejection: (1) Root out defect where tickers lacking weekly options (such as monthly-only AMCX, MUFG, NMM) were mixed into screener results with synthetic 9/11/2026 Friday expirations injected into Gemini AI institutional prompts; (2) Introduce strictCboeWeeklysOnly state and Stage 1 Screener Feed dedicated "CBOE Weeklys Gate" toggle (defaulting to Strict Enforced) in CascadingScreenerView.tsx, filtering out tickers where has_weeklys === false in finalCandidates funnel; (3) Upgrade geminiPromptTemplates.ts to inject Weekly Options cadence into candidate rows and assert validOpportunities weekly safety before building prompt rows; (4) Synchronously update handbook and test assertions in tests/test_tri_screener_workflow.py.
- [Feature] Universal Interactive Table Column Sorting Engine & Sticky Header Locking: (1) Deliver pure utility table sorting engine (web/src/utils/tableSort.ts) and useSortableTable React hook, parsing numbers, dollar currency ($1,234.56), percentages (+15.4%), compact units (150k, 2.5M, 1.2B), ISO 8601 timestamps, and nested object properties (e.g. extra_fields.rsi_14), automatically sinking null/undefined values in both ascending and descending sorts; (2) Deliver reusable sticky header component SortableTh (web/src/components/ui/SortableTh.tsx) with position: sticky, top: 0, z-index: 10/20, translucent frosted glass background (supporting dark/light themes), text alignment, bidirectional toggling, and dynamic highlight arrows; (3) Establish responsive height and vertical smooth scrolling styles in global index.css (.table-sticky-header th and .table-scroll-container), solving lost table headers during long scrolling; (4) Upgrade all tables across the application: CascadingScreenerView (all 5 tables), WeeklyStockScreenersView, WeeklyPositionAuditView (all 4 asset classes), HoldingsCoveredCallView (equities/covered calls, open CSPs), BrokerStagingWorkbench (staged CSPs, spreads, execution audit), EconomicCalendarView, ScreenerTable, PrimaryScreenerTable, OptionChainMatrixView, FundamentalHealthTable, TaxAlphaOptimizerView, and PmccScreenerView; (5) Add unit tests (tests/test_table_sort.py), passing npm run build and AI asset checks.
- [Fixed] Dynamic Screener Candidate IV/RSI Hydration & Black-Scholes Greek Engine: (1) Completely eliminate hardcoded static fallbacks (iv: 0.35, rsi: 52, delta: -0.18, iv_rank: 45) in CascadingScreenerView, resolving defect where candidates (e.g. VLO, RVTY, RNG) in Gemini AI decision hub all displayed identical misleading 35% IV and 52 RSI; (2) Deliver pure hydration engine (web/src/utils/screenerHydrator.ts), prioritizing real extra_fields (MarketChameleon rsi_14 / iv30 / iv_rank), watchlist metadata (TickerMeta), and historical closes, falling back to sector baselines (energy, healthcare, cloud, semiconductors, financials) and intraday volatility (e.g. VLO calibrated to ~31% IV / 62 RSI, RVTY to ~26% IV / 61 RSI, RNG to ~52% IV / 57 RSI); (3) Apply Black-Scholes inversion and analytical Greeks (calculateBlackScholesGreeks) to solve exact 0.18Δ strike, actual Delta, theoretical value (Bid/Ask/Mid), downside cushion, PoP, and annualized RoC; (4) Upgrade geminiPromptTemplates.ts to inject real IV, IV Rank, 14D RSI, price, and cushion into institutional prompts; (5) Add tests in tests/test_tri_screener_workflow.py, passing frontend builds and AI asset checks.
- [Fixed] TOS View 190898 Bulk/Individual Clear, CSV Column Header Safeguard & Universe Audit: (1) Deliver Clear All and individual row delete actions in ThinkorSwim View 190898 ingestion panel; (2) Implement strict CSV column header detection preventing header rows from being mistakenly parsed as stock tickers; (3) Add universe audit validations ensuring imported symbols conform to US exchange symbol standards.
- [Feature] 100-Point Quantitative Options Trade Quality Scoring Model & Real-Time Quality Simulator Widget: (1) Implement institutional 100-point options scoring engine in web/src/utils/tradeQualityScorer.ts evaluating 5 core dimensions (Trend 25pts, Volatility 25pts, Safety Margin 20pts, Annualized Return 15pts, Liquidity 15pts); (2) Deliver interactive OptionsTradeQualitySimulator widget with live sliders, real-time score calculation, and qualitative assessment badges (Elite Institutional, High Quality, Speculative, Unacceptable).
- [Improved] System Code Audit, Quantitative Mathematical Guards & Dynamic Code Splitting: (1) Deliver pure financial math library in web/src/utils/financeMath.ts implementing Black-Scholes formula, standard normal CDF, and Greek derivatives; (2) Add quantitative boundary guards preventing division by zero and NaN propagation; (3) Implement dynamic code splitting on heavy modal components, reducing initial bundle footprint.
- [Fixed] Active Position Ledger 4-Asset Class Reconciliation & Charles Schwab Cash/MMF Integration: (1) Upgrade Active Position Ledger to comprehensively categorize and reconcile 4 distinct asset classes: Long Equities, Short Covered Calls, Short Cash-Secured Puts, and Cash/Money Market Funds; (2) Seamlessly integrate Schwab cash deposits and SWVXX money market fund balances into net buying power calculations.
- [Feature] End-of-Week Ritual Item 4 Tri-Screeners, TOS View 190898 Standardized Screen & Weekend Ritual User Manual: (1) Reconstruct Step 4 of weekend ritual into unified Tri-Screeners workspace integrating Barchart, MarketChameleon, and ThinkorSwim; (2) Deliver standardized output screen for TOS View 190898; (3) Author comprehensive step-by-step user operation manual in strategy handbook.
- [Feature] Dynamic Equities Tracked Engine & Elimination of Hardcoded Tickers: (1) Completely eliminate hardcoded "21 Equities Tracked" badge in top navigation bar, replacing it with dynamic counter reflecting actual count of imported portfolio holdings and custom watchlist tickers; (2) Ensure ticker count updates reactively when watchlists or broker statements change.
- [Feature] Options Master Digest Schwab Integration & Mid-Week Live Transaction Entry: (1) Replace mock SPY/AAPL test trades in Options Master Digest with live Charles Schwab options position ledger; (2) Deliver LiveTransactionModal supporting mid-week entry and tracking of new covered call and cash-secured put trades.
- [Feature] TOS/Barchart Live Close Pricing, Broker Positions CSV Ingestion & Watchlist Integration: (1) Hydrate ThinkorSwim and Barchart screened candidates with live closing prices and volume data; (2) Link broker CSV position holdings directly with watchlists for unified cross-module tracking.
- [Feature] Living Trust-Options ...609 Real Account Setup, MMF Collateral & CSP Reconciliation: (1) Configure authoritative Living Trust-Options ...609 account structure in portfolio ledger; (2) Track money market fund (SWVXX) balances as interest-bearing collateral for short cash-secured put positions.
- [Feature] Institutional Gemini Pro Options Prompt & 15-Column Table Ingestion: (1) Deliver geminiPromptTemplates.ts generating structured prompts for Gemini Pro AI options analysis; (2) Implement robust parser ingesting 15-column structured tables returned by Gemini into actionable trade candidates.
- [Feature] Automated Live Sync Frequency, Rate-Limit Safeguards & Market Hours Gating: (1) Implement adaptive polling frequency for live market data sync based on market hours (active trading vs. post-market vs. weekend); (2) Add rate-limit safeguards preventing upstream API bans.
- [Feature] Weekend 10-Step Options Workflow Routine, Living Expense Deduction ($5,000), Dynamic Cash Risk Limits, 20Δ Covered Call Generator & Gemini Thinking Mode 3-Table Ingestion: (1) Deliver comprehensive weekend options routine with cash allocation waterfall including recurring $5,000 living expense deductions; (2) Enforce strict risk limits: support $500k+ idle capital, cap individual equity CSP exposure at $200,000, and limit concurrent open puts to 5 positions; (3) Implement 20 Delta covered call recommendation engine; (4) Deliver parser for Gemini Thinking Mode 3-table structured output.
- [Feature] End-of-Week Options Routine, Cascading Screener, Cash Ledger & Layout Revamp: (1) Deliver WeeklyOptionsRoutine layout integrating cascading screener (15–25Δ), cash budget ledger, and responsive multi-pane layout.
- [Feature] Weekly US Economic Indicators & Macro Catalyst Radar: (1) Deliver EconomicCalendarView frontend view with unified dual-tree navigation supporting both Equities and Options trees; (2) Highlight upcoming FOMC decisions, CPI/PPI releases, jobs reports, and earnings dates.
- [Feature] Automated Options Income Screener & Zero-Billing Bridge: (1) Deliver OptionsIncomeScreener connecting to Gemini Pro using Thinking Mode HIGH for deep trade structuring; (2) Provide zero-billing bridge for local AI inference.
- [Feature] Barchart Custom Watchlist Agent & View 190898 Engine: (1) Deliver BarchartCustomWatchlistAgent in src/screener_agents/ automating custom watchlist screening and View 190898 metric extraction.
- [Feature] Prescreen Builder & Presets with CBOE Weeklys Directory Validation: (1) Integrate official CBOE Available Weeklys Directory (https://www.cboe.com/available_weeklys/) to validate weekly options eligibility for screening presets.
- [Feature] MarketChameleon Momentum & Volatility Screener Agent with One-Click Copy: (1) Deliver MarketChameleonScreenerAgent (src/screener_agents/marketchameleon_agent.py) with preconfigured screen parameters and one-click copy output.
- [Feature] Weekly Stock Screeners Automated Agent & Multi-Feed Pipeline: (1) Deliver Python screener agent suite (src/screener_agents/) and CLI runner (scripts/run_screener_agents.py).
- [Feature] Data Normalization & High-Density Formatting Layer (MarketDashboardPayload & TickerSignal): Add OptionsIdea, TickerSignal, and MarketDashboardPayload schemas with format_pipeline_output formatter.
- [Improved] Institutional High-Density Trading Terminal (Koyfin / TradingView Architecture Refactor): (1) Deliver dark slate palette tokens (#080B10 canvas, #0F172A cards, #1E293B borders) with JetBrains Mono tabular-nums typography; (2) Implement high-density information layout.
- [Feature] Watchlist Immediate Hydration & QC Gate: (1) Eliminate bug where newly added unanalyzed tickers (e.g. EOSE) displayed default $100.00 placeholder prices in watchlists and screeners by building multi-tier client-side live hydration pipeline.
- [Fixed] Workspace Isolation & Zero Cloudflare Pages Vulnerabilities: (1) Restore root package.json workspace to contain only web, isolating Electron desktop dependencies in apps/dsa-desktop, eliminating Cloudflare Pages build vulnerabilities.
- [Feature] Institutional Trading Terminal UI/UX Refactor & Executive Decision Matrix: (1) Deliver institutional dark design system with Inter and JetBrains Mono typography; (2) Implement modular navigation architecture with Executive Decision Matrix.
- [Fixed] DeltaHarvest Cloudflare Pages TypeScript Strict Mode Build Remediation: Fix all type compatibility errors reported by tsc -b during Cloudflare Pages CI/CD build, including MultiLeg and OptionChain typing.
- [Improved] DeltaHarvest Closed-Loop Lifecycle, Calendar Friday Expirations & Header Risk Pulse: (1) Implement closed-loop order staging lifecycle in BrokerOrderStagingModal; (2) Align calendar expirations to standard Friday schedules; (3) Connect live Risk Pulse metrics in Header.
- [Feature] DeltaHarvest Phase 4 Suite - Section 1256 Tax-Alpha, Wash-Sale Shield & Executive Portfolio Health Digest: (1) Deliver IRS Section 1256 index options tax-alpha optimizer; (2) Implement wash-sale shield tracking replacement stock purchases; (3) Deliver Executive Portfolio Health Digest summary view.
- [Feature] DeltaHarvest Priority 3 Suite - Multi-Agent LLM Trade Structurer, SEC 10-K Auditor & Dynamic 0.50Δ Defensive Rolling Assistant: (1) Deliver multi-agent LLM trade structurer; (2) Implement SEC 10-K filing auditor; (3) Implement dynamic defensive rolling assistant triggering on 0.50 Delta breach.
- [Feature] DeltaHarvest Priority 2 Suite - Option Chain Straddle Matrix, Volatility Smile Visualizer, PMCC Screener & Portfolio Margin Simulator: (1) Deliver ATM straddle expected move matrix; (2) Implement volatility smile chart visualizer; (3) Deliver Poor Man's Covered Call (PMCC) screener; (4) Implement portfolio margin simulator.
- [Feature] DeltaHarvest Priority 1 Suite - Broker Order Lifecycle Execution, Cloud Watchlist Sync & Multi-Channel Alert Engine: (1) Implement Charles Schwab order payload staging; (2) Deliver cloud watchlist synchronization; (3) Implement multi-channel alert dispatcher (Telegram, Discord, Webhook).
- [Feature] DeltaHarvest Multi-Named Watchlists, In-Place Rename, Safe Deletion & Frank Favorites Migration: (1) Deliver full-featured watchlist management pipeline supporting multiple named lists, in-place renaming, safe deletion, and migration of Frank Favorites.
- [Fixed] DeltaHarvest Watchlist Market Data Hydration & Zero-Default Pipeline: (1) Fix issue where newly added tickers (such as GOOGL) displayed default $100 price and 1,000,000 volume in static hosting or slow network conditions by implementing multi-tiered price hydration.
- [Feature] DeltaHarvest Multi-Period Prediction Market Term Structure & SSVS Analytics Suite: (1) Deliver cross-period prediction market term structure engine and annualized hazard rate analytics.
- [Feature] DeltaHarvest Watchlist Opportunity Synthesis & Signal Screener Pipeline: (1) Connect watchlist additions directly to options opportunity generation pipeline across text input, bulk paste, and CSV/Excel uploads.
- [Feature] DeltaHarvest SPCX & TSLA Merger Prediction Markets Integration: Deeply integrate prediction market probabilities for SPCX, TSLA, and GOOGL into SECURITY_INTELLIGENCE_REGISTRY.
- [Feature] DeltaHarvest Equity Analysts Rating Breakdown & Heatmap Visualizer: (1) Add Wall Street analyst rating distribution heatmap in AnalystPriceTargetBar (Strong Buy Green / Buy Teal / Hold Amber / Underperform Orange / Sell Red).
- [Improved] DeltaHarvest Header Live Sync & Dynamic Market Engine: Streamline top navigation controls into unified "⚡ Live Sync" button, fetching live quotes concurrently across all watchlists and core universe.
- [Fixed] DeltaHarvest Cloudflare Pages Build Remediation & Zero-XLSX Complete Migration: (1) Migrate FundamentalHealthTable, InteractiveChart, and export utilities completely away from xlsx library to native CSV generation.
- [Feature] DeltaHarvest MarketChameleon Web UI Card & Plain-English Educational Handbook: (1) Add "🦎 MarketChameleon Intelligence" card in TickerAuditModal and educational guides in strategy handbook.
- [Fixed] DeltaHarvest SheetJS (xlsx) High Severity Vulnerability Remediation: Remove xlsx@0.18.5 external dependency affected by prototype pollution (CVE-2023-30533), replacing with native TypeScript CSV parser and generator.
- [Feature] MarketChameleon Quantitative Replication Service: Add src/services/market_chameleon_service.py module replicating MarketChameleon quantitative metrics, IV ratings, and trend filters.
- [Feature] DeltaHarvest Watchlist Auto-Processing, Dynamic Master Universe, Day/Night Mode & Security Hardening Suite: (1) Upgrade WatchlistManagerModal; (2) Deliver dynamic master universe selector; (3) Add light/dark theme switching; (4) Harden API security.
- [Fixed] DeltaHarvest TickerAuditModal TypeScript Syntax & Cloudflare Pages Build: Fix syntax closing brackets in handleExportExcel, eliminating CI/CD build failures on Cloudflare Pages.
- [Feature] DeltaHarvest Sticky Table Headers & Direct SEC EDGAR Regulatory Integration: (1) Implement sticky headers for PrimaryScreenerTable, FundamentalHealthTable, and OptionChainMatrixView; (2) Add direct links to SEC EDGAR company filings.
- [Improved] DeltaHarvest Navigation & Modal Menu Uniformity: Standardize tab bar heights (min-h-[58px]) and active indicator styling across TickerAuditModal and DualMenuTree navigation components.
- [Fixed] DeltaHarvest TypeScript Strict Mode & Icons Remediation: Clean up duplicate icon exports in icons.tsx and hoist rsi variable declaration in securityIntelligence.ts, resolving Cloudflare Pages strict-mode compilation errors.
- [Feature] DeltaHarvest Multi-Channel Intelligence & UI Polish Suite: Deliver 8 full-spectrum enhancements: (1) Calibrate Oversold (RSI < 35) and Near Lower Support (<= Lower BB) filters; (2) Enhance analyst consensus target cards; (3) Polish dark-mode UI.
- [Fixed] DeltaHarvest Cloudflare Pages Build & Python 3.13 Longbridge Dependency: Add python_version < '3.13' environment marker to Linux longbridge dependency in requirements.txt.
- [Fixed] DeltaHarvest Static CDN Content-Type Check & WebSocket Guard: Add response Content-Type verification for Cloudflare Pages static SPA environments, preventing HTML fallback responses from being misparsed as JSON.
- [Fixed] DeltaHarvest Header API Self-Test Visibility & Live Fetch Timestamp Persistence: Redesign "⚡ API Self-Test" button in header with high-contrast gradient, and support triggering via Command Palette (Ctrl+K); persist live fetch timestamps.
- [Feature] Interactive API Self-Test & Health Suite: Add "⚡ API Self-Test" automated diagnostic center (ApiDiagnosticsModal) in Web UI header, supporting one-click concurrent health checks across Charles Schwab, Tradier, Yahoo Finance, and Cloudflare Pages edge functions.
- [Feature] Charles Schwab API Diagnostics & Live Testing: Deliver Charles Schwab Retail Trader API live connectivity diagnostic tool (scripts/test_schwab_connection.py and FastAPI endpoint).
- [Improved] DeltaHarvest 50/50 Blended 14-RSI Engine: Deliver 50/50 blended 14-day RSI engine combining Welles Wilder exponential smoothing (RMA) and Cutler simple moving average (SMA), eliminating pure Wilder lag.
- [Fixed] DeltaHarvest 14-Day Wilder RSI Standard Calibration: Upgrade full-stack 14-day RSI calculation to standard J. Welles Wilder exponential smoothing (RMA / EWM alpha = 1/14).
- [Feature] DeltaHarvest Barchart 13-Indicator Opinion Engine & Top 1% Screener: Integrate Barchart multi-timeframe 13 technical indicator suite (4 short-term, 4 medium-term, 5 long-term) to calculate composite Opinion % and rank top 1% candidates.
- [Improved] DeltaHarvest Prediction Markets & Sentiment Feeds: Upgrade TSLA prediction market matching (Polymarket & Manifold API) and social sentiment analysis (StockTwits stream NLP).
- [Fixed] DeltaHarvest React Hook Rules & Modal Lifecycle: Fixed useMemo invoked after conditional branches (early return) in TickerAuditModal, OptionDetailModal, and ReportQueryModal triggering Minified React Error #310; hoisted all React Hook invocations unconditionally to top, and controlled modal lifecycle via short-circuit expressions in App.tsx, completely eliminating crashes from mismatched Hook counts.
- [Fixed] DeltaHarvest Reports & Screener Resilience: Add null-safety protections for options values in ReportQueryModal; isolate report export modal with ErrorBoundary in App.tsx.
- [Test] DeltaHarvest Test Suite & Type Remediation: Deliver unit test suite (tests/test_delta_harvest_options.py) covering options, CEF, and risk controls; fix types in liveMarketFetcher.ts.
- [Fixed] DeltaHarvest Ticker Audit Modal & Chart Resilience: Fix black-screen crash on ticker click caused by undefined metric access and async chart initialization; wrap in React ErrorBoundary with ascending trade dates.
- [Feature] DeltaHarvest Client-Side Live Market Engine: Deliver pure frontend browser live market and options simulation engine (web/src/utils/liveMarketFetcher.ts) when running in backend-less environments like Cloudflare Pages.
- [Fixed] DeltaHarvest Live Price Pipeline: Optimize process_ticker() in scripts/generate_options_data.py, adding fast_info / regularMarketPrice intraday live quote fetching.
- [Feature] DeltaHarvest On-Demand Live Recalculation: Deliver FastAPI POST /api/v1/options/recalculate dynamic recalculation endpoint and scripts/generate_options_data.py CLI runner.
- [Feature] DeltaHarvest Contextual Intelligence Layer: Deliver contextual intelligence and sentiment analysis system (src/services/contextual_intelligence_service.py) integrating Wall Street price targets, consensus ratings, and news.
- [Feature] DeltaHarvest Contextual Enricher Backend: Add scripts/contextual_enricher.py data enrichment module and integrate enrich_ticker_payload() into scripts/generate_options_data.py.
- [Feature] DeltaHarvest Live API & WebSocket Stream: Deliver FastAPI backend /api/v1/options/snapshot and /api/v1/ws/stream live WebSocket channels.
- [Feature] DeltaHarvest CEF Analytics: Deliver Closed-End Fund (CEF) valuation and distribution quality engine (src/services/cef_analytics_service.py and /api/v1/options/cef/{symbol}).
- [Feature] DeltaHarvest Risk Circuit-Breaker: Deliver quantitative risk circuit breaker service (src/services/risk_circuit_breaker.py and /api/v1/options/risk/check-order), supporting max drawdown limits.
- [Feature] DeltaHarvest QuantLib Greeks Engine: Deliver high-precision analytical Greeks and American early exercise risk engine (src/services/quantlib_greeks.py).
- [Feature] Tradier API Data Provider: Add Tradier API provider (data_provider/tradier_fetcher.py) as secondary options chain and US quote fallback source.
- [Fixed] DeltaHarvest Reports & Exports: Fix empty data exports caused by residual global filter state; sort EARNINGS_CALENDAR ascending by earnings date; add data fallback guards.
- [Feature] DeltaHarvest Security Intelligence & News: Expose backend deep analysis capabilities across ticker audit, option details, command palette, and screeners, integrating AI composite scores (0–100) and Wall Street targets.
- [Improved] DeltaHarvest Primary Screener: Add AI score and catalyst columns to primary screener table, and fix column header click sorting for Bollinger cushion, support distance, IVR, and RSI.
- [Feature] DeltaHarvest Broker Staging: Deliver Phase 5 broker order staging and one-click execution payload system, supporting Charles Schwab Retail Trader API and Interactive Brokers (IBKR TWS BasketTrader).
- [Improved] DeltaHarvest Navigation: Add high-contrast customized scrollbar (10px width, Slate/Emerald color feedback) with smooth scrolling support, and floating ScrollToTopButton.
- [Improved] DeltaHarvest Navigation & Charts: Upgrade web navigation best practices (breadcrumb path tracking, quick-jump bar, keyboard shortcuts 1/2/W/R/?/P, contextual strategy banners), and fix Lightweight Charts v5 series rendering.
- [Feature] DeltaHarvest Backtester: Deliver Phase 4 historical multi-cycle backtesting engine and FINRA 4210 margin stress test system, supporting 0.15~0.20 Delta Cash-Secured Puts (CSP), weekly options, and credit spreads with win rate, Sharpe, and drawdown metrics.
- [Feature] DeltaHarvest Fundamentals: Deliver Phase 3 fundamental financial health and CEF analytics engine, adding Altman Z-Score bankruptcy risk, Piotroski F-Score operational quality, and SEC EDGAR 10-K/10-Q filing parsers.
- [Feature] Charles Schwab API Support: Add Charles Schwab Retail Trader API provider and credential authentication module (data_provider/schwab_fetcher.py), supporting live US NBBO quotes, complete options chains, and real-time Greeks.
- [Feature] DeltaHarvest Options Engine: Deliver Phase 2 volatility skew and multi-leg options engine adhering to conservative 0.15~0.20 Delta principles, adding Bull Put Spreads, Bear Call Spreads, and Iron Condors.
- [Feature] DeltaHarvest Web UI: Integrate TradingView Lightweight Charts interactive candlesticks, 20-day SMA, 2-sigma Bollinger Bands channels, dynamic strike price target lines, chart switching workspace, and technical pattern help manual.
- [Feature] DeltaHarvest Web UI: Add dual navigation menu trees for US equities technical analysis and options, global search and command palette (Ctrl+K), strategy help manual, multi-watchlist manager (with bulk import and CSV/Excel parsing), and multi-format report export (CSV/Excel/PDF).
- [Fixed] Route US daily lines according to current provider priorities, allowing individual *_PRIORITY configs (e.g. YFINANCE_PRIORITY=0) to take effect immediately; preserve index primary and Longbridge preferred semantics.

- [Feature] Support analyzing registered sector indices in a single run via main.py --stocks, automatically applying index-appropriate data and analytics while maintaining report, history, and decision signal compatibility.
- [Fixed] main.py --stocks performs best-effort refresh of stock index registry before parsing ticker list, ensuring initial runs consume refreshed index aliases/identities without blocking on failures, timeouts, or disabled settings.
- [Fixed] Apply market=cn A-share holiday filtering to index codes with unknown market (such as sh000016/csi930955/930955.CSI) to prevent holiday indices from failing-open; retain non-index codes whose market remains unknown.
- [Fixed] Index analysis attributes and saves hit daily data source to historical records for display in Dashboard/Brief aggregate reports; preserve original output when source is invalid.
- [Docs] Link DSA arXiv paper at the top of English/Chinese READMEs and add CITATION.cff standardizing project citation metadata.
- [Feature] Add read-only contracts for data provider capabilities and dataset quality via /api/v1/data/overview and /api/v1/data/capabilities, exposing unified provider capabilities and dataset quality to Market Dashboard, Data Center, Ticker Details, and Watchlist 2.0.
- [Fixed] Standardize US index live quotes and capability overview to YFinance-only routing, preventing accidental Longbridge fallback when YFinance fails.
- [Improved] Add documentation path detection to PR CI: skip backend test shards, Docker, Web, and Desktop packaging when modifying only regular docs, non-governance Markdown, or LICENSE, retaining lightweight governance and gate summaries; contract docs, static API specs, and test fixtures still run backend regressions.
- [Feature] Add ResearchArtifact structured research product contract, carrying Thesis, Evidence, Invalidation Conditions, Next Actions, and Data Quality in AnalysisReport.structured_report.
- [Fixed] Synchronize ResearchArtifact and AnalysisReport.structured_report into static OpenAPI specification, preventing drift between public API specs and runtime contracts.
- [Fixed] Complement Noto CJK and CJK font stacks for Linux/Docker share images, preventing PNGs from showing only numbers and English while Chinese/Korean text disappeared.
- [Feature] Add tokenizer module to Web Chat intent recognition layer: web_intent_tokenizer 6-step pipeline (multi-stock entity scan -> punctuation/whitespace split -> ticker-shape extraction -> market keywords -> unambiguous keywords -> remaining gap multi-strategy DFS matching) splitting user messages into semantic tokens.
<!-- New entry format: - [type] description (types: feat/improved/fix/docs/test/chore) -->
<!-- Append each entry as a single line at the end of this section, no category headers, to minimize merge conflicts -->
- [Feature] Enhance Futu OpenD HK stock data provider: system settings support OpenD host, port, and HK live data source priority, retaining Longbridge, AkShare, and YFinance fallbacks.
- [Test] Add coverage for Futu configuration schema, HK live routing, and fallback contracts.

- [Feature] Establish unique, generatable, verifiable, and degradable index identity registry: deterministically merge 31 manifest items from scripts/stock_index_seeds/index_registry.csv into apps/dsa-web/public/stocks.index.json, making verified active=true / assetType=index rows in JSON the single runtime source of truth, removing stock_list_parser 5-item hardcoded whitelist; support --index-only generation and byte-stable output.
- [Feature] Support explicit SH/SZ/CSI index alias convergence and CSI identity: sh000300/000300.SH/sz399300/399300.SZ/000300.CSI all resolve to sh000300; csi930955/930955.CSI resolves to csi930955; unregistered .CSI input returns unsupported; bare numbers remain stock and only expose ambiguity via matched_index.
- [Feature] Data manager maps provider symbol according to SH/SZ/CSI support matrix: CSI is supported only by AkShare (csi{code}), Tencent/TickFlow/Yahoo return empty symbol and log unsupported provider-run without triggering index health circuit breakers.
- [Improved] Storage layer _derive_canonical_id unified to parser inference (bare code=stock, explicit index=index), and add idempotent batch repair for legacy bare codes with erroneous canonical bucket crossings (000001/000016/000688/930955, etc.); explicit index rows and correct stock rows remain unaffected, repair is no-op when registry is empty.
- [Improved] Web loader fully decompresses shared payload containing indices, but filters out assetType=index before returning to autocomplete/popular/group consumers; stock and ETF behavior remains unchanged.
- [Test] Add TDD regression anchors for generator, loader, parser, provider routing, storage repair, and Web gating.
- [Fixed] PR #2267 review CSI explicit identity convergence: separate csi prefix (canonical) and .CSI suffix (explicit alias) in parser/build/runtime normalizers; unregistered explicit csiNNNNNN/NNNNNN.CSI always returns unsupported (no longer falling into US stocks or guessing SH/SZ), preventing unregistered csi000300 from being equated to registered 000300.CSI alias; storage _derive_canonical_id returns NULL for unsupported input, avoiding persistent canonical bucket pollution.
- [Fixed] Strictly validate alias uniqueness and integer popularity across seed, build entry, and runtime candidate tiers: NFKC/casefold equivalent alias cross-entry conflicts are rejected (no silent overwrites); non-integer popularity (float/boolean/negative/string) is rejected, keeping positive integer 100 valid.
- [Fixed] Converge registered CSI explicit identities across resolver, task deduplication key, and history candidates: csi930955/930955.CSI/CSI930955 uniformly resolve to parser canonical csi930955, unregistered csi930956/930956.CSI preserves existing fallback semantics; is_code_like(), REST/watchlist input boundaries, and full pipeline pass-through remain unchanged.
- [Fixed] Prevent updated non-bundled index candidates (including legacy static subsets) from overwriting bundled baseline as active-index subset when remote is missing/corrupted: all non-bundled candidates must be valid supersets of bundled active-index canonical set, otherwise falling back to bundled with a WARNING log.
- [Feature] Add update entry in top right corner of desktop app, sharing update status with settings page; hidden in regular browser WebUI without triggering redundant background checks on mount.
- [Fixed] Desktop top-right update entry and settings page share in-flight status, preventing concurrent triggers of GitHub Releases check; main process manual check path adds in-flight deduplication.

## [3.31.0] - 2026-08-23

### Release Highlights

- feat: Added category- and per-tool timeout contracts for Agent tool calls, along with anti-retry, cooperative cancellation, concurrency budgeting, and hot-reload consistency.
- feat: Stock name resolution, canonical_id dual-write, and A-share index multi-data-source routing collectively enhance stock identity and quote fallback pipelines.
- improve: Disclose evidence boundaries faithfully in reports when news retrieval is empty; Anspire defaults to global region coverage; public SearXNG instances require explicit enablement.
- fix: Further converged scheduled task recovery, no-report failure feedback, notification delivery, and market review history/diagnostic info to reduce silent failures and misleading displays.
- security: Upgraded builder-util-runtime on Desktop, fixing CVE-2026-54673 redirect credential header leakage risk.
- docs: Added LiteLLM configuration examples for xAI Grok, Grok Bot integration instructions, and reusable Skills.

### Detailed Changes

- [Fixed] Market review history list and details consistently display persisted short summary; legacy records lacking summaries generate plain-text excerpts without internal markup from full Markdown.
- [Fixed] Market reviews record diagnostics by actually executed generation backend and model, avoiding Codex CLI or fallbacks being mislabeled as configured model.
- [Fixed] Configured DingTalk Webhook no longer falsely reports "Notification channel not configured"; DingTalk Stream remains interactive-only, not for scheduled static pushes.
- [Fixed] WebUI/API/Desktop restarting with --serve-only restores enabled scheduled tasks without executing immediate analysis on startup; notification routing examples add DingTalk Webhook channel.
- [Improved] AIHubMix registration and referral links standardized to inferera.com, improving direct connectivity in mainland China.
- [Fixed] Single-stock push mode persists local reports when notification channels are unconfigured; CLI analysis explicitly returns failure and logs reason on empty stock list, complete failure, or local report save failure.
- [Fixed] Merged notification mode delivers available notifications even if local single-stock report save fails; analysis tasks return failure when only market review is enabled but generates no content.
- [Fixed] Web/API runtime scheduler executes analysis in cross-platform independent subprocesses, cleaning process tree on 45-minute hard timeout or service stop; halts automatic dispatches after stop to prevent hanging jobs from blocking scheduling.
- [Fixed] SearXNG public instance discovery default changed from enabled to disabled: public instances commonly face rate limits, outages, or non-JSON responses, where default enablement caused users without configured search keys to suffer 10–30s timeout delays per request; retains existing behavior for users with explicit `true`.
- [Improved] Reports explicitly state when conclusions omit news evidence due to unconfigured channels or zero hits: zero hits and "unconfigured search channel" use independent copy, covering daily / dashboard / brief / single-stock / WeChat push and zh / en / ko template renders.

- [Feature] Agent tool calls support configuring default timeouts by category (data/search/analysis/action/market), and allow individual tools to declare `timeout_seconds`; effective timeout resolves via first-wins precedence (explicit per-run `tool_call_timeout_seconds` > single tool explicit `timeout_seconds` > category default > unlimited), remaining wall-clock budget serves only as an unbreachable outer cap, returning a structured `{"timeout": true}` error upon timeout (marked `retriable: false` and written to `non_retriable_tool_results` to prevent retry re-execution) for Agent to continue execution rather than aborting loop (fixes #1890).
- [Fixed] Agent tool registry (`src/agent/factory.get_tool_registry`) changed from module-level caching to invalidating by comparing "category timeout mapping values", preventing CPython object recycling address reuse (identical `id(config)`) where reloaded `Config` was misjudged as unchanged, keeping stale timeouts; added `_coerce_config_timeout` type whitelist so callers passing `MagicMock` / missing attribute stubs / dirty strings (e.g. `float(MagicMock())` silently yielding 1.0) fall back to "no category limit" rather than crashing or imposing a 1s timeout; `build_agent_executor(config)` / `build_agent_chat_executor(config)` now pass caller `config` through to `get_tool_registry(config)` (no longer parameterless call freezing first built registry); `main._reload_runtime_config` and `SystemConfigService._reload_runtime_singletons` (and `update()` -> `reload_now` path) call `reset_tool_registry()` to force rebuild during hot config reload; added regression tests for "registry rebuilds with new config", "new timeout takes effect after reload", and "builder passes config through" scenarios (#1890 review follow-up, closing OR-COM-dd1e8fa7 / OR-COM-bff42110).
- [Fixed] Agent tool timeout review loop closure (fixes 4 blockers in #1890): timeout resolution changed from min contract to first-wins (explicit per-run `tool_call_timeout_seconds` > single tool `ToolDefinition.timeout_seconds` > category default > unlimited, remaining wall-clock budget serves only as unbreachable outer cap; research path no longer passes `tool_call_timeout_seconds` to avoid overriding category limits); timeout results marked `retriable: false` and written to `non_retriable_tool_results` blocking LLM retries on same call, and arms cooperative cancellation signals (`is_tool_cancellation_requested()` and existing `check_tool_execution()` checkpoints both respond, handler behavior unchanged if never polling) for handlers still running in background when timeout fires, serving as review-requested "intra-handler cooperative cancellation" mitigation, avoiding duplicate executions and side effects from Python threads unable to force-stop; `_coerce_config_timeout` falls back to "unlimited" on `inf`/`nan`/negative values, eliminating `OverflowError` triggered by `future.result(timeout=inf)`; added `threading.Lock` double-checked locking to `get_tool_registry` / `reset_tool_registry`, returning newly constructed local registry upon rebuild (rather than global cache), eliminating concurrent rebuild races and cross-call timeout crosstalk; `@tool` decorator folds `ToolPolicy.timeout_seconds` into `ToolDefinition` single source of truth; unified single/parallel tool timeout wrappers (single executor + deadline-driven wait loop, eliminating nested executors and thread doubling in parallel paths, duration accurate to each tool's own timeout value), adding fast/slow mixed parallel regression tests; synchronized timeout env var docs in `docs/full-guide_EN.md`; tests cover first-wins, non-retriable, cooperative cancellation wiring, finite validation, cache thread safety, and fast/slow mixed concurrency.
- [Fixed] Closed 3 correctness issues per latest review audit (OR-COM-7f3d3f5b / 3d6b61f8 / a1e8b0c2): `BaseAgent._filtered_registry()` carries source registry's category timeout mapping (tool subsets still enforce category caps, no longer bypassing #1890 category timeouts); per-tool timeout for queued calls when parallel batch >5 starts counting when worker actually starts (no longer burning budget upon submission causing false timeouts on unstarted calls); `get_tool_registry()` cache-hit fast path reads consistent pair under lock (eliminating race with `reset_tool_registry()` returning `None` or mismatched registry). Added corresponding regression tests.
- [Feature] Stock name resolution engine refactored and enhanced: added `resolver_name_to_code_list()` public API returning candidate `Stock` list sorted by market (A-share -> HK -> US) (up to 5 candidates); added `US_stock_code_match()` matching US tickers (1-5 letters and restricted to codes already present in local database, preventing English words like hello/open from being misjudged as stocks); full AkShare A-share data merged into global `stockDB` via idempotent `extend_AkShare()` (30-minute cache + 5-minute backoff on failure + Future single-flight: zero-wait stale-while-revalidate on TTL expiration, cold-start wait ceiling derived from fetch timeout (fetch capped at 25s via subprocess), worker clears state and wakes waiters before logging/persisting (finally fallback for BaseException), successful fetches persisted to `data/cache` reused across restarts, non-Chinese inputs skip network extension); matching strategy upgraded to "exact -> substring (>=2 Chinese characters) -> pinyin substring (>=5 letters) -> difflib fuzzy (0.8, single-character typo 0.7 fallback)"; `resolve_name_to_code()` maintains existing local-first semantics (local exact hit requires zero network, caller offline low-latency contract unchanged); cross-market candidate capability provided independently by `resolver_name_to_code_list()`; end-to-end resolution is thread-safe (`stockDB` read/write locked, name/pinyin indices automatically invalidated on DB mutations); added 40 unit tests covering exact / cross-market ordering / substring / pinyin / fuzzy / idempotent extension / failure backoff / multi-candidate scenarios.
- [Improved] `StockDaily` table added nullable `canonical_id` column supporting dual-write (Expand-Contract PR2, issue #2207): self-healing migration idempotently adds column + regular index `ix_stock_daily_canonical_id`; existing rows and `save_daily_data` calls without explicit parameters infer canonical IDs via index-aware resolution (bare index codes hitting registry converge to index `canonical_id`, preventing same index from splitting into different buckets based on input form—e.g. bare `000300` and explicit `sh000300` now both converge to `sh000300`, rather than bare code being inferred as `sz000300`), falling back to NULL on inference failure; read path still uses `code` column, `(code, date)` unique constraint preserved. Explicitly noted contract drift: dot-separated format description of canonical_id (`000016.SH`) in PRD Glossary/FR-1/DD-3 and architecture AD-1/AD-7 was replaced by prefix format (`sh000016`) merged in Phase 1 code; this change follows code, leaving synchronous doc updates for subsequent PR consolidation.
- [Feature] 5 CSI/SSE/SZSE A-share indices recognized in current registry routed via explicit market input by canonical identity: names prioritize registry with Tencent, AkShare, TickFlow fallbacks; daily K-lines strictly use Tencent, AkShare, TickFlow, yfinance multi-source fallback chain, ignoring `*_PRIORITY` configs for regular A-share daily K; bare codes still treated as stocks, with same-code stock name caches isolated.
- [Fixed] Anspire search switched to global region mode (`region_mode=2`) by default, enabling overseas stock news retrieval to cover international information.
- [Fixed] Upgraded `builder-util-runtime` to 9.7.0 on Desktop, fixing CVE-2026-54673 HTTP redirect credential header leakage risk.
- [Documentation] Added LiteLLM configuration example for xAI Grok, Grok Bot integration guide, and async analysis Skill, clarifying integration boundaries between analysis models and AI teammates.
- [Test] Pinned time fixtures for yfinance dividend TTM and single-stock report filenames, eliminating CI flakiness caused by cross-date and post-merge time baseline conflicts.

## [3.30.0] - 2026-08-09

### Release Highlights

- feat: LLM channels add explicit Chat Completions / Responses API Surface, unifying protocol routing for connection tests, analysis, screening, image recognition, and status diagnostics.
- feat: Agent Chat persists Skill selections per session, restoring state after page refresh or session switching, preserving omitted, explicit empty, and non-empty selections.
- feat: Electron desktop app restores historical reports, market reviews, and full report share cards; uses bundled QR code and default Xiaohongshu branding when custom branding is unconfigured.
- feat: Added single analysis target parsing contract, tightening normalization boundaries for exchange suffixes, index aliases, and US stock tickers.
- fix: Fixed user-visible stability issues including mobile sidebar scrolling, watchlist details status, long notification title chunking, and Lark international domains.
- improve: Backend CI splits into three parallel runners by test files, tightening gate scopes for Web shared assets and cross-layer contracts.

### Features

- LLM channels support explicit selection of Chat Completions or Responses API Surface, supporting Responses-only models and unifying routing contracts for connection tests, primary analysis, screening, image recognition, and status diagnostics.
- Agent Chat persists Skill selections per session, restoring them after refresh or session switching; historical sessions retain runtime defaults, and invalid Skill requests do not wipe existing selections.
- Electron desktop app reuses bundled Chromium to generate PNG share cards for historical stock reports, market reviews, and full reports; Web and desktop uniformly use bundled Xiaohongshu QR codes.
- `STOCK_LIST` adds `parse_analysis_target()` single-entry parsing contract, exposing injectable index registries and parsed result types.

### Improvements

- Optimized homepage sidebar task panel and watchlist workspace, supporting collapsed task summaries, opening latest details directly from watchlists, and compacting header controls to increase list display area.
- Backend CI split into three parallel runners by complete test files, summarized by unified `backend-gate`; preserves stable offline test semantics while mitigating global state race hazards.

### Fixed

- Standardized account text below Xiaohongshu QR code on share cards as "Xiaohongshu@nickname", defaulting to "Xiaohongshu@BatianTuxiaodou" when unconfigured; no longer renders numeric IDs, preventing legacy ID configurations from altering card templates.
- Fixed vertical touch scrolling failure on mobile homepage history, watchlist, and daily lists while maintaining desktop card clipping behavior.
- Long notifications containing H1 Markdown headings are split at corresponding heading boundaries, preventing erroneous recursion from exhausting length budgets and aborting delivery.
- Converged watchlist details and daily status semantics: expired reports are no longer served during refresh or query periods, legacy history is not mislabeled as today's analysis upon failure, per-stock fallback concurrency is bounded, and invalid batches are cancelled.
- Converged protocol, provider, route alias, and wire-model contracts for Responses channels, rejecting mismatched protocols, duplicate alias Surface collisions, and invalid legacy configurations.
- Feishu bot in `FEISHU_DOMAIN=lark` mode uses Lark international API domains for both Stream connections and message replies, preventing `Incorrect domain name` errors when connecting to mainland domains.
- Explicit exchange suffixes, malformed mixed aliases, dotted prefixes, and foreign half-explicit suffixes reject silent rewriting or downgrading to erroneous markets.
- `us` prefix remains case-insensitive, but ticker base must adhere to standard uppercase US stock ticker format; invalid lowercase, punctuation, or numeric inputs return `unsupported` immediately.
- Standard US stock codes with `.US` suffix are no longer misparsed due to first two characters matching `sh`, `hk`, `bj`, or `us` prefixes.

### Tests

- Non-Web changes run full backend gates by default; filtering semantics for pure Web, shared public assets, notification templates, and settings help include regression tests, with Docker builds continuing to filter based on actual inputs.

### Documentation

- FAQ added steps for temporarily bypassing Gatekeeper quarantine when macOS desktop application launch is blocked on trusted installer packages.

## [3.29.0] - 2026-08-02

### Release Highlights

- feat: Formally incorporated AlphaSift-referenced stock screening core and strategies into DSA, adding screening run history, data source history, and candidate deep-analysis pipeline.
- feat: Added 1080px single-stock decision card and high-density market review share images, supporting Web native sharing and download fallback.
- feat: Added Skill Opinion Outcome computation, performance statistics, and bounded runtime weights based on real samples.
- improve: Optimized screening snapshot reuse, on-demand hotspot loading, multi-source concurrency, and candidate rotation, reducing long pipeline waits and enhancing result diversity.
- fix: Hardened authentication disablement, short credential diagnostic redaction, CI timeout forensics, and desktop frozen bundle launch pipeline.
- fix: Fixed Longbridge volume ratio, stock code window resolution, post-screening reranking, and share image interactions stability issues.

### Features

- SkillAggregator generates bounded runtime weights based on real Skill Outcome buckets independently satisfying the 30-evaluated-sample threshold, using Beta prior shrinkage, unable penalties, and multi-horizon evidence weighting; missing, low-sample, or anomalous stats remain neutral.
- Screening results persist to DSA database by `run_id`, adding run history and data source history APIs, incorporating announcement event context and its search cache, and supporting passing candidates along with strategy-mapped skills to single-stock deep analysis.
- Added read-only Skill Opinion performance statistics aggregated independently by skill, horizon, and outcome engine version; returns observational counts only without metrics or runtime weight adjustments when below 30 evaluated samples.
- Added core service computing and persisting `skill_opinion_outcomes` based on individual SkillAgent own signals, versioned engines, and local co-originated daily bar windows.

### Improvements

- Selecting a hotspot displays existing leaderboard summaries and core stocks first while fetching complete details in background, tightening single hotspot source wait ceiling to 8 seconds.
- Hotspot constituents fetch EastMoney and TongHuaShun data in parallel, merging by fixed data source priority; real provider calls add rate limits, terminable timeouts, concurrency slots, and worker recycling, with topic details reusing DSA native search to add secure, linked recent news on demand.
- Streamlined redundant descriptions on screening page, folding task IDs, snapshot stats, and ranking diagnostics into run details.
- Formally incorporated AlphaSift-referenced stock screening core and strategies into DSA, standardizing on `ScreeningService`, `SCREENING_ENABLED`, and `/api/v1/screening`, preserving Apache-2.0 attribution and source version tracking.
- Web screening uses browser anonymous seeds and run IDs to generate candidate sets within bounded near-score pools after final scoring; local scoring covers complete shortlists, remote analysis respects quantity ceilings, hard filters, risk overrides, and scores remain unchanged.
- Hotspot leaderboard refresh and long screening flows decouple two-way serial waiting, loading hotspot details on demand upon selection; screening defaults to reusing successful full-market snapshots within 5 minutes sharing identical data source priority, displaying snapshot, candidate context, LLM reranking, final score, and news event enhancement stages.
- Image reports switch to dedicated 1080px single-stock decision cards and high-density market review cards, prioritizing accurate data population from structured payloads while retaining Markdown fallback; Xiaohongshu account and QR code support hiding or replacement, and Web supports native sharing and download fallback.

### Fixed

- Web share images open system share dialog synchronously on second user click after on-demand generation completes, preventing async generation from degrading native sharing to download.
- Web share images generated on-demand only after user clicks "Share", no longer requested automatically on report load.
- Removed obsolete "View Settings" button in basic screening card pointing to "Data Sources", moving `SCREENING_ENABLED` and screening toggles to "Basic Settings".
- `scripts/ci_gate.sh` offline tests add unit test timeouts and faulthandler forensics, synchronizing CI dependencies with Docker release workflows to prevent silent hangs without tracebacks.
- Screening strategy bar reliably displays complete Chinese strategy list, preserving custom strategy ID entry.
- Screening hotspot details standardize on Chinese business terminology, removing internal class names, field keys, and raw provider errors.
- Refreshing hotspot list while retaining selected topic bypasses detail cache to re-fetch topic, avoiding pairing new lists with stale routes and constituents.
- Candidate tail rotation prioritizes analyzer input order while preserving tied candidate ordering; converged hotspot news enrichment, shared cache ownership, global concurrency limits, and news search deadlines.
- Outcome candidates schedule fairly by last attempt timestamp, avoiding continuously added missing keys starving older `pending` outcomes from retries.
- Primary screening model falling back to empty, non-JSON, or low-coverage structures attempts backup models; complete failures explicitly show deterministic factor ranking states, never treating `reasoning_content` as final output.
- Screening daily bar enhancement injects request-level DSA-first fetchers, reranking across multiple post-analyzers by updated scores, with remote analysis status tracking actually submitted candidates, preventing overlapping requests leaking wrappers or modifying unsubmitted candidates.
- Unified equivalent stock code local daily candidate and co-originated window resolution; conflicting SSE/SZSE codes no longer degrade to bare symbol matching, with backtesting only accepting start dates verified by snapshots or trading calendars.
- Disabling authentication mandates re-validating current admin password, returning 429 on rate limit hits; frontend blocks submission and displays inline prompt when current password is missing (#1970).
- Local CLI `stdout_preview` / `stderr_preview` sanitizes short credentials across environment variables, JSON, YAML/log scalars, and URLs, preventing API keys, secrets, or tokens from leaking into diagnostics (refs #1784).
- PyInstaller frozen bundle no longer fails to launch when built-in `_internal` standard library is misjudged under NLTK 3.10 import guards; Windows/macOS packaging scripts uniformly integrate compatible runtime hooks.
- Share image merges historical structured data with Markdown field-by-field, reusing persisted payload across multi-market regions, hiding unavailable market light dimensions while preserving color schemes; zh/en/ko templates follow report language, falling back to download on native share failure.
- Feishu file reports clean up hidden market metadata before writing or uploading; desktop runtime hides Web share button by default when renderer is not bundled.
- Command substitution scan in `redact_diagnostic_text()` no longer truncates trailing non-sensitive diagnostic fields, unifying redaction behavior between `export FOO=$(...)` and `FOO=$(...)`.
- Longbridge volume ratio uses adaptive keyword args to call `history_candlesticks_by_offset`, compatible with parameter ordering across 0.2.74 and 4.x SDKs (fixes #2100).

## [3.28.0] - 2026-07-26

### Release Highlights

- feat: Multi-Agent multi-strategy synthesis adds hierarchical deliberation, mediator/self-review, revision projection, and multi-round, unifying final action and explanation contracts.
- feat: AI Suggestions page adds historical performance grouped by decision style; specialist opinion samples persist for post-hoc evaluation.
- feat: Added `--portfolio futu`, enabling read-only import of Shanghai/Shenzhen A-shares, HK stocks, and US equity LONG positions from Futu OpenD authentic accounts.
- feat: Web home and API support ad-hoc single or multi-market market reviews without modifying global configuration.
- feat: Tushare supports custom gateway or compatible mirror integration via `TUSHARE_HTTP_URL`.
- fix: Improved HK quote routing and caching, foreign stock English news matching, data source fallback ordering, and desktop release stability.

### Features

- Multi-Agent multi-strategy synthesis adds controlled deliberation v0, injectable mediator/self-review v1-v2, read-only revision projection v3, and multi-round v4; enhancement layers remain equal or softened relative to baseline without overriding authoritative final signals.
- `specialist` mode selects up to 4 strategy specialists, controlling 1-4 workers via `AGENT_SKILL_CONCURRENCY`; workers inherit pipeline context (frozen target date), and individual skill failures do not block other strategies or final decision.
- Multi-Agent reports track final pipeline adjustments across eight user actions, excluding invalid Agent opinions; generates explanation and DecisionSignal only when canonical action is uniquely resolvable, unifying final action contract with single `final_action`.
- Specialist persists versioned, low-sensitivity, and idempotent valid opinion samples upon successful history save, providing authentic data for post-hoc evaluation; does not compute outcomes, stats, or weight adjustments in this phase.
- AI Suggestions page adds decision style historical performance, displaying hits, interval changes, unevaluated counts, and max adverse excursions across 30 completed samples per group, maintaining legacy stats interface compatibility.
- Added `--portfolio futu`, importing Futu OpenD authentic account Shanghai/Shenzhen A-shares, HK stocks, and US equity LONG positions as analysis list in read-only mode.
- Web home and `POST /api/v1/analysis/market-review` support strictly validated `region` parameter to temporarily select review markets; one-time override does not alter global config, persisting across task submission, status, SSE, results, and history.
- Tushare data source supports custom endpoints via `TUSHARE_HTTP_URL`, defaulting to official endpoint when empty (fixes #1985).

### Improvements

- Paused automatic PR Review triggers, retaining `workflow_dispatch` manual trigger only, preventing redundant runs and misleading red status from comment permission failures; formal CI checks unaffected.
- `.env.example` and daily analysis workflow synchronize `TUSHARE_HTTP_URL` mapping, maintaining consistency across local and cloud configuration entry points.

### Fixed

- Fixed English news relevance omissions when mapping foreign stocks to Chinese display names, unifying foreign stock code, English name, and alias parsing with deduplication (fixes #2026).
- Privileged `pull_request_target` workflows no longer check out fork PR heads; sensitive steps execute trusted main branch scripts only, reading PR metadata and diffs via GitHub API (fixes #2051).
- PR Review emits traceable, non-leaking warnings when payloads are missing, unreadable, or invalid JSON, preserving original fallback behavior (fixes #2070).
- Fixed process hangs caused by registry reads during `mimetypes` cold start on Windows.
- Unified `DataFetcherManager`, AkShare, and Longbridge 4-5 digit bare HK stock symbol recognition, preventing 4-digit codes from routing incorrectly or failing silently (fixes #2091).
- AkShare HK real-time quotes add 20-minute whole-market caching and concurrent cold-start single-flight; cache hits skip rate-limiting waits, preserving Sina backup interface fallback on primary endpoint failures (refs #1852).
- Adjusted `TencentFetcher` default priority to final fallback for A-share daily bars, adding `TENCENT_PRIORITY` explicit override (refs #2032).
- Web settings and notification test inputs add standard DingTalk group bot configuration, supporting secure masked saving of webhook and secret, help viewing, and test notification sending (refs #1957).
- Agent Chat standard and streaming endpoints inherit global `REPORT_LANGUAGE` when `report_language` is unspecified in request, with explicit request values taking priority.
- WebUI separates display of release version, code version, and build timestamp, using build input hash to prevent reusing stale static assets with unchanged timestamps (fixes #2093).
- macOS unsigned packaging explicitly disables Electron signing and Hardened Runtime, purging broken signatures during frozen backend and electron-builder stages, auditing application and DMG outputs; mitigation does not replace Apple Developer signing and notarization (refs #2075).

### Documentation

- Fixed broken relative links in documentation.
- [Fixed] #2026 Foreign stock code to Chinese display name mapping missed English news relevance evaluation: added single source of truth `STOCK_ENGLISH_NAME_MAP`, `canonicalize_foreign_stock_code` normalizer, and `_foreign_english_query_terms` alias resolution, enabling tickers like AAPL/00700/BABA to reuse canonical English names across query building, relevance scoring, and multi-dimensional intelligence paths even when stock_name is Chinese, completing categorization and regression cases for all forms (.US/.HK suffix and HK prefix); also deduplicated expanded alias terms in `_score_news_relevance`, preventing double scoring between legal alias expanded short names and explicit short aliases.
- [Feature] Tushare data source supports custom access URL via `TUSHARE_HTTP_URL` environment variable, enabling switches to self-hosted gateways or third-party compatible mirrors when `api.tushare.pro` is unreachable; leaving blank preserves official default URL (fixes #1985).
- [Documentation] `.env.example` and `.github/workflows/00-daily-analysis.yml` synchronize `TUSHARE_HTTP_URL` mapping, avoiding semi-fixed states where config exists but workflow misses mapping.
- [Fixed] #2051 Privileged `pull_request_target` workflow in PR Review no longer checks out fork PR heads: sensitive files, labels, reports, and AI reviews uniformly read PR metadata and diffs as data via GitHub API, executing trusted scripts from main branch only; Python syntax, Flake8, deterministic checks, and offline tests continue executing on secret-less `pull_request` CI / `backend-gate`, compatible with `actions/checkout` new fork checkout security protections.
- [Fixed] Fixed process hangs caused by registry reads during mimetypes cold start on Windows.

## [3.27.0] - 2026-07-19

### Release Highlights

- feat: Added Codex App Server single-agent stock query experimental prototype, keeping default pipelines including LiteLLM, Multi Agent, standard reports, and scheduled jobs unchanged.
- feat: Web AI Suggestions page supports saving decision style signals recalculated from historical report snapshots, completing deduplication, renewal, invalidation, and auditable guardrail semantics.
- feat: Introduced multi-strategy opinion structured output Phase 1 contract, covering opinion standardization, basic conflict detection, aggregation metadata, and report compatibility boundaries.
- improve: Report page clearly displays input data status, sources, anomaly impacts, handling suggestions, and diagnostic codes, distinguishing page intel from current analysis inputs.
- fix: Fixed MiniMax reasoning content polluting final JSON, string `<think>` wrapper compatibility, and multi-Agent post-risk override conclusions failing to converge to final signals.
- fix: Completed US equity real-time PE/PB valuation fields, multi-market tool descriptions, and macOS Gatekeeper installation troubleshooting notes.

### Features

- Added #1743 Phase 6 Codex App Server single-agent stock query experimental prototype, exposing three existing read-only Tool Surface tools; default LiteLLM, Multi Agent, Deep Research, standard reports, scheduled jobs, and Phase 1/2 `codex_cli` paths remain unchanged.
- Web AI Suggestions page supports confirming and saving decision style signals recalculated from historical report snapshots, distinguishing created, existing, and refreshed records with profile-aware deduplication and invalidation semantics.
- Structured multi-strategy opinions first version adds strategy opinion standardization, basic conflict detection, and aggregation metadata as milestone foundational contract for #1964; this version does not claim concurrent execution, full scheduler MVP, or multi-language frontend displays.

### Improvements

- Codex settings page checks configuration, command, and required protocols before allowing attempts, letting users submit questions upon saving; Chat submits via server `accepted` event and halts by actual backend.
- Web report page input data blocks reuse status, source, alert, and explanation fields, appending anomaly impact, handling suggestions, and diagnostic codes in explanation, distinguishing report page intel from current analysis inputs.
- Updated Anspire data source display info, correcting `get_stock_info` tool description from A-share specific to covering A-shares, HK stocks, and US equities.

### Fixed

- Fixed MiniMax analysis and channel JSON tests where reasoning content concatenated with final text caused unparseable and unpersistable results; string responses strip complete leading `<think>` tags only, preserving identical literal tags in JSON.
- Corrected timeout attribution for internal multi-Agent runtime facts, ensuring dashboard decision fields and one-sentence core conclusion finalize on post-risk signal after risk override.
- Converged multi-strategy synthesizer semantics: properly handles Signal enums, missing signals, valid opinion_count, and deterministic synthesis, tolerating relaxed field shapes from historical and external dashboards.
- Codex stock query accepts App Server finalized responses only, unifying total timeouts, cumulative outputs, events, tool budgets, and process termination boundaries.
- `codex_cli` standard analysis explicitly pins unattended approval policy and read-only sandbox, preventing newer Codex versions from interrupting non-interactive tasks with human approval requests.
- yfinance US stock real-time quotes add `pe_ratio` and `pb_ratio` for valuation analysis and downstream reporting.

### Documentation

- Documented architecture selection, security triage, and official package temporary release steps when unsigned, un-notarized macOS DMGs are blocked by Gatekeeper.

## [3.26.1] - 2026-07-12

### Release Highlights

- feat: Web home adds History, Watchlist, and Today workspaces, supporting batch analysis, today coverage checks, and score rankings.
- feat: Added A-share market structure and sector main themes context, connecting reports, Agent, DecisionSignal, and Web displays.
- feat: Feishu supports report delivery as file attachments; Multi-Agent supports independent per-sub-Agent timeout clamps.
- feat: Completed internal DSA Tool Surface, DecisionAgent divergence summary, and DecisionSignal profile contracts.
- fix: Unified report action terminology, fixing batch deletion of history records by stock symbol and silent truncation of notification reasons.
- fix: Improved stability for Web, desktop, data source caches, and release package assets.

### Features

- Added A-share market structure and sector main themes context, reused across reports, Agent, DecisionSignal, and Web market position cards.
- Feishu notifications add file upload capability: `FeishuSender.send_feishu_file(file_path)` uploads and sends file messages via App Bot SDK (`im.v1.file.create`); Webhook mode falls back to text content; added `FEISHU_SEND_AS_FILE=true` toggle delivering reports as files.
- Multi-Agent orchestration pipeline adds independent timeout clamps per sub-Agent: 6 environment variables configure independent hard ceilings for TechnicalAgent, IntelAgent, RiskAgent, DecisionAgent, PortfolioAgent, SkillAgent without competing for budget; defaults to 0 (disabled).

### Improvements

- Added internal low-sensitivity divergence summary input pipeline for multi-agent DecisionAgent, serving as preliminary plumbing for #1904 P1 explanation outputs; public API, dashboard schema, and final explanation fields remain unchanged.
- GitHub Actions daily analysis workflow maps TickFlow data source environment variables, consolidating README data source stability notes into full guide.
- Web home stock column adds History / Watchlist / Today toggles, preserving history default view, supporting one-click analysis of all or uncovered watchlist stocks, and viewing same-day analysis rankings by score on Today page; partial batch failures preserve confirmed counts and refresh task list.
- GitHub Actions daily analysis workflow adds DingTalk notification environment variable mapping, supporting DingTalk bot in cloud scheduled tasks.
- `STOCK_LIST` parsing supports common paste delimiters including Chinese comma, enumeration comma, semicolon, space, and newline; recognized across runtime, scheduled refresh, CLI `--stocks`, Web settings, and watchlist API, normalizing to English commas on save.
- Added `NEWS_INTEL_AUTO_FETCH_ENABLED` toggle; when enabled, stock analysis, Agent analysis, and market review fail-open to automatically initialize and refresh RSS/Atom/NewsNow local intel pool.
- Web AI Suggestions page adds primary stock context, reusing recent analysis and stock index candidates, improving zero-sample performance explanations.
- DecisionSignal upgrades `decision_profile` to formal nullable field, unifying same-profile queries, deduplication, renewals, and expiration semantics, maintaining create metadata `null` compatibility with SQLite idempotent backfill diagnostics.
- Settings page mobile category navigation converted to horizontal scroll list ensuring content is visible on first screen; desktop retains category explanations while tightening layout hierarchy and spacing.
- Added #1743 Phase 6a internal DSA Tool Surface contract, unifying tool schema, stock scope fail-closed guard, structured errors, audit summaries, and diagnostic boundaries, clarifying external AgentBackend capabilities still require wire-level proof.
- `src/services/analysis_service.py` backfills `details.raw_result` at `report` detail layer, aligning payload consistency with API/history details without altering provider, model, Base URL, or config migration semantics.

### Fixed

- Batch deletes history records by stock symbol across all matching items, rejecting blank symbols to prevent lingering records over 10,000 items or unfiltered deletion.
- Market structure concept rankings reuse negative results within current turn on empty or timeout responses, preventing batch analysis from repeatedly requesting identical concept ranking providers.
- Windows/macOS desktop packaging explicitly collects and validates AkShare `file_fold/calendar.json`, preventing release packages from degrading hotspot and screening daily bar enhancements due to missing calendar package data.
- DecisionSignal summaries shared across email, Telegram, and reports display complete sanitized reasons, eliminating unprompted truncation at 120 characters; Telegram chunks safely by final Markdown payload length.
- Push reports, Jinja reports, and history Markdown export reuse Web/API score-action mappings: high scores with legacy `operation_advice` set to hold without degradation reasons display as buy in suggestions and stats; retains hold/watch when explicit guardrail reasons exist.
- WebUI startup explicit `--host` / `--port` no longer overridden by `.env` `WEBUI_HOST` / `WEBUI_PORT`, standardizing on resolved runtime config when CLI arguments are omitted.
- Web home today status and rankings use timezone-offset historical timestamps and full pagination data, maintaining safety and accuracy across query failures, server timezone boundaries, and task completion refreshes.
- Web home stock bar refresh serialized: latest requests clear `stockBarRefreshFailed` on concurrent or out-of-order returns, preventing older responses from overwriting post-completion refresh results.
- Web portfolio page first-screen snapshot switches to `include_realtime=false` fast valuation, showing position list before prefetching per-stock real-time quotes to avoid long blank waits during slow external quote feeds.
- Fixed task status endpoint treating valid sentiment score `0` as null when reconstructing report action fields, ensuring low-score reports correct to sell recommendations by scoring rules.
- Fixed Agent streaming responses displaying as "(No content)" when disconnecting before completion event, prompting that streaming was interrupted while preserving user messages.
- Fixed desktop `WEBUI_HOST=*` / `WEBUI_HOST=[::]` passed verbatim to port probing and backend launch preventing listening, normalizing to `0.0.0.0` / `::` before launch.

### Documentation

- Added market data source configuration instructions (`TUSHARE_TOKEN` / Longbridge) to README quick start, clarifying free fallbacks like AkShare, Baostock, and YFinance when unconfigured, synchronizing bilingual full guides.

## [3.25.0] - 2026-07-03

### Release Highlights

- feat: Added `claude_code_cli` and `opencode_cli` generation-only local CLI backends, adding generation backend diagnostics, previews, smoke test APIs, and Web status panel.
- feat: Taiwan stock reports fully integrate Big Three Institutional data across rendering, LLM prompts, TWD currency labeling, closing auction identification, and fetcher resilience.
- feat: Added DingTalk group bot notifications, Korean report output, and AI suggestion decision style re-evaluation previews.
- feat: Standardized Agent `/chat/stream` progress events, adding stage start/done, pipeline timeout, and budget skipped semantics.
- fix: Fixed desktop WebUI host/port binding, macOS Homebrew CLI PATH diagnostics, Discord long report chunking, AlphaSift timeouts, yfinance dividend parsing, and A-share backtest symbol normalization.

### Features

- DingTalk group bot notifications support `DINGTALK_WEBHOOK_URL` and `DINGTALK_SECRET`, chunking long text automatically to adhere to 20KB limit.
- Added Korean report output language (`REPORT_LANGUAGE=ko`), covering stock reports, market reviews, prompt languages, decision guardrails, notification templates, and Web report details.
- Added `claude_code_cli` and `opencode_cli` generation-only local CLI backends, preserving LiteLLM default paths, Agent tool call boundaries, per-preset extractors, minimal env allowlists, and structured errors.
- Added generation backend status, preview, and smoke test APIs with Web status panel, distinguishing lightweight checks from JSON smoke tests, maintaining "generation only, no tool calling" boundaries.
- Agent `/chat/stream` progress events add `stage_start`, `stage_done`, `pipeline_timeout`, `pipeline_budget_skipped`, completing stage progress, timeout, and budget skip semantics.
- Taiwan stock report institution section displays raw TWSE T86 / TPEx Big Three Institutional net buy/sell volumes, injecting net buy/sell tables into LLM prompts as Taiwan market chip filters.
- Added AI suggestion decision style re-evaluation preview endpoint and page preview.

### Improvements

- Taiwan Big Three Institutional fetcher adds concurrent cache anti-stampede, TWSE/TPEx market circuit breakers, TPEx date protection, and remaining stage budget reuse, reducing degradation from rate limits and cold timeouts.
- Updated AlphaSift pinned dependency to `9f522747caafd3c0b1ddb7e14d5cf44c8580b6cf`, integrating wrapper data source caller-side timeouts, EastMoney direct rate limits/jitter, strategy catalog metadata, and defensive strategies.
- Screening task status polling prompts that background tasks retry automatically on recoverable timeouts, adding timeout tuning parameters to `.env.example`.
- Converged stock analysis scoring and DecisionSignal action thresholds into 80/60/40/20 tiers, recording raw/adjusted score, final action, and reasons on risk control degradation.
- Web settings category switching displays first-launch checks and AlphaSift helper cards only within relevant categories, reducing cross-category visual remnants.

### Fixed

- Fixed Windows desktop backend launch hardcoding `--host 127.0.0.1` causing `WEBUI_HOST=0.0.0.0` in `.env` to fail to bind across LAN; desktop defaults to `127.0.0.1`, binding to explicit config when `WEBUI_HOST` is set.
- Fixed desktop launch mismatch between `.env` `WEBUI_PORT` and Electron auto-selected port, preventing windows from timing out while connecting to obsolete ports.
- Fixed macOS desktop launched from Finder/Dock missing Homebrew Codex CLI in backend PATH, adding explicit diagnostics for Codex CLI primary analysis vs Agent LiteLLM tool routing.
- Fixed Discord long report pushes chunking at 2000 character limits with finite retries on 429 rate limits via `retry_after`/`Retry-After`, avoiding partial report deliveries.
- Fixed Japanese, Korean, and Taiwan stock `market_phase` closing auction recognition, preventing near-closing periods from being labeled as standard `intraday`.
- Fixed A-share stock analysis failing to look up associated sectors upon encountering empty `belong_boards` placeholders, resolving unstable sector module displays.
- Fixed market reviews intermittently missing sector themes in Web and push notifications when LLM titles drifted or body text lacked sector paragraphs.
- Fixed Web market review structured data formatting for turnover, index points, price changes, and high/low values, avoiding floating-point long tails or literal `0.00` missing values.
- Fixed Web home stock column hiding sentiment scores and suggestion badges when stock-bar summary fields were missing or actions could not be classified.
- Fixed Web settings scheduled task "Run Once Immediately" background thread crashing due to omitted `stock_codes`.
- Fixed `opencode_cli` static instructions, preventing global JSON-only constraints from breaking `generate_text()` and market review free text output.
- Fixed yfinance 1.2.x dropping dividend parsing when `Ticker.dividends` returned single-column DataFrame, restoring TTM dividend per share and payout frequency calculations.
- Fixed Taiwan stock financial currency labeling, designating TWD amounts as "New Taiwan Dollar" to avoid misreading as RMB in A-share contexts.
- Fixed backtest daily bar backfilling requesting `SS605066` from data sources for equivalent A-share codes like `605066.SH`, `SS605066`, `SS.605066`, resolving insufficient backtest data.

### Documentation

- Added Agent `/chat/stream` progress event contract documentation, clarifying new event fields, Web compatibility boundaries, validation, and rollback procedures.
- Synchronized local CLI backend privacy and deployment boundaries, clarifying local CLIs are not offline models, requiring manual installation and login in Docker/CI/remote, with DSA never reading Claude/OpenCode credentials.
- Updated README trilingual entries and market support boundaries, documenting Taiwan stock `.TW` / `.TWO`, Big Three Institutional report sections, TWD labeling, and closing auction detection.

### Tests

- Added live-smoke script and `@pytest.mark.network` drift detection tests for Taiwan Big Three Institutional fetcher, validating TWSE T86 / TPEx core fields and parsing in non-blocking network-smoke scheduled runs.

## [3.24.1] - 2026-06-28

### Fixed

- Corrected Longbridge SDK version constraints to select installable versions by platform, preventing desktop and Docker release failures during `pip install -r requirements.txt` caused by non-existent version `0.2.75`.

## [3.24.0] - 2026-06-28

### Release Highlights

- feat: Expanded Taiwan, Japanese, and Korean stock market support, covering Taiwan suffix-only analysis, Taiwan Big Three Institutional data layer, JP/KR market reviews, and cross-service market enums.
- feat: Added GenerationBackend abstraction, `codex_cli` local CLI backend, reserved Hermes local HTTP channel, and prompt cache capability registry.
- feat: Supported multi-time scheduled pushes and hot-reload of runtime scheduler across Web/API/Desktop, adding first-launch check and scheduled task panel to Web settings.
- feat: Enriched reporting pipeline with signal attribution, single-stock signal timeline, concept sector rankings, and notification/report associated sector displays.
- fix: Fixed Docker/startup probes, static asset MIME types, empty backtest results, portfolio valuation, notification Markdown, AlphaSift data sources, and test environment isolation stability issues.

### Features

- Added Taiwan stock suffix-only single-stock analysis MVP: `.TW`/`.TWO` symbols route to YFinance daily bars and near real-time quotes, completing market identification, trading calendar, and prompt boundaries.
- Incorporated Taiwan market `tw` into DecisionSignal, Portfolio, Intelligence service layer, API enums, and Web filters, preventing Taiwan stock analysis signals from being silently discarded by market normalization.
- Added Taiwan Big Three Institutional data layer fetcher `TwInstitutionalFetcher`, supporting TWSE/TPEx sources, date conversion, single-day caching, and fail-open degradation.
- Added `jp`/`kr` markets to market review, supporting Nikkei 225/TOPIX and KOSPI/KOSDAQ index reviews, extending `MARKET_REVIEW_REGION`, trading day filtering, and Web settings enums.
- Added GenerationBackend Phase 1 abstraction and explicit opt-in `codex_cli` local CLI generation backend, providing structured errors, fallback, stream degradation, and usage unavailable contracts.
- Added reserved Hermes local HTTP generation channel, providing JSON generation, no-proxy local invocation, and saved secret endpoint binding.
- Added Provider Cache Capability Registry, modeling prompt cache capabilities by provider, API surface, gateway, and verification status.
- Supported `SCHEDULE_TIMES` multi-time scheduled pushes; long-running Web/API/Desktop processes hot-start/stop or rebuild runtime scheduler after saving scheduling configuration.
- Added signal attribution analysis and single-stock signal timeline on Web AI Suggestions page, writing default `decision_profile` metadata for auto-generated and historical backfilled DecisionSignals.
- Enriched market review, Web report page, and notification associated sectors with concept sector leaderboards and concept signal displays.

### Improvements

- Expanded TickFlow as optional data source for A-share daily bars, real-time quotes, and stock lists/names, adding count, integrity validation, and batch prefetch cache protection.
- Hardened JP/KR/TW suffix recognition, JP/KR stock seed index, YFinance quote/fundamental context, and JP/KR Portfolio and Market Light boundaries.
- Added first-launch configuration check card and scheduled task panel to Web settings, hiding internal `SCHEDULE_TIMES` key and improving dismiss and auto-fade experience for duplicate task notices.
- Web history report details no longer embed AI suggestion cards; structured decision signals consolidated into AI Suggestions page with source report ID/URL parameters for precise navigation.
- Standard analysis and market review under `GENERATION_BACKEND=codex_cli` no longer falsely reported unavailable due to missing LiteLLM API Key, using `--output-last-message` file to read final response.
- Local CLI backend enforces runtime cumulative cap on stdout/stderr diagnostic previews and final responses, adding maximum value validation for new generation backend numeric configs.
- Updated default AlphaSift pinned dependency to `0a7b9cd59e81718f851890535241bc105d4ddc64`, routing to DSA EastMoney fallback provider by default and exposing source health diagnostics.
- Increased Docker Compose default memory recommendation to 1G; daily analysis workflow accommodates scenarios where `STOCK_LIST` was configured in same-named Environment variables.
- Synchronized signal attribution prompt across Agent paths; notification report summary no longer expands AI decision signal details, preserving full signals in stock details and single-stock reports.

### Fixed

- API async batch analysis shares concept sector ranking cache, preventing redundant full-market concept ranking pulls for multiple stocks in the same batch.
- Fixed notification Markdown table conversion misaligning content under incorrect headers following empty cells.
- Fixed Market Light region normalization rejecting `jp`/`kr`, mispassing `analysis_phase` in JP/KR history market phase summaries, and missing `dashboard.phase_decision` in default notification reports.
- Pinned Docker installable Longbridge SDK version to 0.2.75, fixing A-share data source fallback caused by efinance cache directory ownership in Docker image.
- Portfolio snapshot today's valuation changed to concurrency-limited prefetching of real-time prices, reducing Web portfolio page refresh timeouts with large position counts.
- Web homepage re-analysis automatically switches to latest report for the same stock upon completion; fixed issue where static JS assets in Windows Web/Desktop could return as `text/plain` causing blank screens.
- Fixed state disconnect between `--serve --schedule` and Web/API runtime scheduler, false busy alerts during immediate execution, duplicate listeners on scheduled task rebuilds, and startup parameter semantic loss.
- Fixed `main.py --serve-only` recurring restarts on low-resource hosts caused by lazy app imports exceeding uvicorn startup health-check window.
- Fixed Web backtest returning empty results on successful responses when date range was omitted or stock symbol was unnormalized; provided diagnostics for empty candidates, insufficient market data, and invalid suffixes.
- Fixed unsupported `GENERATION_BACKEND` being treated as empty response/template fallback, `codex_cli` stdout double-counting against output limit, and primary analysis JSON schema fallback semantic regression.
- Web settings in Docker escapes placeholders like `$content_json` when saving custom Webhook templates and restores them at runtime, preventing empty expansion upon Compose redeployments.

### Documentation

- Completed concept sector leaderboard field contracts, notification report industry/concept type column displays, and data source stability and troubleshooting diagrams.
- Added JP/KR/TW suffix-only MVP, `MARKET_REVIEW_REGION` save/validate/fallback matrix, Market Light boundaries, and PR submission process constraints.
- Added local CLI backend privacy boundaries, non-offline model notes, Docker/CI login session constraints, and `codex_cli` experimental/limited status.
- Added backtest request pipeline documentation, synchronizing examples in `docs/full-guide.md` and `docs/full-guide_EN.md`.

### Tests

- Added/updated regression tests for Taiwan stocks, JP/KR market reviews, GenerationBackend, `codex_cli`, Hermes, local CLI, runtime scheduler, backtests, and concept sector rankings.
- Strengthened temporary `.env` isolation in `tests/test_analysis_api_contract.py`, `tests/test_analysis_history.py`, and `tests/test_backtest_service.py` to prevent local `.env` from contaminating system config tests.

## [3.23.0] - 2026-06-20

### Release Highlights

- feat: DecisionSignal connects report extraction, Web display, feedback/backtesting, alert notifications, and portfolio risk, bringing AI recommendation signals into a trackable closed loop.
- feat: Added compliant RSS/Atom and NewsNow news intelligence source pool; analysis, Agent, and market review can fail-open to reuse local intelligence evidence.
- feat: Added Japan/Korea suffix-only stock analysis MVP, supporting `.T`, `.KS`, and `.KQ` tickers via YFinance for quote and technical context.
- feat: Added Token Usage Monitoring Dashboard, legacy LLM usage telemetry, and message stability audit, improving LLM call observability.
- fix: Fixed execution flow live state, AlphaSift cache/field compatibility, release notes diagnostics, and Japan/Korea stock input/history displays stability issues.

### Features

- After successful stock analysis history persistence, best-effort extracts `DecisionSignal` decision signals from final reports, reusing existing signal deduplication, price plan quality scoring, and sanitization contracts.
- Added Web AI Suggestions page, portfolio page latest active signal summaries, historical report signal displays, and enriched signal detail cards, displaying scores, confidence, price plans, catalysts, risks, and invalidation conditions.
- Added DecisionSignal user feedback, signal-level daily bar backtesting evaluation, statistics API, and Web displays, utilizing outcome/feedback sidecar tables while preserving primary signal table contracts.
- Reused DecisionSignal across alerts, notifications, and portfolio risk: alert triggers link latest active signals or create minimal alert signals, notifications append low-sensitivity signal summaries, and portfolio risk aggregates active sell/reduce/alert signals with fail-open behavior.
- Added compliant RSS/Atom news source configuration, fetching, deduplication, storage, querying, retention, and basic security validation APIs as stock/market intelligence pool baseline.
- Added `newsnow` source type, `NEWSNOW_BASE_URL` configuration, and `/api/v1/intelligence/sources/defaults` default source initialization endpoint, pre-bundling financial news sources including CLS Hot, Xueqiu Hot Stocks, Wallstreetcn Alerts, Jin10 Data, and Gelonghui Events.
- Stock analysis, Agent analysis, and market review fail-open to local intelligence pool, passing source links as news context and evidence inputs.
- Added Japan/Korea suffix-only stock analysis MVP: manual entry of `.T` / `.KS` / `.KQ` tickers routes to YFinance daily bars and near real-time quotes, completing market identification, trading calendars, prompt semantics, Web/API types, and capability boundary documentation.
- Added Token Usage Monitoring Dashboard and `/api/v1/usage/dashboard` API, displaying total LLM calls, Prompt/Completion split, model usage, call type distribution, and recent call details.

### Improvements

- Completed default lifecycle, same-source narrow relaxed deduplication, automatic invalidation of opposing active signals, terminal state non-revivable PATCH, and low-sensitivity market phase hints extraction for `DecisionSignal`.
- Supplemented Web decision-signals typed API wrapper and contract isolation tests, converging historical report AI suggestion queries to precise report lazy extraction.
- DSA data source pipeline added direct Tencent daily K fetcher, daily source health short-term circuit breaker, and upgraded default AlphaSift pin/runtime bridge.
- Enabled `DAILY_SOURCE=auto`, Sina snapshot priority, candidate-level quote context, and LLM ranking timeout/max tokens boundaries by default.
- Added legacy LLM usage provider/cache telemetry, message HMAC diagnostic fields, and standard stock analysis legacy message stability audit, without changing public Usage API, prompt, or provider parameters.
- Stock query mobile strategy selection changed to collapsed button trigger by default, expanding to allow multi-strategy selection and auto-collapsing after sending, reducing conversational screen obstruction.

### Fixed

- Fixed execution flow live SSE sanitization, late LLM/notification card duplication, premature data source aggregation card success, Web homepage narrow sidebar compressing stock info, and runtime diagnostic crosstalk when stock analysis auto-generates market context.
- Fixed AlphaSift hotspot topic empty state during EastMoney intermittent dropouts without cache, desktop update hotspot cache retention, and `leader_stocks` / `stocks` dual-field compatibility.
- Fixed Web AI Suggestions page filtering/status update pagination, price plan single-sided entry price display, portfolio latest signal refresh, detail JSON secure rendering, and card interaction semantics.
- Restricted historical report lazy backfill triggers to explicit `action` or parseable actions, preventing mis-backfills under unclear advice for statistical criteria like `decision_type=hold`.
- Fixed #1390 P6 DecisionSignal omission in portfolio risk snapshot semantics and default aggregated notification displays.
- Disabled `/api/v1/intelligence/sources/defaults` new sources by default to prevent public sample NewsNow instances from being enabled by default; unified 500 error details to logs only, returning generic error messages in responses.
- Web stock auto-complete, input validation, history/task displays, and screening completed Japan/Korea Yahoo suffix codes, popular Japan/Korea stock indices, and bare code parsing, preventing crashes, accidental A-share routing, or split history displays for `000660`, `005930`, `7203.T`, `005930.KS`, `035720.KQ`.
- Japan/Korea stock analysis falls back to YFinance daily bars to construct K-line and technical indicator context when local history is missing, preventing reports from erroneously stating core quote and technical data are unavailable.
- Release notes generation query PR author failure retains fallback and outputs warnings containing PR numbers and exception types for troubleshooting tokens, permissions, networks, or GitHub API errors.

### Documentation

- README, Full Guide, and market support documentation supplemented Japan/Korea stock examples (`7203.T`, `005930.KS`), clarifying `.T/.KS/.KQ` as currently YFinance-only MVP.
- Added DecisionSignal specialized documentation, completing fields, API, Web, alert notifications, portfolio risk, posterior evaluation, sanitization, migration, and rollback notes, converging Web i18n display boundaries.
- Documented AlphaSift migration and rollback boundaries: clarified `ALPHASIFT_INSTALL_SPEC` explicit override semantics, `requirements.txt + DEFAULT_ALPHASIFT_INSTALL_SPEC`, and runtime compatibility boundaries.
- Documented news intelligence source baseline, explaining `NEWS_INTEL_*` configurations, NewsNow self-hosted recommendations, model/provider/base URL non-mutation boundaries, and rollback paths for disabling or removing intelligence variables.

### Tests

- Added/updated regression coverage for DecisionSignal service, extraction, feedback/evaluation, summaries, documentation, notifications, alerts, portfolio risk, Web display, and labels.
- Added/updated RSS/Atom / NewsNow intelligence source service, API, security validation, analysis integration, and configuration compatibility tests.
- Added/updated Japan/Korea market identification, stock indices, YFinance quote fallback, Web auto-complete, and input validation tests.
- Added/updated regressions for LLM usage, execution flow, AlphaSift, release notes generation, and mobile interactions.


## [3.22.0] - 2026-06-13

### Release Highlights

- feat: Added independent DecisionSignal storage and API, execution flow snapshot API, and Web execution flow view, completing recommended action structured fields and history/backtest display pipelines.
- feat: AlphaSift hotspot topic pipeline upgraded to new contract, supporting hotspot leaderboards, topic details, development routes, concept stock details, caching, and fallback data sources.
- feat: Stock analysis injects same-day market environment summary by default, softening aggressive buy recommendations in high-risk/declining market environments.
- fix: Fixed stability issues including stock query follow-up target context, watchlist equivalent symbol matching, low-quality news filtering, execution flow sanitization, and AlphaSift hotspot detail displays.

### Features

- Added independent `DecisionSignal` storage, Repository, Service, and `/api/v1/decision-signals` API, supporting deduplication, queries, renewals, status updates, lazy expiration, portfolio filtering, and sensitive data sanitization by source/market/stock/action/horizon/phase.
- Added execution flow snapshot API for analysis tasks and historical reports, offering unified contracts (lanes, nodes, edges, events, summary) and building sanitized data/information flows from task queue, diagnostics, and AnalysisContextPack overview.
- Web added execution flow view entry points for active tasks, historical reports, and market reviews, supporting review summaries, topology nodes, event streams, and basic troubleshooting details.
- Added AlphaSift hotspot topic pipeline: backend provides `/api/v1/alphasift/hotspots` and `/api/v1/alphasift/hotspots/{topic}` APIs; Web stock picker adds hotspot topic area supporting development routes and concept stock inspection.

### Improvements

- Stock analysis adds same-day/market reusable market environment summary; standard pipeline and Agent prompts read low-sensitivity market background; added `DAILY_MARKET_CONTEXT_ENABLED` enabled by default, user-configurable to disable.
- Stock analysis and history/backtest displays add optional eight-state `action` / `action_label` recommended action fields, preserving `operation_advice` free text and `decision_type=buy|hold|sell` statistical metrics.
- Completed Web decision-signals typed API wrapper and contract isolation tests, not yet connected to UI.
- Enhanced runtime logging context with logger name, trigger source, market statistics, and live quote prefetch status, facilitating troubleshooting across scheduler, API, Bot, and fallback paths.
- Portfolio management page adds portfolio account deletion entry point, reusing existing account soft-delete endpoint; miscreated accounts hidden from default list, snapshots, risk, entry forms, and event lists without purging historical ledger.
- Updated AlphaSift dependency pin to `d038c52c468543726fc1fd830b53c27d3f09d6da`, adapting DSA runtime and Web for new last-good snapshot, daily history, industry/concept provider cache, hotspot leaderboard, development routes, concept stock details, cached hotspots, and post-analysis metadata.
- AlphaSift hotspot reading prioritizes last successful cache by default, pulling live and updating cache only on manual refresh, falling back to old cache on live pull failures.
- AlphaSift hotspot topic area collapsed by default, fetching details only when expanded and specific topic is selected; development routes displayed as timeline with timestamps; concept stocks clickable to launch home analysis.
- AlphaSift hotspot data pipeline reuses same EastMoney sector anomaly snapshot, deriving trend score, persistence score, phase, and leading stock samples from real price changes, anomaly counts, and high-frequency stocks.
- AlphaSift hotspot refresh falls back to DSA EastMoney sector anomaly direct leaderboard when contract returns few or missing key fields, ignoring local hotspot caches under 3 items and populating sector fallback fields.
- AlphaSift hotspot cards converted to compact multi-column layout; concept stock list adds standalone "Analyze" button to trigger analysis; details merge EastMoney constituents, TongHuaShun analysis, and sector anomaly leader fallbacks, aggregating daily timelines.
- AlphaSift hotspot details add DSA-side 30-minute disk cache, reusing timeline and concept stock details when reopening same topic; events display authentic sources only (AlphaSift contract timeline, TongHuaShun summaries, configured news search, EastMoney anomalies).
- AlphaSift hotspot news catalyst converted to summary display: compresses into single-sentence catalyst summary when LLM is configured, falling back to local short summary when unconfigured or invocation fails.
- AlphaSift hotspot list adds optional `include_details` prefetch; Web batches top topic development routes and concept stocks with hotspot list by default, reusing frontend memory cache; news catalyst falls back to local event summary when LLM is unavailable.
- Refactored `main.py --webui-only` startup behavior: fails fast with clear error and exits immediately if FastAPI port is already occupied.

### Fixed

- Follow-up questions in chat entering from historical reports retain current target; restoring existing sessions recovers base target, blocking incorrect stock tool calls, exchange fragments, and indicator routing when unswitched.
- Watchlist addition and deletion match Hong Kong stocks and case-insensitive US stock variants by equivalent symbols, avoiding `00700`, `HK00700`, `00700.HK` or `aapl`, `AAPL` being misjudged as distinct targets.
- Tightened recommended action legacy fallback: negative/avoidance phrases, Chinese financial context, `buy or sell`, multi-guard ambiguous text, and English compound words no longer misrendered as action badges; backtest/trend displays show action labels by UI language when structured `action` is present.
- Stock news and multidimensional intel search add domain-agnostic gating filter after relevance ranking, eliminating download/installer/app rating pages and adult/spam spam sites, dropping `score=0` background padding when valid target/industry candidates exist.
- Fixed historical report execution flow snapshot returning 500 under mixed-timezone event timestamps.
- Fixed live execution flow SSE events not reusing snapshot-level recursive sanitization rules, preventing local paths, prompt/raw responses, and proxy headers from brief exposure before refetch.
- AlphaSift hotspot default loading returns empty state when un-cached and old adapter lacks `alphasift.hotspot` module, preventing premature "AlphaSift not ready" errors on opening stock picker; manual refresh still prompts for dependency updates.
- Added column fallbacks for TongHuaShun development routes: skips source enrichment without breaking hotspot detail API response when `stock_board_concept_summary_ths` returns missing columns.
- Desktop release packaging uses frozen executable runtime probe to verify `alphasift.dsa_adapter`, preventing macOS PyInstaller embedded modules from false missing detections via filesystem/zip scans.
- AlphaSift hotspot details prioritize backend-fused `route`, preventing old `timeline` from overwriting news/LLM summaries; manual refresh bypasses detail cache for same topic.

### Documentation

- Added video tutorial link to quick start in README and Traditional Chinese README; updated desktop client entry copy to client configuration tutorial.
- Added `docs/alphasift-integration.md`: clarified AlphaSift locked commit origin, Hotspot contract boundaries, LLM/LiteLLM compatibility semantics, and fallback paths when disabled.
- Documented #1381 runtime scope, compatibility boundaries, official semantic basis, and standard release rollback instructions.

### Tests

- Verified #1381 backend runtime and compatibility: `tests/test_main_schedule_mode.py`, `tests/test_pipeline_daily_market_context.py`, `tests/test_daily_market_context.py`, `tests/test_daily_market_context_guardrail.py`, `tests/test_agent_executor.py`, `tests/test_config_env_compat.py`, `tests/test_config_registry.py`, and `apps/dsa-web/tests/system_config_i18n.test.ts`.
- Added/updated AlphaSift backend regressions: `python -m pytest tests/test_alphasift_api.py -q`, `python -m pytest tests/test_docker_entrypoint.py -q`, `python -m pytest tests/test_main_schedule_mode.py -q -k "start_api_server_fails_before_thread_when_port_is_busy"`.

## [3.21.0] - 2026-06-07

### Release Highlights

- feat: Added Web UI Chinese/English language toggle and Feishu App Bot notification mode, improving multi-user deployment and enterprise notification experiences.
- feat: Market review reports, historical entries, and stock bar converged to structured data and unified Markdown/GFM rendering; Web/API manual triggers no longer short-circuited by trading day gate.
- feat: AlphaSift screening pipeline converted to resumable background tasks, completing DSA LLM runtime bridge, default adapter pre-bundling, and compatibility regressions.
- fix: Fixed residual Chinese in English interface, diagnostic displays, runtime env var displays, health checks, desktop update paths, workflow variable resolution, and multiple Web narrow layout issues.

### Features

- WebUI added independent interface language state and Chinese/English toggle across main navigation, home, login, settings, and common widgets; UI language decouples from `report_language` without modifying report language pipeline.
- Feishu notifications added App Bot mode, supporting configuration via `FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_CHAT_ID` without creating custom webhooks.
- Web market review report added dedicated view; historical entries and home immediate results uniformly render via Markdown/GFM, hiding single-stock-specific modules.
- Market review added structured `market_review_payload`; Web, historical details, and pushes render based on structured data while retaining Markdown compatibility.
- Added default-off AlphaSift screening tab, controlled via `ALPHASIFT_ENABLED`, retaining `/install` as explicit repair path.

### Improvements

- Web/API market review manual trigger no longer short-circuits due to trading day checks or market holidays; scheduled tasks, GitHub Actions manual runs, and CLI defaults preserve original trading day gates.
- AlphaSift Web screening switched to background task submission and status polling with resumable status displays, avoiding browser timeout on slow external snapshots, quotes, or LLMs.
- AlphaSift screening API and service layer converged to `AlphaSiftService`, with endpoints handling routing parameter reception and error mapping only.
- AlphaSift and DSA runtime LLM compatibility bridge injected during invocation, preserving `provider/model/base_url/custom headers/fallback` semantics without persistent migration.
- Web home sidebar no longer displays market review history separately; latest review merges into stock bar as `MARKET`, sorted by analysis timestamp and reusing selection, deletion, full report, and trend views.
- Multi-stock notification reports consolidate market phase into a single `Market Status` line under overview, no longer repeating data quality and limitation details under each stock summary.
- API error response construction consolidated into shared helpers, preserving error envelope shapes and reducing endpoint boilerplate.
- WebUI binding to public IP or unrestricted CORS without admin authentication outputs runtime warnings, improving observability without blocking startup or rewriting configs.
- Database initialization added `schema_migrations` baseline table and idempotent tracking for schema evolution, without migrating, wiping, or modifying business data.
- #1386 P6 Reused market phase and AnalysisContextPack public summaries to link alerts, portfolio manual analysis, history, backtests, and notifications, without adding database migrations.

### Fixed

- Web English interface completed localization for backtesting, portfolio risk, and alert rule strings, eliminating residual Chinese filters, buttons, and enum labels.
- Institutional analysis and earnings expectation dimensions in news intelligence search expanded to 180-day provider request window, preventing short news windows from missing periodic financial reports.
- Web stock bar and historical cards in narrow layouts no longer let market phase badges overlap stock names.
- Free-text stock query follow-ups no longer misidentify financial acronyms like TTM, PE, YOY as stock tickers.
- [Fixed] GitHub Actions daily analysis workflow prioritizes Variables over Secrets when reading self-hosted SearXNG instance URLs, fixing URL not taking effect when configured in Variables only.
- Web/Desktop left navigation active states implemented with border, preventing blue vertical indicators from overflowing sidebar; sidebar width expanded from 116px to 136px with new rail compact mode.
- Windows desktop auto-updater no longer pre-quotes installation directory, preventing paths with spaces from triggering system popups stating "Missing shortcut / Cannot find Daily Stock Analysis.exe".
- Agent analysis pipeline reuses persisted daily bar analysis context before generating AnalysisContextPack overview, preventing false `daily_bars_missing` when daily bars fetched successfully.
- Corrected market review structured `breadth` availability check: omits `breadth` when unsupported or fetch fails, displaying "No data available" rather than misleading zero.
- Market review language behavior follows global `report_language`, localizing market tags and strategy blueprints for US Chinese reports, avoiding English strategy paragraphs.
- Docker Web settings page reading configuration falls back to startup-injected env vars when active `.env` lacks items, documenting volume mount boundaries.
- Report page runtime diagnostics distinguish between successful data fetch and LLM input ingestion, labeling related news section as supplementary intelligence to prevent state misinterpretation.
- `/health` root health check consistently returns JSON, preventing static Web fallbacks from swallowing health probes; preserves compatibility for `/api/health` and `/api/v1/health`.
- `ALPHASIFT_ENABLED` disabled state avoids triggering `alphasift` runtime injection; when enabled, prioritizes configured DSA/provider settings and injects `LITELLM_*` and `LLM_*` runtime variables.
- Verified fallback chains and compatibility paths for openai-compatible base URL, `extra_headers`, and `LITELLM_FALLBACK_MODELS`.
- Desktop and container build pipelines pre-bundle AlphaSift adapter matching runtime, eliminating `pip install` as live runtime repair dependency.

### Documentation

- Clarified Issue #777 UI language switching implementation via in-repo `UiLanguageContext` + `uiText`, persisting under key `dsa.uiLanguage`, with visual acceptance guidelines.
- Documented market review display pipeline, structured payload, language behaviors, trading day gate nuances, and rollback boundaries.
- Documented LLM / LiteLLM compatibility key fallback boundaries in Settings display and validation context, explaining existing provider/model/base URL configurations are never rewritten.
- Completed #1602 runtime diagnostic criteria repair scope, clarifying unification of input and display criteria with standard release rollback procedures.
- Clarified AnalysisContextPack P6 documentation, migration, and rollback boundaries, synchronizing `SAVE_CONTEXT_SNAPSHOT` to `.env.example`, config registry, Web settings help, and Full Guide.
- Completed #1386 P7 pre-market, intraday, and post-market analysis entry points, migration, rollback, and user-visible documentation.
- Added official compatibility documentation for AlphaSift runtime bridge, detailing provider, model, base URL, extra headers, and fallback boundaries.

### Tests

- Web runs `npm run lint`, `npm run build`, Vitest, and smoke tests; smoke tests skip by design when `DSA_WEB_SMOKE_PASSWORD` is unset.
- Web test runtime declares Node `>=20.19.0 <27` and npm `>=10`, adding localStorage test fallbacks to stabilize Vitest.
- Added static verification for AlphaSift runtime bridge and packaging scripts, covering `LLM_CHANNELS`, `LITELLM_FALLBACK_MODELS`, `alphasift.dsa_adapter`, and `--collect-all alphasift`.

### chore

- Removed screenshot assets mistakenly committed during issue/PR review workflows, clarifying temporary screenshot evidence belongs in PR descriptions, comments, attachments, or artifacts, not as repository files.

## [3.20.0] - 2026-06-03

### Release Highlights

- feat: Added AlphaSift stock screener entry point, automatic installation, and stable adapter layer, supporting Web strategy execution, LLM reranking displays, and default-off controlled enablement.
- feat: Enhanced visibility of single-stock history, watchlist queue, market phase, and AnalysisContextPack, strengthening structured context for Web reports and API.
- feat: Upgraded default MiniMax model to `MiniMax-M3`, completing pricing, presets, and test coverage.
- fix: Fixed stability issues across health checks, Windows desktop updates and first-run encoding, ETF daily bar secid, LLM base_url validation, and Agent daily bar context false-missing.

### Features

- Added default-off AlphaSift stock screening tab, reading strategies via stable adapter layer and executing screening when enabled via `ALPHASIFT_ENABLED`.
- Web home left sidebar changed to stock bar, displaying deduplicated stocks with market review pinned at top, clicking a stock loads its latest report, supporting deduplication and merging across code variants (.SZ/.SH/.SS); retained select-all, batch-delete, and delete confirmation modal; added batch delete API `DELETE /api/v1/history/by-code/{stock_code}`.
- Report details right sidebar added watchlist action button, displaying whether current stock is in watchlist with one-click add or remove; market review reports omit this action.
- Stock query input box added watchlist action button above prompt input, displaying add-to-watchlist / remove-from-watchlist entries after user sends message containing stock code.
- Web report page added historical trend drawer entry for same stock, enriching summary with trends, summaries, models, and quote context at analysis time, supporting viewing history and loading more.
- AnalysisContextPack P4 low-sensitivity overview connected to historical details, synchronous analysis responses, completed task status, and Web report page, displaying data block status, sources, missing reasons, and degradation summaries.
- #1386 P5 Added `dashboard.phase_decision` intraday decision guardrails to stock analysis reports, constraining high-confidence intraday buy/sell conclusions based on market phase and data quality prior to history persistence.
- #1386 P4a Added `analysis_phase=auto|premarket|intraday|postmarket` API parameter, passing requested phase through async task accepted, in-memory status, list, SSE, and analysis pipeline.
- #1386 P4b Web report page added final market phase badge, task panel displaying requested phase, and reused AnalysisContextPack low-sensitivity data quality summary.
- MiniMax channel model list upgraded: added `MiniMax-M3` as default, supporting 1M input context per official OpenAI-compatible docs (conservatively registered in `<=512K` pricing tier: context_window 512K, `max_tokens` 128K, corresponding to $0.6/M input, $2.4/M output, >512K unmodeled), retaining `MiniMax-M2.7` and `MiniMax-M2.7-highspeed`, and retaining `MiniMax-M2.5` legacy pricing entry for cost estimation; Web settings MiniMax preset models and prices refreshed per M3.
- Added AnalysisContextPack P1 internal contract and sanitization serialization tests.
- Market phase low-sensitivity summary integrated into historical details, synchronous analysis responses, and report metadata for completed task statuses.

### Improvements

- First-run configuration validation supplemented diagnostic checks for missing AI Key, empty STOCK_LIST, Telegram/email paired fields, and Webhook URL prefixes.
- AlphaSift screening entry in Web sidebar moved below "Stock Query", aligning with Agent/research auxiliary workflow.
- Pre-bundled default AlphaSift adapter in Docker image build stage, matching desktop release bundles to avoid extra runtime installations.
- AlphaSift stock screening switched to relying on stable `alphasift.dsa_adapter` interfaces, with Web strategy list dynamically supplied by AlphaSift rather than hardcoded on frontend.
- AlphaSift stock picker adds Run ID, snapshot counts, filtered counts, factors, and risk details, displaying real specifics upon candidate expansion, currently open to A-shares.
- Web settings added AlphaSift screening toggle card to enable or disable screening tab directly.
- Enabling AlphaSift toggles `ALPHASIFT_ENABLED` and verifies adapter availability, auto-invoking controlled installation without requiring manual installation clicks.
- When AlphaSift is enabled but adapter is missing, strategy list and screening APIs serialize automatic installation from locked sources with forced reinstallation to overwrite legacy packages.
- AlphaSift screening page merges duplicate snapshot fallback notices, preserving AlphaSift native Tushare-first snapshot logic.
- AlphaSift screening page displays warning/source error/parse error on LLM reranking degradation, avoiding mislabeling local factor scores as LLM judgements.
- Web settings no longer displays `ALPHASIFT_ENABLED` as generic data source config item, retaining value solely as persistent state behind "Enable Screening" button.
- Hides "Screening" navigation link when AlphaSift is disabled to avoid misleading users.
- Supplemented custom strategy display logic for AlphaSift, preventing unmatched presets from defaulting to "Balanced Multi-Factor".
- Added `GET /api/v1/history/stocks` endpoint returning unique stock list grouped by code; added `GET /api/v1/stocks/watchlist`, `POST /api/v1/stocks/watchlist/add`, `POST /api/v1/stocks/watchlist/remove` endpoints supporting watchlist CRUD; `STOCK_LIST` read/write preserved as-is without auto-normalization, normalizing comparisons during add/remove to handle ticker variants.
- Added `useWatchlist` hook standardizing watchlist frontend state, reusing `STOCK_LIST` in SystemConfigService for persistence.
- AnalysisContextPack P5 added data quality scoring, `fetch_failed` status, Prompt data limitations block, and low-sensitivity Web quality display.
- #1386 P2-full appended cross-constraints for market phase and degraded data in AnalysisContextPack Prompt limitations, correcting phased quote labels in Chinese prompts.
- Notification report default delivery restored legacy channel conversion and chunking logic, retaining renderer capability for future extensions.
- Related sectors missing category data display sector names in single line, avoiding table columns filled with `N/A`.
- Optimized Web report detail information hierarchy, moving input data blocks and diagnostics below body as collapsible auxiliary sections.
- Intraday analysis completed real-time quote fetch time, provider time, stale, fallback, and partial/estimated flags for AnalysisContextPack input data limitations.

### Fixed

- Agent analysis pipeline reuses persisted daily bar analysis context before generating AnalysisContextPack overview, avoiding false `daily_bars_missing` when daily bars fetched successfully.
- Registered `/api/v1/health` route with auth exemption, fixing 404 returns and 401 unauthorized errors on health probes when `ADMIN_AUTH_ENABLED` is enabled.
- Windows local first-run environment check supports non-UTF-8 console outputs, converting `requirements.txt` comments to ASCII to reduce install failures under default code pages.
- AlphaSift DSA adapter enables LLM reranking by default with explicit `use_llm=True`, displaying LLM scores, judgements, coverage, and watchpoints.
- AlphaSift embedded in DSA reuses DSA's resolved LLM models, channels, and secret keys, preventing screening LLM reranking from degrading due to missing provider keys.
- AlphaSift screening reusing DSA LLM routing filters undeclared hosted provider backup models, adding declared channel models to fallback chains, avoiding stale Gemini fallbacks.
- AlphaSift default installation source pinned to trusted GitHub commit; desktop auto-install requires no admin session, while non-desktop deployments mandate admin authentication.
- Fixed issue where enabling AlphaSift on Web installed packages before writing configs, preventing default-off state from being enabled.
- AlphaSift status and install endpoints no longer return plaintext `install_spec`, returning non-sensitive fields such as `install_spec_is_default`.
- AlphaSift status detection distinguishes between missing optional dependencies and unexpected exceptions, logging warnings and returning sanitized diagnostics.
- Adjusted AlphaSift screening call compatibility: `screen` prioritizes `max_results` with legacy `max_output` support, permitting strategy passthrough to align with manual parameters.
- AlphaSift Web screening requests use independent long timeouts, preventing generic 30s API timeouts from interrupting LLM reranking.
- Desktop packaging stage pre-bundles AlphaSift and collects adapters, preventing release bundles from requiring admin auto-installation at runtime.
- AlphaSift auto-installation triggers only when `status` diagnoses `missing_module`; imported adapters encountering runtime exceptions return 424 with diagnostics rather than auto-reinstalling.
- Resolved residual English text in Chinese Web UI and Settings help gaps, converting Backtest page to Chinese and restricting Settings page to registered configs with descriptions.
- Windows desktop auto-updater silent install explicitly reuses current install directory, avoiding uninstall failures under custom install paths.
- Windows installer quotes `_?=` directory parameter when retrying legacy uninstaller, fixing code 2 failures on paths containing spaces.
- Windows desktop auto-updater quotes `/D=` directory parameter passed to NSIS when paths contain spaces, avoiding registry truncation.
- Hardened LLM channel base_url validation, preventing SSRF bypasses via parser discrepancies.
- Corrected efinance ETF daily bar Eastmoney secid routing, preventing Shanghai ETFs from being queried under Shenzhen quote IDs resulting in empty daily bars.

### Documentation

- Clarified AlphaSift and LiteLLM compatibility boundaries: bridges declared DSA provider/model/base URL as invocation injection without `.env` migration; rollback disables AlphaSift and restores `LITELLM_*`/`LLM_*` settings.
- Clarified AlphaSift reuses existing DSA LLM/LiteLLM configuration semantics without migrating model semantics like `LITELLM_MODEL`, `OPENAI_MODEL`, `OPENAI_BASE_URL`, `LLM_TIMEOUT_SEC`; error notices and fallbacks follow existing system config pipeline.
- Clarified AlphaSift auto-installation commit pinning, `missing_module`, and runtime exception boundaries, along with rollback paths to existing LLM configs.
- Clarified new model fields in historical trends as historical snapshot display metadata, without affecting runtime Provider/Model/Base URL routing or config migration; rollback via standard release rollback.
- Clarified #1311 compatibility boundary: rendering layer consumes `model_used` display field only, without altering `wechat/slack/feishu/telegram` sender pipelines or triggering provider/model/base_url migrations.
- Documented AlphaSift pinned commit `alphasift.dsa_adapter` contract basis and compatibility boundaries for DSA API/Web calls.
- Clarified Settings page organizes LLM configs into display groups only, without rewriting or triggering LLM migration/rollback paths; compatible with existing `LLM` config save semantics.
- Added AnalysisContextPack P0 context inventory.
- Completed Alert Center P8 documentation and configuration consolidation, defining legacy JSON, advanced rules, Web/API, Docker, GitHub Actions, and Desktop boundaries.

### Tests

- Synchronized unit tests for `llmProviderTemplates`, LiteLLM fallback pricing, and MiniMax presets, asserting new default models.
- Added regression coverage for ETF daily bar routing, input variants, fallbacks, and MA fields.

### chore

- Added notification report channel capability profiling, PreparedMessage, and structure-aware Markdown chunking infrastructure, laying groundwork for #1311 multi-channel rendering adaptation.
- Pre-bundled WeChat Work, Feishu, Telegram, DingTalk, Slack renderer metadata, preserving default push report entry points and visible layouts.

## [3.19.0] - 2026-05-29

### Features

- Implemented #1391 Phase 1 runtime diagnostics minimal pipeline: appended trace_id to tasks/SSE, recording ProviderRun snapshots for daily bars and realtime quotes.
- Alert Center added P7 market light structured rules, supporting `market_light_status` and `market_light_score_drop` while reusing existing workers, trigger history, notifications, and cooldown pipelines.
- Implemented #1391 Phase 2 runtime diagnostics summary: generated user-readable RunDiagnosticSummary, providing historical report diagnostics API and desensitized copy text.
- Implemented #1391 Phase 3 runtime diagnostics visibility: report details and task panel default to collapsed display of execution status, trace, and copyable troubleshooting info; backend provides historical backfills via `api/v1/history/{record_id}/diagnostics` and `context_snapshot.diagnostics`.
- Added AnalysisContextPack P1 internal contract and desensitized serialization tests.
- Added AnalysisContextPack P2 builder, assembling internal context packs from existing standard analysis pipeline artifacts.
- Stock query chat added opt-in visible conversation context compression, supporting Web toggle, Agent advanced presets, rolling summaries, and recent turn literal protection to reduce long-session token consumption.
- Stock autocomplete index supports remote refreshes from GitHub main cached locally by default; Web/CLI analysis endpoints automatically fall back to built-in index upon failure, reducing likelihood of delisted or renamed tickers contaminating analysis.
- Standard analysis and Agent runtime prompts integrate AnalysisContextPack low-sensitivity summaries, preserving history/API/Web output compatibility.

### Improvements

- `scripts/fetch_tushare_stock_list.py` backfills and corrects A-share names with prefixes like `XD`/`XR`/`DR`/`N`/`C`, used by default in autocomplete refresh flows.
- Web route pages converted to lazy loading, reducing initial bundle size and adding route load failure recovery notices.
- Web full report Markdown drawer converted to on-demand loading.
- Added market phase inference baseline, clarifying pre-market, intraday, lunch break, near close, post-market, and non-trading day semantics.
- Added runtime market phase context construction and fallback tests.
- Settings page configuration help incrementally updated with bilingual Chinese/English copy for displayed/configurable fields, covering Agent, backtesting, reports, notification routing, system runtime, legacy AI, data sources, and advanced notification settings.
- P2-min: Injected market phase context into LLM prompts.

### Fixes

- Stock autocomplete index generation fails fast when `pypinyin` is missing, preventing degraded indices lacking pinyin fields from being written.
- Normalized Tencent live quote volume to shares, preventing volume changes from being exaggerated and misleading analysis reports.
- Docker default deployment removed single-file `.env` mounts, avoiding `Device or resource busy` errors when `os.replace` updates mount points during WebUI configuration saves.
- Converged #1391 Phase 0 A-share code attribution boundaries: completed attribution consistency for `SH`/`SZ` prefix scenarios, clarifying scope across `data_provider/baostock_fetcher.py`, `data_provider/pytdx_fetcher.py`, `data_provider/tushare_fetcher.py`.
- Fixed internal format conversion in Baostock fallback when `STOCK_LIST` uses bare A-share codes, allowing user configurations to continue using 6-digit stock codes.
- Windows desktop auto-updater runs installer silently after user confirms restart installation, cleaning up process references after stopping internal backend to reduce "Daily Stock Analysis cannot be closed" prompts.
- macOS desktop app migrated runtime configs to user data directory, migrating `.env`, databases, and logs when files in legacy `.app` bundles remain accessible, preventing reconfiguration after updates.
- Restored related sectors and sector linkage field extraction in Agent/history compatibility snapshots, fixing regression where new homepage reports lacked sector linkage sections.
- Corrected legacy alert JSON field names and quiet hours delivery semantics in Web settings help.
- Fixed missing translations for configuration titles, descriptions, and dropdown options in Chinese Web settings across data sources, notifications, system, and Agent panels.
- Fixed lingering in-progress task statuses when switching stock query sessions or reconnecting homepage tasks.
- Stock query single-agent added provider-aware trace tracks, preserving DeepSeek V4 thinking + tool-call `reasoning_content` and tool protocol materials across turns.
- Added invocation-level timeouts for AkShare Sina/Tencent A-share historical fallback endpoints, and added Tushare `605xxx` Shanghai code routing regression tests, preventing scheduled runs from hanging on unresponsive providers.
- Raised minimum `exchange-calendars` dependency to `4.13.0`, preventing analysis failures when importing trading calendars in pandas 3 environments due to deprecated Timedelta unit `T`.
- Interactive command triggers (DingTalk, Feishu, Telegram) reply only to originating chats rather than broadcasting to static notification channels.
- Adapted Longbridge OAuth 2.0 authentication and token cache recovery, preventing Longbridge data sources from being marked unconfigured when legacy access tokens are missing.
- Longbridge OAuth path logs graceful degradation when current SDK lacks `OAuthBuilder` / `Config.from_oauth`, avoiding build failures on Linux/Docker with older SDKs.
- Handled YFinance daily bars returning unnamed date indices, preventing missing `date` columns from interrupting US daily line fallbacks.

### Documentation

- Added #1391 Phase 0 runtime diagnostics contract documentation, clarifying trace_id, diagnostic summaries, critical pipeline scopes, and desensitization/fail-open/retention boundaries.
- Documented Alert Center P8 specifications, clarifying boundaries across legacy JSON, advanced rules, Web/API, Docker, GitHub Actions, and Desktop.
- Clarified that desktop fixes cover Windows NSIS update installation pipelines and backend process lifecycle cleanup without altering configuration saving or runtime model cleanup semantics; restored separation between deployment builds and update fixes.
- Added AnalysisContextPack P0 context review, clarifying field quality states, mapping rules, and initial pack boundaries.
- Clarified that #1391 Phase 2 structured detection alerts are non-migration signals: invalid `agent_max_steps`/`agent_orchestrator_timeout_s` values fall back to defaults with log warnings, without rewriting model routes or configurations.
- Documented #1391 Phase 3 compatibility: recorded backend diagnostic persistence, historical query, and notification callback boundaries and rollback strategies, adding backend gate verification requirements.

### Tests

- Executed #1391 Phase 3 backend/API and Web regression checks: `./scripts/ci_gate.sh`, `test_pipeline_market_phase_context.py`, `test_analysis_api_contract.py`, `test_analysis_history.py`, `npm run lint`, `npm run build`.
- Verified `python -c "import exchange_calendars as xcals; xcals.get_calendar('XSHG'); print('ok')"` to confirm calendar import and initialization compatibility.

## [3.18.0] - 2026-05-21

### Highlights

- feat: Alert Center expanded to P2-P6, adding background evaluation, real notification results, business cooldowns, technical indicator rules, and watchlist/portfolio/account linked rules.
- feat: Stock analysis added strategy selection, introducing hot topics, event-driven, growth quality, and valuation re-rating strategies, with fundamental, financial summary, shareholder yield, and sector linkage additions for HK/US reports.
- feat: Added Finnhub / AlphaVantage US data provider adapters, expanding US daily failover chains to improve market data resilience.
- fix: Resolved stability issues in desktop packaging, analysis status endpoints, AlphaVantage price change calculations, portfolio real-time valuation, alert history deduplication, database cold starts, and fallback pricing registration.

### What's Changed

- feat: Add alert-center P2-P6, Web strategy selection, HK/US fundamental context, static-report financial sections, and Finnhub / AlphaVantage US-market fallback.
- improve: Refine LiteLLM parameter recovery, yfinance currency/dividend handling, RSI calculation, market-review presentation, stock-news relevance ranking, and report table rendering.
- fix: Harden desktop packaging/update assets, completed analysis-status responses, AlphaVantage pct_chg routing, portfolio realtime snapshots, alert trigger dedupe, DatabaseManager cold start, and fallback pricing registration.
- docs/tests: Add beginner setup and settings-help docs, document compatibility/rollback boundaries, and extend regression coverage for API, alert, packaging, and release paths.

## [3.17.1] - 2026-05-16

### Highlights

- fix: Desktop packaging scripts for Windows and macOS explicitly disable electron-builder auto-publishing (`--publish never`), preventing tag builds from failing locally due to missing `GH_TOKEN`; Release workflow handles artifact uploading and publishing.

### What's Changed

- fix: Add `--publish never` to the Windows and macOS Electron packaging scripts so tag builds only create local artifacts and GitHub Actions handles release upload/publish.

## [3.17.0] - 2026-05-16

### Highlights

- feat: Added Alert API MVP supporting rule CRUD, enable/disable, one-shot testing, and trigger/notification query results, covering `price_cross` / `price_change_percent` / `volume_spike` with legacy configuration compatibility.
- feat: Notification gateway added ntfy and Gotify as first-class channels with noise reduction, static channel isolation, diagnostics, Web tests, and GitHub Actions environment validation.
- feat: Windows desktop installer added auto-update installation pipeline supporting background downloads, restart confirmation, runtime file backup/restoration, and release artifact metadata verification.
- improve: Market review added concept rankings, popular stocks, and limit-up pools, supporting index color semantics and persisting review results into history.
- improve: Web settings page added `.env` backup import/export and error boundaries for notifications/Agent sections; reports added `REPORT_SHOW_LLM_MODEL` toggle controlling model metadata visibility.
- improve: Docker entrypoint automatically repairs mounted directory permissions and falls back to console logging when log directories are not writable.
- fix: Graceful degradation when data providers lack credentials or connections fail; added cooldowns for Longbridge and Pytdx, avoiding high-confidence buy conclusions when capital flow data is missing.
- fix: Analysis and reporting pipelines handle OpenAI-compatible `content_blocks` responses, normalized strategy price fields, and resolved market review scrolling and history loss issues.
- docs: Documented notifications, Alert Center, desktop packaging, README/guides, and PR title guidelines, clarifying configuration compatibility boundaries and rollback paths.
- test: Added regression coverage for Alert API, notification noise control/routing, Docker entrypoint, data prefetching, desktop update pipelines, and analysis history.

### What's Changed

- feat: Add an Alert API MVP with rule CRUD, enable/disable, one-shot testing, trigger history, notification results, and legacy config compatibility.
- feat: Promote ntfy and Gotify to first-class notification channels with Web tests, routing, Actions integration, diagnostics, and noise control.
- feat: Add the Windows desktop auto-update install flow with runtime state backup/restore and release artifact metadata verification.
- improve: Extend market review data sources, add configurable index color semantics, and persist market review results into analysis history.
- improve: Add Web `.env` backup import/export, local settings panel error boundaries, and a report model visibility toggle.
- improve: Harden Docker startup by repairing mounted directory permissions and falling back to console logging when mounted logs are not writable.
- fix: Cool down unavailable optional fetchers, reduce noisy Longbridge/Pytdx retries, and downgrade buy advice when capital flow data is missing.
- fix: Handle OpenAI-compatible `content_blocks`, normalize strategy price fields, and recover market review scrolling/history behavior.
- docs/tests: Update notification, alert, desktop packaging, README/guide, and governance docs; add focused regression coverage for the new release paths.

## [3.16.0] - 2026-05-10

### Highlights

- feat: Web homepage added "Market Review" trigger with task polling and inline report display; setup status alerts users to missing configurations and directs them to system settings.
- feat: Added notification routing policies supporting filtering notifications to specified channels by report, alert, and system_error; Web settings supports one-click notification testing.
- feat: System settings added configuration help infrastructure with multilingual help text, initially covering watchlists, primary LLM models, LLM channels, Feishu Webhooks, and WebUI listening addresses.
- improve: Shared `build_market_review_runtime` across API, CLI, and Bot market review paths, documenting `litellm_model` / `llm_model_list` and legacy key fallbacks.
- improve: Calibrated stock advice with support/resistance, volume, chips, and main capital flows, reducing erratic buy/sell toggling and strengthening Agent decision fallbacks.
- improve: Docker images run as non-root users, relaxing LiteLLM constraints to allow future safe 1.x fixes.
- fix: Corrected LLM channel testing classifications for `Model disabled` and provider blocked errors, avoiding generic network error misreports.
- fix: HK daily bars skip unsupported built-in historical providers; aligned Beijing Stock Exchange `BJ` prefix and `.BJ` suffix code validation.
- fix: Improved Web market review button observability, Windows fallback lock process probing, and catalyst snippet rendering.
- docs: Added documentation index and settings help maintenance guides, cleaning up temporary PR/sync notices in README and guides.

### What's Changed

- feat: Add a Web home market-review trigger with task polling and inline report display; setup status now points users to missing configuration.
- feat: Add notification routing by report, alert, and system_error; add one-click notification channel testing in Web settings.
- feat: Add settings field help infrastructure with multilingual help text for the first batch of core configuration fields.
- improve: Share `build_market_review_runtime` across API, CLI, and Bot market review paths; document `litellm_model` / `llm_model_list` and legacy key fallback behavior.
- improve: Calibrate stock advice with support/resistance, volume, chips, and main-force capital flow; strengthen Agent decision fallback behavior.
- improve: Run Docker images as a non-root user and relax LiteLLM constraints to allow safe future 1.x fixes.
- fix: Classify `Model disabled`, provider blocked, and related LLM channel test errors more accurately instead of reporting them as generic network failures.
- fix: Avoid unsupported built-in historical providers for Hong Kong daily data; align Beijing Stock Exchange `BJ` prefix and `.BJ` suffix validation.
- fix: Improve Web market-review observability, Windows fallback lock probing, and market catalyst snippet rendering.
- docs: Add the documentation index and settings-help maintenance guide; remove temporary PR/doc-sync notes from README and user-facing guides.

## [3.15.0] - 2026-05-05

### Highlights

- LLM channel configuration upgrades: added Anspire OpenAI-compatible gateway access, bundled standard provider presets, official links, capability tags, configuration notes, and GitHub Actions explicit mappings.
- Web LLM configuration diagnostics: granular error reasons with support for explicitly triggered JSON, tools, vision, and stream runtime smoke tests.
- Robust LLM runtime cleanup: cleans only invalid selections for hosted providers, preserving direct provider compatibility for `cohere/*`, `google/*`, `xai/*`.
- Enhanced notification and Bot observability: custom Webhooks support JSON body templates; Bot `/status` displays comprehensive LLM, Agent, and notification channel statuses.
- Fortified market reviews, real-time alerts, Agent weak fallbacks, and portfolio valuations, reducing default overwrites, missing price issues, and troubleshooting overhead.

### Features

- Supported `ANSPIRE_API_KEYS` connecting to Anspire OpenAI-compatible gateway by default, adding Anspire Open preset in LLM channel editor.
- Custom Webhooks support `CUSTOM_WEBHOOK_BODY_TEMPLATE` JSON body templates, adapting to AstrBot, NapCat, and self-hosted push services.
- Market review structured section adds market light conclusions, outputting green/yellow/red status, core drivers, and operational advice based on market temperature.
- EventMonitor supports `price_change_percent` threshold rules, triggering real-time alerts on upward or downward price movements.
- Web LLM channel editor adds presets for popular providers covering MiniMax, Volcengine Ark, OpenAI, Claude, Gemini, Kimi, Qwen, GLM, and Doubao.

### Improvements

- Web LLM configuration checks add granular error categorizations and explicit JSON/tools/vision/stream runtime smoke tests; default test and save flows remain unchanged as best-effort diagnostics.
- Bot `/status` displays unified primary LLM models, Agent models, channel modes, YAML configs, and notification channel statuses.
- Web LLM channel editor displays provider capability tags, official source links, and setup notes for user reference.
- Extracted Web LLM provider presets into single template data source, preserving configuration persistence semantics.
- Mapped LLM provider channels explicitly in GitHub Actions, synchronizing `.env.example` and documentation.

### Fixes

- Agent weak completeness fallback preserves local trend analysis results when models omit scores, trends, advice, or critical dashboard sections, filling only truly missing fields and preventing default score 50 overwrites.
- Unified portfolio snapshot outputs for current price, market value, unrealized P&L, returns, and price metadata, preventing stale or missing prices from corrupting valuations.
- LLM channel testing adds structured diagnostics and settings page troubleshooting tips for provider, model, base URL, and authentication issues.
- Clarified runtime cleanup compatibility boundaries: cleans invalid values prior to saving only for hosted providers (`gemini`, `vertex_ai`, `anthropic`, `openai`, `deepseek`), while retaining direct connections (`cohere/*`, `google/*`, `xai/*`) along legacy compatibility paths.
- Adjusted MiniMax presets to official OpenAI-compatible base URLs and current model examples, documenting compatibility sources and fallback instructions.
- Removed outdated Gemini 3 Vision fallback logic in screenshot recognition, defaulting inference to configured Gemini models.

### Documentation

- Documented LLM provider configuration, covering setup options, Actions variable mappings, runtime diagnostic boundaries, error reason troubleshooting, and rollback paths (#1180).
- Documented official sources, dependency compatibility windows, runtime model cleanup rules on save, and legacy configuration fallback paths for LLM channel editor.
- Documented official provider/model specifications for `cohere/*`, `google/*`, `xai/*` direct connections referencing `litellm>=1.80.10,<1.82.7`.
- Clarified that `price_change_percent` event alerts represent configuration and rule extensions without altering model/provider/base URL semantics; rollback involves disabling Event Monitor settings.
- Synchronized documentation across README, DEPLOY, full-guide, Anspire, AIHubMix, and SerpAPI.

### Tests

- Added regression tests for AI configuration page and `task_queue` LLM runtime cleanup/sync: preserving fallbacks when restoring channel models, preventing silent erasure during model list edits, cleaning invalid runtime references when channels lack models, and covering legacy keys and direct provider semantics.
- Covered granular error categories in Web LLM configuration checks and explicit trigger paths for JSON, tools, vision, and stream smoke tests.

## [3.14.2] - 2026-04-30

### Release Highlights

- Market review expanded to Hong Kong equities, aligning Bot `/market` with CLI and scheduler trading-day filtering semantics.
- Stock query and Agent workflows improved for missing configurations, decision fallbacks, and multi-strategy selection.
- LLM and analysis report pipelines enhanced for stability: malformed JSON responses continue to fallback models, and LiteLLM DEBUG logs are silenced by default.
- Added read-only initial startup configuration status endpoint, establishing foundations for future setup wizards and smoke runs.

### Features

- Market review supports Hong Kong market: `MARKET_REVIEW_REGION` adds `hk` option; `both` expands to A-shares + HK + US equities, adding HK index (HSI/HSTECH/HSCEI) review pipelines.
- Added read-only initial startup configuration status endpoint `GET /api/v1/system/config/setup/status` to detect LLM, Agent, watchlist, notification, and local storage gaps; does not reload runtime, modify `.env`, or create database files.

### Improvements

- Stock query page supports selecting combinations of multiple Agent strategies.

### Fixed

- Bot `/market` command reuses `get_open_markets_today()` / `compute_effective_region()` for trading-day filtering: passed as `override_region` to `run_market_review`; skips review and sends "Relevant markets closed today" when empty, matching CLI/scheduler behavior.
- Stock query Agent retains authentic backend error reasons and maintains `done.success=false` failure semantics when no usable LLM is configured, preventing frontend from misinterpreting missing configuration as successful responses.
- Agent mode preserves local trend analysis score, trend, and advice when failing to generate valid decision dashboard, normalizing strong-buy/strong-sell fallbacks to compatible `buy`/`sell` types to prevent overwriting by `50 / Hold / Unknown` defaults.
- Portfolio snapshot no longer silently falls back to cost basis when current price is missing; current-day snapshot prioritizes historical close with real-time fallback only when missing, preventing missing prices from corrupting market values and unrealized P&L, returning price source, date, stale, and missing statuses for positions.
- Analysis prompt cleans mutually exclusive reasons before injecting `trend_analysis` based on final `trend_status` / `ma_alignment`: bearish structures remove bullish reasons, bullish structures remove bearish structure risks, forcing "Events first, technicals pending confirmation" notices with volume downweighting during event/technical conflicts or volume spikes (>10x).
- Non-JSON LLM responses trigger fallback model switching: when primary model returns successfully but JSON parsing fails, rather than immediately falling back to plain text, sequentially attempts fallback models in `LITELLM_FALLBACK_MODELS`; falls back to text only when all models fail to return valid JSON.
- LiteLLM internal DEBUG logs lowered to WARNING by default, preventing token-level logs from polluting `stock_analysis_debug_*.log` during streaming; set `LITELLM_LOG_LEVEL=DEBUG` temporarily to inspect LiteLLM internals (Fixes #1156).

### Documentation

- Added LLM Configuration Guide and FAQ, clarifying stock query Agent compatibility priority, fallback paths, and non-silent migration boundaries across `LITELLM_CONFIG`, `LLM_CHANNELS`, and legacy `GEMINI_*`, `OPENAI_*`, `ANTHROPIC_*`.

### Tests

- Added `tests/test_bot_market_command.py` covering `MARKET_REVIEW_REGION=both` + open markets `{"cn","us"}` / `{"cn","hk"}` `override_region` assertions, market holiday skips, and trading day check bypass paths; added `tests/test_yfinance_hk_indices.py` covering HK index symbol mapping and partial/complete failure fallback paths.
- Completed stock code normalization function in `task_queue` lightweight import stub, restoring `tests/test_task_queue_config_sync.py` test discovery and execution.

## [3.14.1] - 2026-04-26
- [Test] Corrected market review prompt test assertions for "Tomorrow's Trading Plan" heading, and synchronized desktop app version to restore release gate.

## [3.14.0] - 2026-04-26

### Release Highlights

- 📊 **Market Review Upgraded to Post-Market Workbench Layout** — A-share reviews output fixed structure: market temperature, index details, top sector table, news catalysts, tomorrow's trading plan, and risk notices, reducing repetition.
- 🖥️ **Desktop App Adds GitHub Release Update Alerts** — Windows/macOS desktop app automatically checks for updates on startup, with manual check and download links in settings.
- 🤖 **Pipeline Agent Data Loading Noise Reduction** — K-line tools switched to DB-first with 240-day historical pre-warming, eliminating duplicate HTTP requests for the same stock.
- 🐳 **Docker Release Workflow Convergence** — Release workflow converged into formal releases and manual releases, standardizing official Docker Hub image name to `zhulinsen/daily_stock_analysis`.
- 🔧 **LLM Channels & DeepSeek V4 Configuration Improvements** — GitHub Actions daily analysis passes multi-channel variables, and DeepSeek official presets synchronize to V4.
- 🧩 **Desktop Static Asset Consistency Validation** — Packaging pipelines and runtime detect static asset mismatches earlier, reducing blank screen debugging costs in release packages.

### Features

- 🏠 **Web Homepage Historical Reports Adds Re-Analysis Action** — Supports re-running analysis for the same stock and date using the original prompt.
- 🖥️ **Windows/macOS Desktop Adds GitHub Release Update Notifications** — Checks for new versions on launch and supports manual checks from settings.

### Improvements

- 📊 **A-Share Market Review Converted to Structured Post-Market Workbench Layout** — Consistently outputs market temperature, index details, sector leaderboards, news catalysts, and tomorrow's trading plan.
- 🐳 **Docker Release Workflow Convergence** — Clarified boundaries between official releases and manual releases, standardizing official Docker Hub image name to `zhulinsen/daily_stock_analysis`.
- 🤖 **Agent Daily History Tool Prioritizes Local Cache** — Concurrently persists newly retrieved daily bars and news intel, reducing redundant data provider calls.

### Fixed

- 🤖 **Pipeline Agent K-Line Tools DB-First Loading** — `get_daily_history` / `analyze_trend` / `calculate_ma` / `get_volume_analysis` / `analyze_pattern` prioritize reading local DB, eliminating 9x5=45 duplicate HTTP requests per stock (Fixes #1066).
- 🤖 **Pipeline Agent Pre-Warms 240-Day K-Line History to DB On Demand** — K-line tool calls require no duplicate network requests under normal conditions.
- 🕒 **Freezes `target_date` and Passes via ContextVar to Pipeline Agent K-Line Tool Threads** — Eliminates time drift across market close boundaries.
- 🪟 **Windows Desktop Backend Log Transcribe Encoding Fix** — Prioritizes UTF-8 when transcribing stdout/stderr with local code page fallback, preventing garbled log characters.
- ⚙️ **GitHub Actions Daily Analysis Passes LLM Channel Variables** — Supports `LLM_CHANNELS`, multi-key, and common `LLM_<NAME>_*`, preventing local multi-model configs from failing in cloud scheduled tasks (Fixes #1063, #872).
- 📈 **Historical Report Details API Fixes `change_pct` Value** — Uses `is None` check to avoid dropping 0.0 (flat), removes erroneous `change_60d` fallback, and falls back to raw real-time quote fields when missing (Fixes #1084).
- 🔧 **DeepSeek Official Channel Presets and Examples Synchronized to V4** — Retains legacy `deepseek-chat` default with deprecation warning, fixing save failures caused by legacy runtime selections following model discovery (Fixes #1108, #1109).
- 🧩 **Desktop Packaging Adds Static Asset Consistency Check** — `scripts/check_static_assets.py` verifies resources referenced by `index.html` exist in source `static/` and PyInstaller outputs, logging clear mismatches to prevent blank screens in release packages (Refs #1064 / #1065 / #1050).
- 🧩 **Backend `/assets/*` Handled via Explicit Route Hosting** — Missing assets return `text/javascript` / `text/css` 404 matching request extension, eliminating misleading default JSON error responses (Refs #1064).
- 🌙 **`kimi-k2.6` Automatically Uses Fixed Temperature** — Standard analysis, market review, and Agent calls automatically use `temperature=1.0` for this model, preventing rejection of default temperature requests (Fixes #1102).

### Documentation

- 🐳 **Added Official Docker Image Usage Guide** — Added image pulling, `docker run` usage, and `.env` / data directory mapping documentation, extending beyond Compose deployments.
- 📨 **Corrected Feishu Custom Bot Webhook Example** — Example in `feishu_sender.py` updated to interactive card JSON, adding Feishu automated webhook trigger configuration guide.
- 📚 **Optimized Root README Structure** — Retained top-level features, stack, quick start, notification previews, Web, Agent, sponsors, and news source links, moving detailed configuration, trading discipline, and fundamental semantics to full guide; Docker badge points to official image page.
- 🌐 **Synchronized Streamlined Navigation in English and Traditional Chinese READMEs** — Added LLM usage API and portfolio management documentation to full guide.
- 🤝 **Adjusted README Maintenance Rules in AI Collaboration and PR Templates** — Clarified that README is updated only when necessary, with implementation details directed to topical documentation.

### Tests

- 🧪 **Stabilized LiteLLM Stub Behavior in Market Review Tests** — Prevents locally installed LiteLLM from affecting market review unit tests during test collection reordering.
- 🧪 **pytest Skips Frontend Dependencies Directory by Default** — Local `apps/dsa-web/node_modules` is no longer recursively scanned by backend tests, preventing pre-release gates from slowing down.

## [3.13.0] - 2026-04-21

### Release Highlights

- 🌉 **Longbridge OpenAPI Data Source Integration** — US/HK quotes prioritize Longbridge with YFinance / AkShare auto-fallback; behavior unchanged when unconfigured.
- 📈 **Tushare Full Hong Kong Stock Pipeline Support** — HK daily bars retrieved via `hk_daily`; chip distribution returns `None` for HK stocks; units adhere to HK standards without applying A-share lot/thousand-yuan rules.
- 🔍 **Anspire Search Semantic Search Integration** — Configurable via `ANSPIRE_*` for real-time quotes and news intel; completely transparent when unconfigured.
- 🚀 **Standard Analysis Pipeline Supports LLM Streaming Generation** — Home task SSE adds `task_progress` events with granular progress; unsupported providers fall back to non-streaming calls.
- 🤖 **Web Channel Editor Supports Pulling Available Models On Demand** — `/v1/models` unified model discovery endpoint, writing multi-select choices back to `LLM_{CHANNEL}_MODELS` with manual input fallback.
- 🛡️ **Agent Stability and Budget Guardrails Strengthened** — Unified `AGENT_MAX_STEPS` semantics, non-breaking skill degradation, SSE exception pass-through, and skill loading warning logs.
- 🛠️ **SQLite Atomic Write Pipeline** — Batch atomic upsert + WAL + `busy_timeout` + limited write retries, significantly reducing concurrency lock contention.

### Features

- 🌉 **Integrated Longbridge OpenAPI as Optional US/HK Data Source** (fixes #981) — Prioritizes Longbridge for daily bars and live quotes when `LONGBRIDGE_*` is configured, falling back to YFinance / AkShare; behavior identical to previous versions when unconfigured. Tested via `tests/longbridge_live_smoke.py` (manual script, excluded from pytest collection).
- 📈 **Tushare Supports Hong Kong Stock Daily Bar Queries** — Calls `hk_daily` endpoint when Tushare credentials are configured; raises exception on insufficient permissions, consistent with original pipeline.
- 🔍 **Integrated Anspire Search Optional Semantic Search Backend** — Configurable via `ANSPIRE_*` for live quotes and news intel; behavior unchanged when unconfigured. Tested via `tests/test_anspire_search.py` (manual script).
- 🚀 **Standard Analysis Pipeline Supports LiteLLM Streaming and Granular Progress** — Stock analysis attempts `stream=True` in LLM stage accumulating chunks on server, adding `task_progress` events and granular `message/progress` updates to home task SSE; persists history report only upon final JSON parse success; unsupported providers fall back to non-streaming calls.
- 🤖 **Web AI Model Configuration Fetches Models by Channel** — Channel editor calls `/v1/models` to pull available models, saving multi-select choices back to `LLM_{CHANNEL}_MODELS`; retains manual input as fallback.

### Improvements

- 🔎 **SerpAPI Body Fetch Scope Convergence** — Organic search results no longer fetch webpage body text synchronously per item; applies delayed fetching with shorter timeout budget only to rare top-ranked items with insufficient snippets, prioritizing structured snippets to reduce tail latency and slow site amplification.
- 🤖 **Simplified LLM User Experience** — Unified user-facing AI model terminology to "Primary Model / Agent Primary Model / Fallback Model / Model Channels", removing LiteLLM as mandatory concept for general users; existing `LITELLM_*` / `LLM_CHANNELS` keys remain compatible.
- 🧠 **IntelAgent Adds Corporate Announcements Search and Capital Flow Tool** — Added SSE/SZSE/cninfo announcement search dimensions and `get_capital_flow` tool, resolving missing announcement and fund flow data in Agent mode.
- 📦 **Backend Stock Name Resolution Prioritizes `stocks.index.json`** — Lazily loads cached frontend static index, silently falling back to `STOCK_NAME_MAP` and existing data source fallback pipelines in backend-only or missing static asset environments.
- 📊 **TushareFetcher Hong Kong Stock Unit Adaptation** — `get_chip_distribution` returns `None` for HK stocks (chip distribution currently unsupported for HK); `_normalize_data` skips A-share lot-to-share and thousand-yuan-to-yuan scaling for HK stocks (`hk_daily`), adhering to Tushare HK field semantics.
- ⏱️ **Agent Step Limit Errors Add `AGENT_MAX_STEPS` Adjustment Hints** — Helps users self-diagnose step limit issues.
- ⚙️ **GitHub Actions Analysis Task Timeout Configurable via `vars`** — `daily_analysis.yml` task timeout reads from repository variables, allowing timeout adjustment without modifying code (fixes #1014).

### Fixed

- 📣 **Market Review Pipeline Adopts `REPORT_LANGUAGE`** — When `REPORT_LANGUAGE=en`, A-share / merged review prompts, section headings, template fallback text, and notification wrappers output English uniformly, preventing English body copy paired with Chinese headers.
- 📈 **EfinanceFetcher Index Opening Price Mapping Compatibility** (fixes #1043) — `get_main_indices()` opening price mapping made compatible across `today_open (jinkai) -> open (kaipan) -> open`, fixing issues where index opening price was read as missing under certain efinance versions.
- 🤖 **Unified AGENT_MAX_STEPS Semantics** (fixes #1026) — Clarified in orchestrator multi-Agent mode as "per-sub-Agent step ceiling rather than hard override"; high-default Agents like TechnicalAgent are capped, low-default Agents retain original values; user settings (>10) override all sub-Agents. Fixes issue where user set 12 but TechnicalAgent ran default 6 steps reporting "Agent exceeded max steps".
- 🛡️ **Specialist (Skill) Agent Failures Gracefully Degraded** — Skill Agent failures no longer abort entire analysis pipeline, sharing same fallback strategy as intel/risk.
- 🔧 **MiniMax-M2.7 Connection Test Fix** — Fixed LLM channel connection test returning "Empty response" under MiniMax-M2.7; increased `max_tokens` ceiling from 8 to 256 to accommodate reasoning process, adding `content_blocks` parsing logic.
- 📊 **Removed `sentiment_score` Range Constraints** (fixes #942) — Removed `ge=0/le=100` constraints from `HistoryItem` and `ReportSummary` response schemas; out-of-range historical values no longer trigger Pydantic ValidationError.
- 🖥️ **Explicit Warning When WebUI Frontend Assets Are Missing** — `webui_frontend.py` emits warning when `static/index.html` exists but `static/assets/` is missing, preventing bloated unstyled pages that are difficult to debug (fixes #944).
- 🔗 **Analysis Pipeline Optional Services Degraded Initialization** — `StockAnalysisPipeline` logs warning and continues in disabled state upon search service or social sentiment initialization errors, preventing external dependency instability from blocking primary analysis pipeline.
- 🖥️ **Desktop App Version Unified from `package.json`** — Reads `apps/dsa-desktop/package.json`, removing hardcoded `0.1.0` in preload, displaying authentic desktop version in settings page; fixes version display error (fixes #1048).
- 🐋 **Hong Kong Stock Name Retrieval Failure Fix** (fixes #940) — Fixed failure to fall back to secondary fields when primary data source fields are missing for HK stock names.
- 🔄 **SSE Task Stream Disconnect Re-Raises `CancelledError` Properly** (fixes #967) — Fixed issue where exceptions were silently swallowed during SSE stream disconnects leaving failures without log traces.
- 🔄 **Agent SSE Cleanup Background Task Exceptions Properly Reported** (fixes #969) — Background executor exceptions during stream cleanup are properly logged and reported, preventing unnoticed errors.
- 🔇 **Skill Loading Exceptions Add `logger.warning` Logs** (fixes #970) — Added logging to silent except blocks in `ask.py`, `skills/aggregator.py`, `skills/router.py`, ensuring logs exist when skill list is empty.
- 🛠️ **SQLite Atomic Write Pipeline** (fixes #878) — `stock_daily(code,date)` uses batch atomic upsert; file-based SQLite connections enable WAL + `busy_timeout` + limited write retries by default; "new count" calculated strictly by actual inserted rows in current window.
- 💰 **Unified Multi-Agent / Single-Agent Budget Guardrail Semantics** — Actively skips and degrades when remaining budget falls below minimum threshold; returns `success=True` with non-empty content when completed stages can synthesize fallback report, otherwise returns `success=False`.
- ⚙️ **GitHub Actions `daily_analysis.yml` Injects `REPORT_LANGUAGE`** (fixes #1013) — Fixed issue where `REPORT_LANGUAGE` configured in Secrets/Variables did not take effect.
- 📊 **Task Status API Returns Real-Time Price Fields** (fixes #983) — `GET /api/v1/analysis/status/{task_id}` populates `current_price` / `change_pct` when backfilling completed tasks from database, fixing missing real-time price beside stock name on homepage reports.
- 📅 **Non-Trading Days Return Most Recent Trading Day Data** (fixes #1009) — Fixed issue where chip distribution and sector leaderboards on non-trading days (weekends/holidays) returned second-to-last trading day data, now correctly returning most recent trading day.
- 🔍 **A-Share News Search Restores Chinese Priority** — `search_stock_news()` tries subsequent search engines when first provider returns mostly English news, sorting Chinese news ahead within the same batch; non-US queries no longer inherit Brave's `en/US` locale defaults.
- 📨 **Feishu Group Bot Notifications Support Signature Verification** — Feishu notifications support `FEISHU_WEBHOOK_SECRET` / `FEISHU_WEBHOOK_KEYWORD`；Web settings and docs clearly distinguish Webhook push mode from `FEISHU_APP_ID` / `FEISHU_APP_SECRET` application mode to reduce misconfiguration.
- ⚡ **LLM Adapter Adds `RateLimitError` and `ContextWindowExceeded` Detection** — Detects and handles rate limit and context window exceeded errors, improving pipeline robustness under high load or long-context scenarios (fixes #1002).

### Tests

- 🧪 **TushareFetcher Hong Kong Stock Unit Tests** — Added unit tests for `get_chip_distribution` and `_normalize_data` HK/A-share/ETF unit scaling, covering HK-specific execution paths.

### Documentation

- 📘 **DEPLOY.md Adds Troubleshooting for Abnormally Enlarged UI Elements** — Added guidance for rebuilding Docker images or manually running `npm run build`; synchronized `deploy-webui-cloud.md`.
- 📨 **Feishu Webhook Configuration Documentation Completed** — Emphasized `FEISHU_WEBHOOK_URL` is required for group notifications, signature verification must be enabled/disabled on both ends, and `FEISHU_APP_SECRET` is for App/Stream Bot mode only; added inline comments to `.env.example`; synchronized English guide.
- 🤝 **FAQ Adds Ollama Connection Failure Troubleshooting (Q12c)** — Covers 5 checkpoints: service not running, incorrect URL, missing model prefix, model not downloaded, and remote firewall (fixes #854).
- 🌉 **README Adds Longbridge Data Source Usage Guide** — Chinese/English/Traditional Chinese READMEs clarify Longbridge "Preferred / Fallback / Uncalled when unconfigured" boundaries; fixed relative links in `docs/`; aligned `LONGBRIDGE_PRINT_QUOTE_PACKAGES` across code and `.env.example`.
- 🐋 **Docker Installation Version Notes** — Added minimal documentation clarifying Docker installations should determine version via Git tag / image tag (fixes #1091).

## [3.12.0] - 2026-04-01

### Release Highlights

- 📊 **Backtest Page Adds "Next-Day Validation" View** — Displays AI prediction vs next-day actual price change by stock and date range, leveraging historical analysis and 1-day backtest results to quickly verify accuracy.
- 🔧 **Simplified LLM User Experience** — Unified user-facing terminology to "Primary Model / Fallback Model / Model Channels", removing LiteLLM as mandatory concept for general users; existing configuration keys remain compatible.
- 🐳 **Docker / WebUI Runtime Stability Hardening** — Fixed issues where configuration failed to take effect after saving system settings, missing early startup logs, and pre-built static asset reuse, reducing operational friction.
- 🔒 **Security and Concurrency Stability Enhancements** — Discord inbound Webhooks add Ed25519 signature verification; fixed unlocked shared state during concurrent execution and notification concurrency reuse in single-stock push mode.
- 🖥️ **Desktop App and Scheduler Polish** — Windows installer supports custom installation directory; built-in scheduler dynamically detects runtime `SCHEDULE_TIME` changes; resume functionality evaluates by market timezone.

### Features

- 📊 **Backtest Page Adds "Next-Day Validation / 1-Day Window" View** — Displays AI predictions, next-day actual price changes, and filtered accuracy by stock symbol and analysis date range, built upon historical analysis and 1-day backtest results.
- 🏷️ **Web Settings Page Adds Version Information Card** — `apps/dsa-web` injects frontend package version and build timestamp at build time; system settings adds read-only "Version Information" block displaying `WebUI Version / Build ID / Build Time`; automatically falls back to build ID when `package.json` is placeholder `0.0.0`, facilitating verification of active static assets after Docker rebuilds.
- 🪟 **Windows Desktop Installer Supports Custom Installation Directory** — Installer allows customizing installation directory in setup wizard; continues using directory-adjacent logic to read/write `.env`, `data/stock_analysis.db`, and `logs/desktop.log` when installed to non-default drives, while preserving `win-unpacked` portable distribution. Installs per-user with elevation disabled (`allowElevation: false`), blocking selection of system-protected folders via NSIS `.onVerifyInstDir`.

### Improvements

- 🔎 **SerpAPI Body Fetch Scope Convergence** — Organic search results no longer fetch webpage body text synchronously per item; applies delayed fetching with shorter timeout budget only to rare top-ranked items with insufficient snippets, prioritizing structured snippets to reduce tail latency and slow site amplification.
- 🤖 **Simplified LLM User Experience** — Unified user-facing terminology to "Primary Model / Agent Primary Model / Fallback Model / Model Channels / Advanced Model Routing"; Web settings, config metadata, validation messages, and bilingual docs remove LiteLLM as default mandatory concept; existing `LITELLM_*` / `LLM_CHANNELS` keys remain compatible.

### Fixed

- 🚀 **Exposes Authentic Root Causes on Early Startup Failures** — `python main.py` exposes authentic root causes via stderr, discontinuing writing file logs to hardcoded `logs/` directory during bootstrap stage; file logging deferred until `config.log_dir` is available, preventing unexpected log files on healthy starts.
- 🐳 **Docker WebUI Runtime Prioritizes Existing Pre-Built Static Assets** — `prepare_webui_frontend_assets()` checks existing `static/index.html` in image for direct reuse; does not falsely report "Frontend project not found, unable to build automatically" when container runtime lacks `apps/dsa-web` source directory and `npm`, restoring WebUI accessibility in Docker deployments.
- 🐳 **Docker WebUI System Settings Take Effect After Saving** — When WebUI saves `STOCK_LIST`, `SCHEDULE_ENABLED`, `SCHEDULE_TIME`, `SCHEDULE_RUN_IMMEDIATELY`, `RUN_IMMEDIATELY` in Docker, `Config` prioritizes new values from persisted `.env`, avoiding overrides by stale environment variables injected at container creation.
- 📈 **Market Review LLM max_tokens Increased** — Market review generation pipeline increases LLM `max_tokens` from `2048` to `8192`, reducing likelihood of incomplete output due to premature truncation by `MAX_TOKENS`.
- ⏰ **Built-In Scheduler Detects SCHEDULE_TIME Runtime Changes** — Scheduler detects `SCHEDULE_TIME` changes saved via WebUI at runtime, rebinding daily job during next inspection check.
- 🪟 **Windows Release Channel Editor Retains MiniMax Model Prefix** — Entering `minimax/<model>` in channel mode preserves value as-is in backend normalization and Web settings runtime list, preventing improper rewriting to `openai/minimax/<model>`.
- 🤖 **Discord Inbound Webhook Adds Ed25519 Signature Verification** — `DiscordPlatform` validates Discord Interaction signatures based on `X-Signature-Ed25519`, `X-Signature-Timestamp`, and raw request body; rejects requests with missing signature headers, invalid public key formats, or signature mismatches, enforcing ±5 minute timestamp window against replay attacks.
- ⚙️ **Clarified STOCK_GROUP_N / EMAIL_GROUP_N Configuration Relationship** — Clarified relationship with `STOCK_LIST`, emitting warning during configuration validation for email groups exceeding `STOCK_LIST`.
- 🗓️ **Breakpoint Resume Evaluated by Market Timezone and Trading Calendar** (fixes #880) — Stock data existence checks no longer evaluate against server calendar day, resolving "latest reusable trading day" by respective market timezones for A-shares, HK, and US equities.
- 📨 **Single-Stock Push Mode No Longer Concurrently Reuses Shared Notification Instance** — `StockAnalysisPipeline.run()` retains concurrent stock analysis but serializes immediate notifications under `SINGLE_STOCK_NOTIFY=true` on results collection side.
- 🔇 **Real-Time Quote Fallback Prompts Consolidated to Single Warning** — Fetching stock names in analysis pipeline no longer triggers pre-emptive real-time quote query, notifying fallback to historical close only when all data sources are unavailable.
- 🔍 **A-Share Chinese News Search Restores Chinese Priority** — `search_stock_news()` tries subsequent search engines when first provider returns mostly English news, sorting Chinese news ahead within the same batch.
- 🔒 **Unified Locking for Shared State During Concurrent Execution** — Fixed missing unified locking for shared state during concurrent execution, eliminating data races in multi-threaded scenarios.

### Tests

- 🧪 **Added Regression Tests for Settings Page Version Information** — Added assertions for Web settings page version info rendering, covering automatic fallback to build ID for placeholder `0.0.0`.
- 🧪 **UI Governance and Critical Path Regression Testing** — Added component tests for `SidebarNav`, `ChatPage`, `BacktestPage`, adding UI governance guards preventing interactive elements from reintroducing native `title` attributes or legacy `input-terminal` styles; updated smoke and markdown drawer validations covering post-theme critical paths.

## [3.11.0] - 2026-03-27

### Release Highlights

- 🎨 **Web Workbench UI Unified with Dual-Theme Architecture** — Home, Chat, Backtest, Portfolio, and Settings pages consolidated under unified design tokens, input surfaces, and status semantics; added comprehensive light theme with one-click light/dark switching and persistent storage.
- 🤖 **Bot / Agent Capabilities Restored to Main Branch** — Restored `/history`, `/strategies`, `/research` commands; `/ask` supports multi-stock comparisons and portfolio perspective; Deep Research, event monitoring, and schedule polling pipelines reconnected to mainline.
- 🔒 **Security and Runtime Stability Reinforced** — Fixed `X-Forwarded-For` rate limiting bypass risk; restored official PyPI installation path for LiteLLM; Tushare initialization no longer requires local SDK, reducing vulnerability during Docker, desktop packaging, and environment rebuilds.
- 🖥️ **Daily Usage Polish** — Fixed homepage HK stock autocomplete submission, initial theme flicker on login page, overlapping long stock names in history, and notification disruptions from Telegram Markdown parsing failures.

### Features

- 🎨 **New Light Theme and Dual-Theme Switching** — Web workbench adds complete light theme with one-click light/dark switching in sidebar; persists preference across page reloads; complete redesign of card hierarchy, contrast, input surfaces, status indicators, and background palettes.
- 🤖 **Restored Missing Agent / Bot Capabilities to Main Branch** — `#648` / `#649` restored to `main`: Bot restores `/history`, `/strategies`, `/research`; `/ask` retains multi-stock comparison and portfolio view; Deep Research and Event Monitor configurations visible and editable in Web settings, and schedule mode reconnects event alert polling.

### Improvements

- 🖥️ **Core Pages Standardized on Shared Workbench Visual Language** — `Home / Chat / Backtest / Portfolio / Settings` consolidated under shared design tokens, `input-surface` input systems, empty/error states, and drawer overlay semantics, reducing visual fragmentation and custom styles.
- 💬 **Stock Query Accessibility and Feedback Enhancements** — Chat page strengthens conversation export, notification sending, message copying, history deletion, and follow-up context hints; AI response actions accessible without hover for touchscreens and small displays.
- 📊 **Backtest and Portfolio Surface and State Standardization** — Backtest filter controls, boolean states, result tables, and summary cards unified into shared primitives; portfolio import feedback, FX refresh prompts, empty states, and warnings consolidated into shared components.
- 🧭 **Navigation and Page Shell Cohesion** — Sidebar theme switching, chat completion badges, mobile drawer overlays, and content scrolling contracts unified for consistent navigation across desktop and mobile.

### Tests

- 🧪 **UI Governance and Critical Path Regression Testing** — Added component tests for `SidebarNav`, `ChatPage`, `BacktestPage`, adding UI governance guards preventing interactive elements from reintroducing native `title` attributes or legacy `input-terminal` styles; updated smoke and markdown drawer validations covering post-theme critical paths.

### Fixed

- 🌗 **Web Initial Screen Default Theme Preset to Dark** — `apps/dsa-web/index.html` reads locally saved theme preferences prior to React mounting; immediately presets `dark` on `<html>` and synchronizes `color-scheme` if unset, preventing light theme flicker on initial load.
- 🔐 **Login Page Independent Theme Layer Isolation** — Login page inputs, labels, toggles, and button text use independent `--login-*` visual tokens rather than inheriting global light/dark text colors; retains consistent dark visual identity and cyan password dots even when browser caches light theme.
- 🖥️ **Home Page Hong Kong Stock Symbol Input Fix** — Web home analysis input box properly accepts HK stock symbols and autocomplete selections, recognizing `00700.HK` / `HK00700`, preventing improper "Please enter a valid stock code or name" errors upon submission.

- 🔒 **Authentication Rate Limiting X-Forwarded-For Header Fix (CWE-345)** (#841 / #842) — `get_client_ip()` switches from leftmost `X-Forwarded-For` value to rightmost value, preventing attackers from bypassing brute-force protection via forged header rotation; applies when `TRUST_X_FORWARDED_FOR=true` behind single trusted reverse proxy.
- 📦 **Restored LiteLLM Official PyPI Installation with Security Upper Bound** — `requirements.txt` reinstates `pip install litellm` official PyPI installation path, maintaining minimum `>=1.80.10` while adding `<1.82.7` upper bound to prevent installing compromised `1.82.7` / `1.82.8` versions; Windows desktop packaging scripts revert to standard `pip install -r requirements.txt` pipeline.
- 📨 **Telegram Markdown Parsing Failure Falls Back to Plain Text** (fixes #850) — `src/notification_sender/telegram_sender.py` retries plain text delivery without `parse_mode` upon receiving `HTTP 400` with `can't parse entities` / Markdown parsing errors, preventing content like `*ST` from dropping entire notification.
- 🔢 **A-Share Identical Symbol Real-Time Quotes Retain Exchange Hints** (fixes #852) — `DataFetcherManager` and `TushareFetcher` retain explicit exchange prefixes like `SZ000001` / `000001.SZ`, preventing legacy Tushare real-time quote fallback branch from misidentifying Shenzhen `000001` as Shanghai Composite `sh000001`.
- 🎯 **Multi-Agent Secondary Buy Points No Longer Blindly Duplicate Ideal Buy Points** (fixes #851) — When multi-agent results lack independent `secondary_buy`, dashboard displays `N/A` rather than hard-copying identical value to `ideal_buy`, eliminating misleading duplicate buy point displays.
- 🧩 **Tushare Initialization Removes Hard Dependency on Local SDK** — `TushareFetcher` accesses Tushare Pro directly via built-in HTTP client without requiring `import tushare` at startup; fixes `No module named 'tushare'` errors in Docker, desktop packaging, and environment rebuilds, adding regression tests.
- ⚙️ **`daily_analysis` Workflow Passes `DEEPSEEK_API_KEY` Mapping** — GitHub Actions daily analysis workflow passes `DEEPSEEK_API_KEY`, ensuring cloud scheduled tasks receive runtime environment variables.
- 🖥️ **History List Long Stock Name Truncation and Hover Tooltip** (fixes #815) — Truncates excessively long stock names in history list by character type (English 15, Chinese 8, Mixed 10), displaying full name on hover; resolves text overlapping with status badges at 1920x1080 resolution; added `stockName.ts` utility and tests.

### Documentation

- 🧾 **README Donation Link Updated to Xiaohongshu QR Code** — Updated sponsorship entry in README and bilingual documentation to Xiaohongshu QR code asset for consistency.

## [3.10.1] - 2026-03-24

### Features

- 🔔 **Web Analysis Push Notification Toggle** (#808) — Added "Push Notification" checkbox beside home analysis button, checked by default; unchecking skips sending Telegram/WeChat notifications for current run; `POST /api/v1/analysis/analyze` adds `notify` field (`bool`, default `true`), Bot and scheduled tasks unaffected.

### Improvements

- 🖥️ **Chat / Backtest Layout and Shell Integration** — Unified Chat / Backtest page containers, shared UI state, and follow-up interaction flows, removing hardcoded height constraints for smoother padding and scrolling.
- 🎨 **Global Visuals and Shared Components Convergence** — Light theme introduces dynamic HSL shadow system, unifying sidebar active states, alert contrast, and chat bubbles, standardizing inline styles into semantic CSS variables.

### Fixed

- 🖼️ **System Settings Smart Import File Selection Restored** — Fixed issue where clicking "Select Image / Select File" buttons in "System Settings > Basic Settings > Smart Import" produced no response.
- 🖥️ **Mobile Scrolling and Interaction Layering Fixes** — Resolved z-index conflict where theme toggle menu was covered by main content on mobile; restored normal vertical scrolling for long reports on homepage without affecting other pages.
- 🧾 **Markdown Plain Text Copy Cleaning Enhanced** — Improved plain text export algorithm to reliably strip table separators and Markdown formatting when copying analysis reports, improving purity of shared and archived content.
- 🧠 **Trading Philosophy Injection Covers Legacy + Agent Pipelines** (#810) — `GeminiAnalyzer`, single-Agent mode, and skill-aware prompts share same strategy injection state; legacy trend prompts retained only on implicit fallback to built-in default `bull_trend`; explicit strategy selection or custom default skills no longer silently overlay `MA5>MA10>MA20` bullish baseline.
- 🛠️ **Backend CI Dependency Installation Stabilization** (#835) — Split backend gate stages, added retries for dependency installation, and switched CI `litellm` installation source to stable GitHub repository, mitigating intermittent backend gate failures from dependency resolution fluctuations.
- 🪟 **Windows Desktop Release Build Restores LiteLLM Installation Compatibility** — `scripts/build-backend.ps1` filters LiteLLM GitHub source packages from `requirements.txt`, downloading tagged zipball and removing optional upstream `enterprise/` directory prior to installation, bypassing Poetry wheel build directory packaging errors on Windows runners; added `pip install` exit code checks.

### Tests

- 🧪 **Chat / Backtest / Smart Import Regression Test Coverage** — Updated E2E smoke expectations, adding regression assertions for `DashboardStateBlock`, Chat page, smart import file selection, and interactions.

## [3.10.0] - 2026-03-24

### Release Highlights

- 🔎 **Autocomplete and Indexing Tools Expanded Across Three Markets** — Autocomplete index generation pipeline covers A-shares, HK, and US equities, accompanied by new Tushare stock list scraping tools and complete static index data.
- 🖥️ **Dashboard and Report Review Experience Consolidated** — Unified homepage Dashboard panels, status boundaries, typography hierarchy, and full report table density; report details add Markdown/plain text copying and reliable button interactions.
- 🤖 **Agent Skill and Market Semantic Boundaries Clarified** — Converged skill bundles, default strategies, backtest summary semantics, and compatibility endpoints; analysis prompt no longer hardcodes A-share context, generating tailored content for US and HK equities according to respective market rules.
- ⏰ **Scheduler and Desktop Configuration Aligned with Production Usage** — Desktop app supports `.env` import/export; `python main.py --schedule --stocks ...` no longer locks startup stock snapshots into subsequent scheduled executions, following latest saved `STOCK_LIST`.
### Features

- 💾 **Desktop `.env` Backup / Restore Interface** (#754) — Desktop system settings page adds "Export .env" and "Import .env" buttons to backup saved configurations or restore merged key-values into current `.env`; import utilizes existing `config_version` conflict protection and runtime reload pipelines.
- 📊 **Tushare Stock List Retrieval Tool** — Added `scripts/fetch_tushare_stock_list.py` fetching A-share, HK, and US equity lists from Tushare Pro and saving to CSV, featuring paginated fetching, rate limiting, error handling, and progress indicators; added user guide `docs/TUSHARE_STOCK_LIST_GUIDE.md`.
- 🔎 **Index Generator Multi-Market Support** — Refactored `generate_index_from_csv.py` to support dual Tushare and AkShare data sources across A-shares, HK, and US markets; added market-specific alias mappings (common aliases for A-shares/HK, common abbreviations for US stocks); added `--source` and `--test` parameters; strictly filters US DUMMY records.
- 🔎 **Index Generator Enhancements** — `generate_stock_index.py` adds `--test`/`-t` test mode and `--verbose`/`-v` verbose mode, market distribution statistics, and optimized JSON formatting.
- 📋 **Home Full Report Supports Dual-Mode Copying** — Historical report header adds "Copy Markdown Source" and "Copy Plain Text" buttons; former preserves Markdown structure, latter strips formatting for sharing and cross-report comparisons; button copy respects `REPORT_LANGUAGE`.
- 🧩 **Stock Analysis Page Displays Associated Sectors** (#669) — A-share analysis write path writes `belong_boards` to `fundamental_context` / `fundamental_snapshot`; structured report details append `belong_boards` and `sector_rankings` fields; Web analysis page displays associated sectors and whether they hit daily leaderboards; fails open when data is absent.

### Improvements

- 🖥️ **Dashboard Panel Standardization (PR7-2)** — Added `DashboardPanelHeader` and `DashboardStateBlock` as reusable components for history, report, intel, task, and transparency panels; unified heading hierarchy, loading/empty/error states, and CSS variable tokens.
- 🖥️ **HomePage State Boundary Convergence (PR7-2)** — Introduced `useHomeDashboardState` hook, centralizing `stockPoolStore` selection logic and removing duplicated local state derivations and callbacks in `HomePage`.
- 🧭 **Agent Skill Unified under Single Configuration Semantic** — Multi-Agent runtime, API, Web chat, and configuration metadata unified around `skill` concept; `/api/v1/agent/skills` serves as primary discovery endpoint, `AGENT_SKILL_*` as primary config interface; declared default-enabled flags, sorting priorities, and market regime tags.
- 🔎 **Autocomplete Index Data Refresh** — Regenerated `stocks.index.json` covering A-shares, HK, and US markets, improving autocomplete coverage.
- 🧾 **Dashboard Typography and Report Table Density Refinements** — Standardized font scales across sidebar, empty states, and history controls; adjusted table `th/td` padding in Markdown reports to compact 4-6px range, aligning density with Dashboard rhythm.

### Fixed

- ⏰ **Scheduled Mode Unlocks Startup CLI Stock Snapshot** — `python main.py --schedule --stocks ...` no longer forces subsequent scheduled runs to use startup stock list; re-reads latest saved `STOCK_LIST` before every trigger, ensuring updated watchlist participate in future notifications.
- 🌍 **LLM Prompt Dynamically Injects Context by Stock Market** — Analysis pipeline no longer hardcodes market rules to A-shares; system prompt identifies A-shares, HK, or US equities from symbol, injecting corresponding role descriptions and trading rules to eliminate misaligned conclusions.
- 🔎 **US Stock Autocomplete Deduplicates Reused Tickers** — `generate_index_from_csv.py` folds reused US tickers by `ts_code` when importing Tushare `us_basic` CSV, preserving active records to avoid duplicate `canonicalCode` entries in `stocks.index.json`.
- 🧾 **Web Report Details Copy Interaction Stability Fix** (#749) — Fixed clickability layer of copy buttons in "Raw Analysis Results / Analysis Snapshot" inside `ReportDetails`, preventing overlay by JSON content; decoupled copy feedback between panels so copying one does not falsely mark both as copied.
- 📊 **Agent Skill Backtest and Compatibility Interface Semantic Convergence** — `get_skill_backtest_summary` requires explicit `skill_id`, returning clear validation errors when absent; returns explicit unsupported/info response when repository has not persisted skill-level summaries, retaining `normalized` and `*_pct` fields.
- 🔧 **Skill Default Selection and Compatibility Layer Hardening** — `allowed-tools` retained solely as `SKILL.md` bundle metadata without leaking into runtime tool selection; `/api/v1/agent/strategies` restores legacy payload shape; passing `skills: []` clears stale context; explicit selection skips default bull-trend, and empty `AGENT_SKILLS` falls back to single primary default skill.

### Tests

- 🧪 **Dashboard Component Test Coverage Expansion (PR7-2)** — Added tests for `ReportNews` and `TaskPanel`; enhanced assertion coverage for `HistoryList`, `ReportDetails`, `HomePage`, `useDashboardLifecycle`, and `stockPoolStore`, covering delete rollbacks, mobile drawers, and task lifecycle.
- 🧪 **Multi-Market Index Generation Tests** — Added `tests/test_generate_index_from_csv.py`, covering Tushare/AkShare dual source parsing, multi-market detection, US DUMMY filtering, and ticker deduplication.
- 🧪 **Associated Sector Write and API Contract Regression** — Added `tests/test_pipeline_related_boards.py` with analysis history and API contract tests, ensuring `belong_boards` / `sector_rankings` remain incremental extensions and fail open.
- 🧪 **Scheduled Mode Stock List Semantic Regression Tests** — Added `tests/test_main_schedule_mode.py`, covering scheduled mode ignoring startup `--stocks` snapshot while single runs retain CLI stock overrides.

### Documentation

- 📘 **Added Tushare Stock List Tool Documentation** — Added `docs/TUSHARE_STOCK_LIST_GUIDE.md` explaining stock list scraper usage, data formats, and FAQ.
- 🌍 **Bilingual Documentation for Scheduled Mode and Associated Sectors** — `docs/full-guide.md` / `docs/full-guide_EN.md` clarifies scheduled mode re-reads `STOCK_LIST` before each run, adding associated sector display documentation.
- 🧭 **Adjusted Agent Terminology Compatibility Copy** — README, bilingual docs, settings, and chat interface continue using "Strategy" as primary user-facing term while introducing `skill` as internal unified name.

## [3.9.0] - 2026-03-20

### Release Highlights

- 🤖 **More Flexible Model Pipelines and Report Language** — Agent can now select model pipelines independently via `AGENT_LITELLM_MODEL`; standard analysis and Agent reports can output unified language via `REPORT_LANGUAGE=zh|en`, eliminating "English content + Chinese shell" mixing and allowing teams to balance cost, latency, and capability between primary analysis and Agent workflows.
- 🔎 **Closed-Loop Home Analysis Experience Enhancements** — Added local-index-driven stock auto-complete on home page supporting symbols, Chinese names, pinyin, and aliases; consolidated Dashboard state into a unified store for more stable drawer interactions (history, reports, news, Markdown); "Ask AI" follow-ups now prioritize current report context.
- 💬 **Expanded Notifications and Retrieval Capabilities** — Added first-class Slack notifications; SearXNG automatically discovers public instances with controlled fallback polling when self-hosted instances are not configured; Tavily real-time news retrieval fixes prevent strict freshness filters from discarding valid results.
- 💼 **More Reliable Portfolio and Market Review Pipelines** — A-share market review optionally integrates TickFlow for enhanced index quotes and market breadth; portfolio ledger writes are serialized to reduce concurrent overselling windows; FX refresh entry points and disabled-state indicators are clearer to prevent confusion.

### Features

- 🔎 **Web Stock Autocomplete MVP** — Added local-index-driven autocomplete to home analysis input box, supporting stock symbols, Chinese names, pinyin, and alias matching; submitting selected candidates passes canonical code along with `stock_name`, `original_query`, and `selection_source` to analysis requests, task status, and SSE events; falls back to legacy input mode if index loading fails without blocking submissions. Added static index loader, index generator scripts, and frontend/backend contract tests. Rolled out in phases, Phase 1 supports A-shares only.
- 💬 **First-Class Slack Notification Channel** — Added native Slack notification support for both Bot Token and Incoming Webhook; prioritizes Bot API when both are configured to ensure text and images are posted to the same channel; Bot Token mode supports image upload (raw body POST, non-multipart); added `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`, `SLACK_WEBHOOK_URL` configuration settings, with GitHub Actions workflows passing corresponding Secrets.
- 🌍 **Configurable Report Output Language** (Issue #758) — Added `REPORT_LANGUAGE=zh|en`, defaults to `zh`; language setting is injected into standard analysis and Agent prompts, and covers Markdown/Jinja templates, notification fallbacks, history/API `report_language` metadata, and Web report static copy, preventing mixed "English content + Chinese shell" outputs.
- 🚀 **Decoupled Agent and Standard Analysis Models** (Issue #692) — Added `AGENT_LITELLM_MODEL` (inherits `LITELLM_MODEL` when empty, normalizes unprefixed names as `openai/<model>`); Agent execution pipeline and `/api/v1/agent/models` flags (`is_primary/is_fallback`) now reflect actual Agent model pipelines; system configuration and startup validation check for `unknown_model/missing_runtime_source` against `AGENT_LITELLM_MODEL`; Web settings adds Agent primary model selection synchronized with channel mode runtime config.
- 🔎 **SearXNG Public Instance Discovery and Controlled Polling** (#752) — Added `SEARXNG_PUBLIC_INSTANCES_ENABLED`; fetches public instance lists from `searx.space` when `SEARXNG_BASE_URLS` is unset, selecting instances via controlled round-robin; automatically switches to the next instance upon timeout, connection error, non-200 HTTP status, or invalid JSON. Preserves existing priority and semantics for self-hosted instances; `daily_analysis` GitHub Actions workflow supports passing this toggle explicitly with logging.
- 📈 **TickFlow market review enhancement** (#632) — Added optional `TICKFLOW_API_KEY`; when configured, A-share market review primary index quotes attempt TickFlow first; if the TickFlow plan supports symbol pool queries, market breadth statistics also attempt TickFlow first. Immediately falls back to existing `AkShare / Tushare / efinance` pipelines upon failure or insufficient permissions; sector leaderboards maintain existing fallback order. Adapted to official SDK contracts: batches main index queries within request limits and unifies proportional `change_pct` / `amplitude` to project percentage standards.

### Improvements

- **Dashboard state slice and workspace closure** — moved Home / Dashboard state into `stockPoolStore`, consolidated history selection, report loading, task syncing, polling refresh, and markdown drawer handling under a single state slice.
- **Dashboard panel standardization** — kept the current dashboard layout contract stable while unifying history, report, news, and markdown presentation with shared tokens, standardized states, and bounded in-panel scrolling for the history list.
- **Dashboard-to-chat follow-up bridge** — routed “Ask AI” follow-ups through report-context hydration instead of direct cross-page state coupling, while keeping chat sends usable when enriched history context is still loading.
- 💼 **Serialized Concurrent Portfolio Ledger Writes** (#742) — Portfolio transaction event writes/deletions now acquire serialized write locks under SQLite to reduce concurrent overselling windows; direct portfolio write endpoints return `409 portfolio_busy` on lock contention, and CSV imports submit sequentially counting busy locks toward `failed_count`.
- 💱 **Portfolio FX Manual Refresh Entry Point** (#748) — Web `/portfolio` page now displays a "Refresh Exchange Rates" button on the "FX Status" card, invoking `POST /api/v1/portfolio/fx/refresh`; reloads only snapshot and risk data, providing inline feedback ("Updated / Still Stale / Refresh Failed") to prevent misunderstandings over persistent `fxStale` indicators.

### Fixed

- 🔎 **Web Autocomplete Enter Key Submission Semantics** — Stock autocomplete no longer defaults to highlighting the first item upon search match; when candidate list is expanded but user has not explicitly navigated with arrow keys or mouse, pressing Enter submits raw input, preventing unintentional overwrite by the first suggestion.
- 🌍 **`REPORT_LANGUAGE` Startup Parsing and History Localization Boundaries** — `Config` continues to follow "real environment variables first, `.env` fallback" startup semantics, emitting explicit warnings on conflict; `/api/v1/history/{id}` English responses localize `sentiment_label`, and historical Markdown correctly recognizes risk level emojis for English `bias_status`, eliminating mixed displays like `Optimistic` or `🚨Safe`.
- 📰 **Tavily Fresh News Retrieval Publication Date Mapping** (#782) — Tavily explicitly sets `topic="news"` for stock news and strict-freshness intel dimensions, supporting both `published_date` and `publishedDate` fields; fixes bug where returned results were dropped as `drop_unknown` in hard-filtering stage, while restoring analytical dimensions (institutional analysis, earnings expectations, industry research) to broad search without forcing news mode.
- 💱 **Portfolio FX Refresh Disabled Semantics** (#772) — When `PORTFOLIO_FX_UPDATE_ENABLED=false`, `POST /api/v1/portfolio/fx/refresh` returns explicit `refresh_enabled=false` and `disabled_reason`; Web `/portfolio` page clearly indicates "Online exchange rate refresh is disabled" instead of falsely reporting "No refreshable currency pairs in current scope".
- 🤖 **Agent timeout and config hardening** — `AGENT_ORCHESTRATOR_TIMEOUT_S` now also protects the legacy single-agent ReAct loop, parallel tool batches stop waiting once the remaining budget is exhausted, and invalid numeric `.env` values fall back to safe defaults with warnings instead of crashing startup.
- 🌐 **CORS wildcard + credentials compatibility** — `CORS_ALLOW_ALL=true` no longer combines `allow_origins=["*"]` with credentialed requests, avoiding browser-side cross-origin failures in demo/development setups.
- 🧭 **Unavailable Agent settings hidden from Web UI** — Deep Research / Event Monitor controls are now treated as compatibility-only metadata in the current branch and are removed from the Settings page to avoid exposing non-functional toggles.

### Documentation

- Added Ollama local model configuration instructions, updating `README.md` and `docs/README_EN.md` (Fixes #690)
- Improved Ollama documentation: added `OLLAMA_API_BASE` to environment variable tables and notes in `docs/full-guide.md` / `docs/full-guide_EN.md`, clarifying Ollama as standalone configuration; consolidated duplicate `OLLAMA_API_BASE` entries
- Clarified documentation governance boundaries: added default synchronization rules between `README.md`, topical docs, bilingual docs, and delivery notes to prevent future drift

## [3.8.0] - 2026-03-17

### Release Highlights

- 🎨 **Web Interface Structural Upgrade** — New App Shell, sidebar navigation, theme capabilities, login and system settings workflows connected into unified experience; desktop loading background aligned.
- 📈 **Analysis Context Strengthened** — US equities add social sentiment intelligence, A-shares complete structured financial report and dividend context, Tushare integrates chip distribution and sector performance.
- 🔒 **Runtime Stability and Configuration Compatibility** — Logout immediately invalidates existing sessions, scheduled startup maintains legacy config compatibility, and `MAX_WORKERS` runtime tuning and news freshness feedback are clearer.
- 💼 **Complete Portfolio Error Correction Pipeline** — Overselling is intercepted upfront, and erroneous trades, cash flows, or corporate actions can be deleted/rolled back to repair corrupted data.

### Features

- 📱 **US Equities Social Sentiment Intelligence** — Added Reddit / X / Polymarket social media sentiment data sources, providing real-time buzz, sentiment scores, and mention metrics; completely optional, active for US stocks only when `SOCIAL_SENTIMENT_API_KEY` is configured.
- 📊 **A-Share Financial Reports and Dividend Structured Data** (Issue #710) — Added `financial_report` and `dividend` fields to `fundamental_context.earnings.data`; dividends computed uniformly as "cash dividend only, pre-tax", adding `ttm_cash_dividend_per_share` and `ttm_dividend_yield_pct`; analysis and history APIs append optional `financial_report` and `dividend_metrics` fields in `details`, maintaining fail-open backward compatibility.
- 🔍 **Tushare Chip Distribution and Industry Sectors Integration** — Added chip distribution and industry sector performance retrieval, unified under configurable data source priority; queries Shanghai time for intraday/post-market trading days, prioritizing Tushare Flush interface with fallback to EastMoney.
- 🧱 **Web UI Foundation Structural Upgrade** — Rebuilt shared design tokens and common components, adding App Shell, Theme Provider, sidebar navigation, and aligned Electron loading background for unified Web/Desktop experience.
- 🔐 **Reworked Login and System Settings Flow** — Refactored Login, Settings, and Auth management flows, adding explicit authentication setup-state handling and aligning Web behavior with runtime authentication configuration APIs.
- 🧪 **Frontend Regression and Smoke Test Coverage** — Added and expanded component tests and Playwright smoke coverage for login, home, chat, mobile shell, settings, and backtesting entry points.

### Changed

- 🧭 **Page Integration into New Shell Layout Contracts** — Home, Chat, Settings, and Backtest integrated into new page container, drawer, and scrolling conventions, eliminating UI discrepancies during migration.
- 💾 **More Reliable Settings Page State Sync** — Optimized draft retention, direct save synchronization, and conflict handling, preventing state mismatch between frontend and backend after module-level saves.
- 🎭 **Login Page Visual Baseline Alignment** — Restored login page to established `006` visual baseline while retaining new authentication state logic and unified form interaction model.
- 🏛️ **AI Collaboration Governance Asset Hardening** — Converged and strengthened consistency constraints across `AGENTS.md`, `CLAUDE.md`, Copilot instructions, and validation scripts to prevent governance drift.

### Added

- **Web UI foundation refresh** — rebuilt shared design tokens and common primitives, introduced the app shell, theme provider, sidebar navigation, and Electron loading background alignment for the upgraded desktop/web experience
- **Settings and auth workflow overhaul** — rebuilt the Login, Settings, and Auth management flows, added explicit auth setup-state handling, and aligned the Web UI with the runtime auth configuration APIs
- **UI regression coverage and smoke checks** — expanded targeted frontend tests and added Playwright smoke coverage for login, home, chat, mobile shell, settings, and backtest entry flows

### Changed

- **Shell-driven page integration** — aligned Home, Chat, Settings, and Backtest with the new shell layout contract so routing, drawer behavior, and page-level scrolling are consistent during the UI migration
- **Settings state consistency** — refined draft preservation, direct-save synchronization, and conflict handling so module-level saves no longer leave the page out of sync with backend config state
- **Login visual baseline** — restored the login page visual treatment to the established `006` branch baseline while keeping the newer auth-state logic and unified form interaction model

### Fixed

- ⏰ **Scheduled Startup Immediate Run Compatibility** (Issue #726) — Falls back to reading `RUN_IMMEDIATELY` when `SCHEDULE_RUN_IMMEDIATELY` is unset, resolving upgrade compatibility for legacy `.env` files in scheduled mode; clarified scopes in `.env.example` / README and noted lack of support for Outlook / Exchange OAuth2 enforcement.
- 🧵 **Runtime `MAX_WORKERS` Configuration and Explainability** (#633) — Fixed issue where async analysis queue did not synchronize with `MAX_WORKERS`; added in-place concurrency sync (instant when idle, deferred when busy) and logs `profile/max/effective` metrics in settings save feedback and runtime logs.
- 🔐 **Logout Immediately Invalidates Existing Sessions** — `POST /api/v1/auth/logout` rotates session secret, preventing revoked cookies from accessing protected endpoints; concurrently open tabs are logged out. When auth is enabled, endpoint is removed from anonymous whitelist and unauthenticated calls return `401` to prevent unauthorized global session invalidation.
- 🧮 **Tushare Sector/Chip Rate Limiting and Cross-Day Cache Fixes** — Added `trade_cal`, industry sector rankings, and chip distribution routes to `_check_rate_limit()`; refreshed trading calendar cache per calendar day to prevent stale date evaluations across midnight.
- 💼 **Portfolio Overselling Interception and Rollback** (#718) — `POST /api/v1/portfolio/trades` validates sellable quantities before writing, returning `409 portfolio_oversell` on excess; portfolio page adds trade, cash flow, and corporate action deletion, invalidating position caches and future snapshots for clean recovery.
- 📧 **Email Chinese Sender Name Encoding** (#708) — Email notifications automatically apply RFC 2047 encoding to `EMAIL_SENDER_NAME` containing non-ASCII characters, with SMTP connection cleanup on error paths, resolving `'ascii' codec can't encode characters` in GitHub Actions and QQ SMTP.
- 🐛 **HK Stock Agent Real-Time Quotes Deduplication and Fast Routing** — Unified symbol normalization for `HK01810` / `1810.HK` / `01810`; routed HK real-time quotes directly to single `akshare_hk` path, avoiding redundant failure cycles through A-share priority lists; short-circuit caches explicit `retriable=false` tool failures to avoid repeated calls within the same turn.
- 📰 **News Freshness Hard Filtering and Window Splitting** (#697) — Added `NEWS_STRATEGY_PROFILE` (`ultra_short/short/medium/long`), calculating effective windows with `NEWS_MAX_AGE_DAYS`; search results undergo hard publication date filtering (drops unknown timestamps, drops expired windows, allows max 1 day in future) with identical constraints on historical fallback paths to prevent stale news from entering alerts.

### Documentation

- ☁️ **Cloud Server Web Interface Deployment and Access Tutorial** (Fixes #686) — Added step-by-step guidance for cloud deployment and external access, lowering self-hosting barriers.
- 🌍 **Completed English Documentation Index and Collaboration Guides** — Added English documentation index, contribution guide, Bot command docs, and bilingual issue/PR templates for global collaboration.
- 🏷️ **Localized README Trendshift Badge** — Added updated capability entry badges across multilingual READMEs to keep feature visibility aligned.

## [3.7.0] - 2026-03-15

### Features

- 💼 **Portfolio Management P0 Full Feature Launch** (#677, Issue #627)
  - **Core Ledger and Snapshot Closure**: Added core data models and API endpoints for accounts, trades, cash transactions, corporate actions, position caching, and daily snapshots; supports FIFO and AVG cost accounting; enforces same-day event sequence (`Cash -> Corporate Action -> Trade`); atomic transactions for portfolio snapshots.
  - **Broker CSV Import**: Initial support for Huatai, CITIC, and CMB with column alias compatibility; two-phase API (parse preview + confirm commit); idempotent deduplication prioritizing `trade_uid` with key-field hash fallback; preserves leading zeros in stock symbols.
  - **Portfolio Risk Reports**: Concentration risk (Top Positions + A-share sectors), historical drawdown monitoring (supports backfilling missing snapshots), stop-loss proximity alerts; multi-currency unified conversion to CNY; falls back to last successful FX rate and flags as stale on fetch errors.
  - **Web Portfolio Page** (`/portfolio`): Portfolio overview, position details, concentration pie charts, risk summary, portfolio/account toggles; manual logging of trades, cash flows, and corporate actions; built-in account creation modal; CSV parsing + commit workflow with broker selector.
  - **Agent Portfolio Tools**: Added `get_portfolio_snapshot` data tool returning compact summary by default, with optional position breakdown and risk metrics.
  - **Event Query APIs**: Added `GET /portfolio/trades`, `GET /portfolio/cash-ledger`, `GET /portfolio/corporate-actions` with date filtering and pagination.
  - **Extensible Parser Registry**: Application-level shared registry supporting runtime registration of new brokers; added `GET /portfolio/imports/csv/brokers` discovery endpoint.

- 🎨 **Frontend Design System and Atomic Component Library** (#662)
  - Introduced progressive dual-theme architecture (HSL variable design tokens), purging legacy CSS; refactored 20+ core components including Button, Card, Badge, Collapsible, Input, Select; added `clsx` + `tailwind-merge` class merging utility; improved readability across History and LLM configuration pages.

- ⚡ **Analysis API Asynchronous Contract and Startup Optimization** (#656)
  - Standardized response contract for asynchronous `POST /api/v1/analysis/analyze` requests; optimized server startup helper logic; resolved frontend report type union misalignment with backend responses.

### Fixed

- 🔔 **Discord Environment Variable Backward Compatibility** (#659): Added runtime fallback reading `DISCORD_CHANNEL_ID` -> `DISCORD_MAIN_CHANNEL_ID`; existing users restore Discord Bot notifications without config changes; aligned all docs and `.env.example`.
- 🔧 **GitHub Actions Node 24 Upgrade** (#665): Upgraded all official GitHub actions to Node 24-compatible versions, eliminating Node.js 20 deprecation warnings in CI logs (affecting 2026-06-02 mandatory upgrade window).
- 📅 **Portfolio Page Default Date Localization**: Manual entry forms default to local time (`getFullYear/Month/Date`), fixing date offset issues for UTC-N timezone users in the evening.
- 🔁 **CSV Import Deduplication Hardening**: Included row index in dedup hash calculation to prevent legitimate split trades from being folded; persisted hash even when `trade_uid` exists to prevent duplicate writes from mixed sources.

### Changed

- `POST /api/v1/portfolio/trades` returns `409` when `trade_uid` conflicts within the same account.
- Portfolio risk responses add incremental `sector_concentration` field while retaining existing `concentration` field.
- Documented asynchronous behavior contract for `analyze` API endpoint; updated frontend report type union.

### Tests

- Added core portfolio service tests (FIFO/AVG partial sales, same-day event sequence, duplicate `trade_uid` 409 responses, snapshot API contracts).
- Added tests for CSV import idempotency, preserving valid split executions, deduplication boundaries, risk thresholds, and FX fallback behavior.
- Added test coverage for Agent `get_portfolio_snapshot` tool invocation.
- Added regression tests for asynchronous analysis API contracts.

## [3.6.0] - 2026-03-14

### Added
- 📊 **Web UI Design System** — implemented dual-theme architecture and terminal-inspired atomic UI components
- 📊 **UI Components Refactoring** — integrated `clsx` and `tailwind-merge` for robust class composition across Web UI

- 🗑️ **History batch deletion** — Web UI now supports multi-selection and batch deletion of analysis history; added `POST /api/v1/history/batch-delete` endpoint and `ConfirmDialog` component.
- 🔐 **Auth settings API** — new `POST /api/v1/auth/settings` endpoint to enable or disable Web authentication at runtime and set the initial admin password when needed
- openclaw Skill Integration Guide — Added [docs/openclaw-skill-integration.md](openclaw-skill-integration.md) explaining how to call DSA APIs via openclaw Skill
- ⚙️ **LLM channel protocol/test UX** — `.env` and Web settings now share the same channel shape (`LLM_CHANNELS` + `LLM_<NAME>_PROTOCOL/BASE_URL/API_KEY/MODELS/ENABLED`); settings page adds per-channel connection testing, primary/fallback/vision model selection, and protocol-aware model prefixing
- 🤖 **Agent architecture Phase 0+1** — shared protocols (`AgentContext`, `AgentOpinion`, `StageResult`), extracted `run_agent_loop()` runner, `AGENT_ARCH` switch (`single`/`multi`), config registry entries
- 🔍 **Bot NL routing** — two-layer natural-language routing: cheap regex pre-filter (stock codes + finance keywords) → lightweight LLM intent parsing; controlled by `AGENT_NL_ROUTING=true`; supports multi-stock and strategy extraction
- 💬 **`/ask` multi-stock analysis** — comma or `vs` separated codes (max 5), parallel thread execution with 150s timeout (preserves partial results), Markdown comparison summary table at top
- 📋 **`/history` command** — per-user session isolation via `{platform}_{user_id}:{scope}` format (colon delimiter prevents prefix collision); lists both `/chat` and `/ask` sessions; view detail or clear
- 📊 **`/strategies` command** — lists available strategy YAML files grouped by category (Trend / Pattern / Reversal / Framework) with ✅/⬜ activation status
- 🔧 **Backtest summary tools** — `get_strategy_backtest_summary` and `get_stock_backtest_summary` registered as read-only Agent tools
- ⚙️ **Agent auto-detection** — `is_agent_available()` auto-detects from `LITELLM_MODEL`; explicit `AGENT_MODE=true/false` takes full precedence
- 🏗️ **Multi-Agent orchestrator (Phase 2)** — `AgentOrchestrator` with 4 modes (`quick`/`standard`/`full`/`strategy`); drop-in replacement for `AgentExecutor` via `AGENT_ARCH=multi`; `BaseAgent` ABC with tool subset filtering, cached data injection, and structured `AgentOpinion` output
- 🧩 **Specialised agents (Phase 2-4)** — `TechnicalAgent` (8 tools, trend/MA/MACD/volume/pattern analysis), `IntelAgent` (news & sentiment, risk flag propagation), `DecisionAgent` (synthesis into Decision Dashboard JSON), `RiskAgent` (7 risk categories, two-level severity with soft/hard override)
- 📈 **Strategy system (Phase 3)** — `StrategyAgent` (per-strategy evaluation from YAML skills), `StrategyRouter` (rule-based regime detection → strategy selection), `StrategyAggregator` (weighted consensus with backtest performance factor)
- 🔬 **Deep Research agent (Phase 5)** — `ResearchAgent` with 3-phase approach (decompose → research sub-questions → synthesise report); token budget tracking; new `/research` bot command with aliases (`/research`, `/deepsearch`)
- 🧠 **Memory & calibration (Phase 6)** — `AgentMemory` with prediction accuracy tracking, confidence calibration (activates after minimum sample threshold), strategy auto-weighting based on historical win rate
- 📊 **Portfolio Agent (Phase 7)** — `PortfolioAgent` for multi-stock portfolio analysis (position sizing, sector concentration, correlation risk, cross-market linkage, rebalance suggestions)
- 🔔 **Event-driven alerts (Phase 7)** — `EventMonitor` with `PriceAlert`, `VolumeAlert`, `SentimentAlert` rules; async checking, callback notifications, serializable persistence
- ⚙️ **New config entries** — `AGENT_ORCHESTRATOR_MODE`, `AGENT_RISK_OVERRIDE`, `AGENT_DEEP_RESEARCH_BUDGET`, `AGENT_MEMORY_ENABLED`, `AGENT_STRATEGY_AUTOWEIGHT`, `AGENT_STRATEGY_ROUTING` — all registered in `config.py` + `config_registry.py` (WebUI-configurable)

### Changed
- 🔐 **Auth password state semantics** — stored password existence is now tracked independently from auth enablement; when auth is disabled, `/api/v1/auth/status` returns `passwordSet=false` while preserving the saved password for future re-enable
- 🔐 **Auth settings re-enable hardening** — re-enabling auth with a stored password now requires `currentPassword`, and failed session creation rolls back the auth toggle to avoid lockout
- ♻️ **AgentExecutor refactored** — `_run_loop` delegates to shared `runner.run_agent_loop()`; removed duplicated serialization/parsing/thinking-label code
- ♻️ **Unified agent switch** — Bot, API, and Pipeline all use `config.is_agent_available()` instead of divergent `config.agent_mode` checks
- 📖 **README.md** — expanded Bot commands section (ask/chat/strategies/history), added NL routing note, updated agent mode description
- 📖 **.env.example** — added `AGENT_ARCH` and `AGENT_NL_ROUTING` configuration documentation
- 🔌 **Analysis API async contract** — `POST /api/v1/analysis/analyze` now documents distinct async `202` payloads for single-stock vs batch requests, and `report_type=full` is treated consistently with the existing full-report behavior

### Fixed
- 🐛 **Analysis API blank-code guardrails** — `POST /api/v1/analysis/analyze` now drops whitespace-only entries before batch enqueue and returns `400` when no valid stock code remains
- 🐛 **Bare `/api` SPA fallback** — unknown API paths now return JSON `404` consistently for both `/api/...` and the exact `/api` path
- 🎮 **Discord channel env compatibility** — runtime now accepts legacy `DISCORD_CHANNEL_ID` as a fallback for `DISCORD_MAIN_CHANNEL_ID`, and the docs/examples now use the same variable name as the actual workflow/config implementation
- 🐛 **Session secret rotation on Windows** — use atomic replace so auth toggles invalidate existing sessions even when `.session_secret` already exists
- 🐛 **Auth toggle atomicity** — persist `ADMIN_AUTH_ENABLED` before rotating session secret; on rotation failure, roll back to the previous auth state
- 🔧 **LLM runtime selection guardrails** — Channel editor in YAML mode no longer overrides `LITELLM_MODEL` / fallback / Vision; system configuration validation adds runtime source checks when all channels are disabled, fixing duplicate prefixes on protocol alias models like `vertexai/...`
- 🐛 **Multi-stock `/ask` follow-up regressions** — portfolio overlay now shares the same timeout budget as the per-stock phase and is skipped on timeout instead of blocking the bot reply; `/history` now stores the readable per-stock summary instead of raw dashboard JSON; condensed multi-stock output now renders numeric `sniper_points` values
- 🐛 **Decision dashboard enum compatibility** — multi-agent `DecisionAgent` now keeps `decision_type` within the legacy `buy|hold|sell` contract and normalizes stray `strong_*` outputs before risk override, pipeline conversion, and downstream statistics/notification summaries
- 🛟 **Multi-Agent partial-result fallback** — `IntelAgent` now caches parsed intel for downstream reuse, shared JSON parsing tolerates lightly malformed model output, and the orchestrator preserves/synthesizes a minimal dashboard on timeout or mid-pipeline parse failure instead of always collapsing to `50/hold/unknown`
- 🐛 **Shared LiteLLM routing restored** — bot NL intent parsing and `ResearchAgent` planning/synthesis now reuse the same LiteLLM adapter / Router / fallback / `api_base` injection path as the main Agent flow, so `LLM_CHANNELS` / `LITELLM_CONFIG` / OpenAI-compatible deployments behave consistently
- 🐛 **Bot chat session backward compatibility** — `/chat` now keeps using the legacy `{platform}_{user_id}` session id when old history already exists, and `/history` can still list / view / clear those pre-migration sessions alongside the new `{platform}_{user_id}:chat` format
- 🐛 **EventMonitor unsupported rule rejection** — config validation/runtime loading now reject or skip alert types the monitor cannot actually evaluate yet, so schedule mode no longer silently accepts permanent no-op rules
- 🐛 **P0 Fundamental Aggregation Stability Fix** (#614) — Fixed `get_stock_info` sector semantics regression (added `belong_boards` while retaining `boards` compatibility alias), introduced streamlined fundamental context return to control tokens, added max-item eviction to fundamental cache, and completed ETF overall status aggregation and NaN sector filtering, ensuring fail-open and minimal invasion.
- 🔧 **GitHub Actions Search Engine Environment Variables** — Added `MINIMAX_API_KEYS`, `BRAVE_API_KEYS`, `SEARXNG_BASE_URLS` mapping to workflows, enabling GitHub Actions users to configure MiniMax, Brave, and SearXNG search services (provider implementation added in v3.5.0 but missing workflow mapping)
- 🤖 **Multi-Agent runtime consistency** — `AGENT_MAX_STEPS` now propagates to each orchestrated sub-agent; added cooperative `AGENT_ORCHESTRATOR_TIMEOUT_S` budget to stop overlong pipelines before they cascade further
- 🔌 **Multi-Agent feature wiring** — `AGENT_RISK_OVERRIDE` now actively downgrades final dashboards on hard risk findings; `AGENT_MEMORY_ENABLED` now injects recent analysis memory + confidence calibration into specialised agents; multi-stock `/ask` now runs `PortfolioAgent` to add portfolio-level allocation and concentration guidance
- 🔔 **EventMonitor runtime wiring** — schedule mode can now load alert rules from `AGENT_EVENT_ALERT_RULES_JSON`, poll them at `AGENT_EVENT_MONITOR_INTERVAL_MINUTES`, and send triggered alerts through the existing notification service
- 🛠️ **Follow-up stability fixes** — multi-stock `/ask` now falls back to usable text output when dashboard JSON parsing fails; EventMonitor skips semantically invalid rules instead of aborting schedule startup; background alert polling now runs independently of the main scheduled analysis loop
- 🧪 **Multi-Agent regression coverage** — added orchestrator execution tests for `run()`, `chat()`, critical-stage failure, graceful degradation, and timeout handling
- 🧹 **PortfolioAgent cleanup** — `post_process()` now reuses shared JSON parsing and removed stale unused imports
- 🚦 **Bot async dispatch** — `CommandDispatcher` now exposes `dispatch_async()`; NL intent parsing and default command execution are offloaded from the event loop, DingTalk stream awaits async handlers directly, and Feishu stream processing is moved off the SDK callback thread
- 🌐 **Async webhook handler** — new `handle_webhook_async()` function in `bot/handler.py` for use from async contexts (e.g. FastAPI); calls `dispatch_async()` directly without thread bridging
- 🧵 **Feishu stream ThreadPoolExecutor** — replaced unbounded per-message `Thread` spawning with a capped `ThreadPoolExecutor(max_workers=8)` to prevent thread explosion under message bursts
- 🔒 **EventMonitor safety** — `_check_volume()` now safely handles `get_daily_data` returning `None` (no tuple-unpacking crash); `on_trigger` callbacks support both sync and async callables via `asyncio.to_thread`/`await`
- 🧹 **ResearchAgent dedup** — `_filtered_registry()` now delegates to `BaseAgent._filtered_registry()` instead of duplicating the filtering logic
- 🧹 **Bot trailing whitespace cleanup** — removed W291/W293 whitespace issues across `bot/handler.py`, `bot/dispatcher.py`, `bot/commands/base.py`, `bot/platforms/feishu_stream.py`, `bot/platforms/dingtalk_stream.py`
- 🐛 **Dispatcher `_parse_intent_via_llm` safety** — replaced fragile `'raw' in dir()` with `'raw' in locals()` for undefined-variable guard in `JSONDecodeError` handler
- 🐛 **Chip structure fallback when LLM omits it** (#589) — When models like DeepSeek omit `chip_structure`, automatically populates with chip data already retrieved from data sources to ensure consistent display across models; applies to both standard analysis and Agent mode
- 🐛 **Historical report sniper points display raw text** (#452) — History detail page now prioritizes raw strings from `raw_result.dashboard.battle_plan.sniper_points`, preventing `analysis_history` numeric columns from compressing ranges, notes, or complex points into a single number; retains numeric column as fallback
- 🐛 **Session prefix collision** — user ID `123` could see sessions of user `1234` via `startswith`; fixed with colon delimiter in session_id format
- 🐛 **NL pre-filter false positives** — `re.IGNORECASE` caused `[A-Z]{2,5}` to match common English words like "hello"; removed global flag, use inline `(?i:...)` only for English finance keywords
- 🐛 **Dotted ticker in strategy args** — `_get_strategy_args()` didn't recognize `BRK.B` as a stock code, leaving it in strategy text; now accepts `TICKER.CLASS` format
- ⏱️ **efinance long-call hang fix** (#660) — Wrapped all efinance API calls in `_ef_call_with_timeout()` (default 30 seconds, configurable via `EFINANCE_CALL_TIMEOUT`); uses `executor.shutdown(wait=False)` to prevent main thread blocking upon timeout, completely resolving 81-minute hangs
- 🛡️ **Type-safe content integrity check** (#660) — `check_content_integrity()` now treats non-string `operation_advice` / `analysis_summary` as missing fields, preventing downstream `get_emoji()` crashes on `dict.strip()`
- 📄 **Decoupled report saving and notifications** (#660) — `_save_local_report()` is no longer triggered by `send_notification` flag; local reports are saved normally under `--no-notify` mode
- 🔄 **operation_advice dictionary normalization** (#660) — Pipeline and BacktestEngine now map dictionary `operation_advice` returned by LLMs to standard strings via case-insensitive `decision_type`, preventing crashes from model output format variations
- 🛡️ **runner.py usage None guard** (#660) — When `response.usage` is `None`, no longer raises `AttributeError`, falling back to 0 token count
- 📋 **orchestrator silent failures changed to log warnings** (#660) — `IntelAgent` / `RiskAgent` phase failures now log `WARNING` instead of silently skipping, facilitating diagnosis

### Notes
- ⚠️ **Multi-worker auth toggles** — runtime auth updates are process-local; multi-worker deployments must restart/roll workers to keep auth state consistent

## [3.5.0] - 2026-03-12

### Added
- 📊 **Web UI full report drawer** (Fixes #214) — history page adds "Full Report" button to display the complete Markdown analysis report in a side drawer; new `GET /api/v1/history/{record_id}/markdown` endpoint
- 📊 **LLM cost tracking** — all LLM calls (analysis, agent, market review) recorded in `llm_usage` table; new `GET /api/v1/usage/summary?period=today|month|all` endpoint returns aggregated token usage by call type and model
- 🔍 **SearXNG search provider** (Fixes #550) — quota-free self-hosted search fallback; priority: Bocha > Tavily > Brave > SerpAPI > MiniMax > SearXNG
- 🔍 **MiniMax web search provider** — `MiniMaxSearchProvider` with circuit breaker (3 failures → 300s cooldown) and dual time-filtering; configured via `MINIMAX_API_KEYS`
- 🤖 **Agent models discovery API** — `GET /api/v1/agent/models` returns available model deployments (primary/fallback/source/api_base) for Web UI model selector
- 🤖 **Agent chat export & send** (#495) — export conversation to .md file; send to configured notification channels; new `POST /api/v1/agent/chat/send`
- 🤖 **Agent background execution** (#495) — analysis continues when switching pages; badge notification on completion; auto-cancel in-progress stream on session switch
- 📝 **Report Engine P0** — Pydantic schema validation for LLM JSON; Jinja2 templates (markdown/wechat/brief) with legacy fallback; content integrity checks with retry; brief mode (`REPORT_TYPE=brief`); history signal comparison
- 📦 **Smart import** — multi-source import from image/CSV/Excel/clipboard; Vision LLM extracts code+name+confidence; name→code resolver (local map + pinyin + AkShare); confidence-tiered confirmation
- ⚙️ **GitHub Actions LiteLLM config** — workflow supports `LITELLM_CONFIG`/`LITELLM_CONFIG_YAML` for flexible AI provider configuration
- ⚙️ **Config engine refactor & system API** (#602) — unified config registry, validation and API exposure
- 📖 **LLM configuration guide** — new `docs/LLM_CONFIG_GUIDE.md` covering 3-tier config, quick start, Vision/Agent/troubleshooting

### Fixed
- 🐛 **analyze_trend always reports No historical data** (#600) — now fetches from DB/DataFetcher instead of broken `get_analysis_context`
- 🐛 **Chip structure fallback when LLM omits it** (#589) — auto-fills from data source chip data for consistent display across models
- 🐛 **History sniper points show raw text** (#452) — prioritizes original strings over compressed numeric values
- 🐛 **GitHub Actions ENABLE_CHIP_DISTRIBUTION configurable** (#617) — no longer hardcoded, supports vars/secrets override
- 🐛 **`.env` save preserves comments and blank lines** — Web settings no longer destroys `.env` formatting
- 🐛 **Agent model discovery fixes** — legacy mode includes LiteLLM-native providers; source detection aligned with runtime; fallback deployments no longer expanded per-key
- 🐛 **Stooq US stock previous close semantics** — no longer misuses open price as previous close
- 🐛 **Stock name prefetch regression** — prioritizes local `STOCK_NAME_MAP` before remote queries
- 🐛 **AkShare limit-up/down calculation** (#555) — fixed market analysis statistics
- 🐛 **AkShare Tencent source field index & ETF quote mapping** (#579)
- 🐛 **Pytdx stock name cache pagination** (#573) — prevents cache overflow
- 🐛 **PushPlus oversized report chunking** (#489) — auto-segments long content
- 🐛 **Agent chat cancel & switch** (#495) — cancel no longer misreports as failure; fast switch no longer overwrites stream state
- 🐛 **MiniMax search status in `/status` command** (#587)
- 🐛 **config_registry duplicate BOCHA_API_KEYS** — removed duplicate dict entry that silently overwrote config

### Changed
- 🔎 **Fetcher failure observability** — logs record start/success/failure with elapsed time, failover transitions; Efinance/Akshare include upstream endpoint and classified failure categories
- ♻️ **Data source resilience & cleanup** (#602) — fallback chain optimization
- ♻️ **Image extract API response extension** — new `items` field (code/name/confidence); `codes` preserved for backward compatibility
- ♻️ **Import parse error messages** — specific failure reasons for Excel/CSV; improved logging with file type and size

### Docs
- 📖 LLM config guide refactored for clarity (#583)
- 📖 `image-extract-prompt.md` with full prompt documentation
- 📖 AkShare fallback cache TTL documentation
## [3.4.10] - 2026-03-07

### Fixed
- 🐛 **EfinanceFetcher ETF OHLCV data** (#541, #527) — switch `_fetch_etf_data` from `ef.fund.get_quote_history` (NAV-only, no OHLCV, no `beg`/`end` params) to `ef.stock.get_quote_history`; ETFs now return proper open/high/low/close/volume/amount instead of zeros; remove obsolete NAV column mappings from `_normalize_data`
- 🐛 **tiktoken 0.12.0 `Unknown encoding cl100k_base`** (#537) — pin `tiktoken>=0.8.0,<0.12.0` in requirements.txt to avoid plugin-registration regression introduced in 0.12.0
- 🐛 **Web UI API error classification** (#540) — frontend no longer treats every HTTP 400 as the same "server/network" failure; now distinguishes Agent disabled / missing params / model-tool incompatibility / upstream LLM errors / local connection failures
- 🐛 **BSE stock symbol identification failure** (#491, #533) — 6-digit symbols starting with 8/4/92 are now properly recognized as Beijing Stock Exchange; Tushare/Akshare/Yfinance data sources support .BJ or bj prefix; Baostock/Pytdx explicitly switch data providers for BSE symbols; avoids misidentifying Shanghai B-shares 900xxx
- 🐛 **Sniper point parsing error** (#488, #532) — Ideal buy / secondary buy fields previously mis-extracted technical indicator numbers inside parentheses when the character "yuan" was missing; now trims content after the first parenthesis before extraction

### Added
- **Markdown-to-image for dashboard report** (#455, #535) — Single-stock daily summary supports markdown-to-image push (Telegram, WeChat, Custom, Email), consistent with market review behavior
- **markdown-to-file engine** (#455) — Optional `MD2IMG_ENGINE=markdown-to-file`, better emoji support, requires `npm i -g markdown-to-file`
- **PREFETCH_REALTIME_QUOTES** (#455) — Setting to `false` disables real-time quote prefetching, avoiding full-market pulls via efinance/akshare_em
- **Stock name prefetch** (#455) — Prefetches stock names prior to analysis, reducing "stock_xxxxx" placeholders in reports
- 📊 **Analysis report model tagging** (#528, #534) — Displays `model_used` (full LLM model name) in report metadata, report footer, and notification content; tracks and displays the actual model used per turn during multi-turn Agent calls (supporting fallback switching)

### Changed
- **Enhanced markdown-to-image failure warning** (#455) — Displays specific missing dependency hints (wkhtmltopdf or m2f) upon image conversion failure
- **WeChat-only image routing optimization** (#455) — When only WeChat Work image push is configured, bypasses redundant image conversion of the full report to prevent misleading error logs
- **Stock name prefetch lightweight mode** (#455) — Skips real-time quote queries during the stock name prefetching stage, reducing unnecessary network overhead

## [3.4.9] - 2026-03-06

### Added
- 🧠 **Structured config validation** — `ConfigIssue` dataclass and `validate_structured()` with severity-aware logging; `CONFIG_VALIDATE_MODE=strict` aborts startup on errors
- 🖼️ **Vision model config** — `VISION_MODEL` and `VISION_PROVIDER_PRIORITY` for image stock extraction; provider fallback (Gemini → Anthropic → OpenAI → DeepSeek) when primary fails
- 🚀 **CLI init wizard** — `python -m dsa init` 3-step interactive bootstrap (model → data source → notification), 9 provider presets, incremental merge by default
- 🔧 **Multi-channel LLM support** with visual channel editor (#494)

### Changed
- ♻️ **Vision extraction** — migrated from gemini-3 hardcode to `litellm.completion()` with configurable model and provider fallback; `OPENAI_VISION_MODEL` deprecated in favor of `VISION_MODEL`
- ♻️ **Market analyzer** — uses `Analyzer.generate_text()` for LLM calls; fixes bypass and Anthropic `AttributeError` when using non-Router path
- ♻️ **Config validation refinements** — test_env output format syncs with `validate_structured` (severity-aware ✓/✗/⚠/·); Vision key warning when `VISION_MODEL` set but no provider API key; market_analyzer test covers `generate_market_review` fallback when `generate_text` returns None
- ⚙️ **Auto-tag workflow defaults to NO tag** — only tags when commit message explicitly contains `#patch`, `#minor`, or `#major`
- ♻️ **Formatter and notification refactor** (#516)

### Fixed
- 🐛 **STOCK_LIST not refreshed on scheduled runs** — `.env` or WebUI changes to `STOCK_LIST` now hot-reload before each scheduled analysis (#529)
- 🐛 **WebUI fails to load with MIME type error** — SPA fallback route now resolves correct `Content-Type` for JS/CSS files (#520)
- 🐛 **AstrBot sender docstring misplaced** — `import time` placed before docstring in `_send_astrbot`, causing it to become dead code
- 🐛 **Telegram Markdown link escaping** — `_convert_to_telegram_markdown` escaped `[]()` characters, breaking all Markdown links in reports
- 🐛 **Duplicate `discord_bot_status` field** in Config dataclass — second declaration silently shadowed the first
- 🧹 **Unused imports** — removed `shutil`/`subprocess` from `main.py`
- 🔧 **Config validation and Vision key check** (#525)

### Docs
- 📝 Clarified GitHub Actions non-trading-day manual run controls (`TRADING_DAY_CHECK_ENABLED` + `force_run`) for Issue #461 / PR #466

## [3.4.8] - 2026-03-02

### Fixed
- 🐛 **Desktop exe crashes on startup with `FileNotFoundError`** — PyInstaller build was missing litellm's JSON data files (e.g. `model_prices_and_context_window_backup.json`). Added `--collect-data litellm` to both Windows and macOS build scripts so the files are correctly bundled in the executable.

### CI
- 🔧 Cache Electron binaries on macOS CI runners to prevent intermittent EOF download failures when fetching `electron-vX.Y.Z-darwin-*.zip` from GitHub CDN
- 🔧 Fix macOS DMG `hdiutil Resource busy` error during desktop packaging

### Docs
- 📝 Clarify non-trading-day manual run controls for GitHub Actions (`TRADING_DAY_CHECK_ENABLED` + `force_run`) (#474)

## [3.4.7] - 2026-02-28

### Added
- 🧠 **CN/US Market Strategy Blueprint System** (#395) — market review prompt injects region-specific strategy blueprints with position sizing and risk trigger recommendations

### Fixed
- 🐛 **`TRADING_DAY_CHECK_ENABLED` env var and `--force-run` for GitHub Actions** (#466)
- 🐛 **Agent pipeline preserved resolved stock names** (#464) — placeholder names no longer leak into reports
- 🐛 **Code cleanup** (#462, Fixes #422)
- 🐛 **WebUI auto-build on startup** (#460)
- 🐛 **ARCH_ARGS unbound variable** (#458)
- 🐛 **Time zone inconsistency & right panel flash** (#439)

### Docs
- 📝 Clarify potential ambiguities in code (#343)
- 📝 ENABLE_EASTMONEY_PATCH guidance for Issue #453 (#456)

## [3.4.0] - 2026-02-27

### Added
- 📡 **LiteLLM Direct Integration + Multi API Key Support** (#454, Fixes #421 #428)
  - Removed native SDKs (google-generativeai, google-genai, anthropic); unified through `litellm>=1.80.10`
  - New config: `LITELLM_MODEL`, `LITELLM_FALLBACK_MODELS`, `GEMINI_API_KEYS`, `ANTHROPIC_API_KEYS`, `OPENAI_API_KEYS`
  - Multi-key auto-builds LiteLLM Router (simple-shuffle) with 429 cooldown
  - **Breaking**: `.env` `GEMINI_MODEL` (no prefix) only for fallback; explicit config must include provider prefix

### Changed
- ♻️ **Notification Refactoring** (#435) — extracted 10 sender classes into `src/notification_sender/`

### Fixed
- 🐛 LLM NoneType crash, history API 422, sniper points extraction
- 🐛 Auto-build frontend on WebUI startup — `WEBUI_AUTO_BUILD` env var (default `true`)
- 🐛 Docker explicit project name (#448)
- 🐛 Bocha search SSL retry (#445, #446) — transient errors retry up to 3 times
- 🐛 Gemini google-genai SDK migration (Fixes #440, #444)
- 🐛 Mobile home page scrolling (Fixes #419, #433)
- 🐛 History list scroll reset (#431)
- 🐛 Settings save button false positive (fixes #417, #430)

## [3.3.22] - 2026-02-26

### Added
- 💬 **Chat History Persistence** (Fixes #400, #414) — `/chat` page survives refresh, sidebar session list
- 🎨 Project VI Assets — logo icon set, PSD, vector, banner (#425)
- 🚀 Desktop CI Auto-Release (#426) — Windows + macOS parallel builds

### Fixed
- 🐛 Agent Reasoning 400 & LiteLLM Proxy (fixes #409, #427)
- 🐛 Discord chunked sending (#413) — `DISCORD_MAX_WORDS` config
- 🐛 yfinance shared DataFrame (#412)
- 🐛 sniper_points parsing (#408)
- 🐛 Agent framework category missing (#406)
- 🐛 Date inconsistency & query id (fixes #322, #363)

## [3.3.12] - 2026-02-24

### Added
- 📈 **Intraday Realtime Technical Indicators** (Issue #234, #397) — MA calculated from realtime price, config: `ENABLE_REALTIME_TECHNICAL_INDICATORS`
- 🤖 **Agent Strategy Chat** (#367) — full ReAct pipeline, 11 YAML strategies, SSE streaming, multi-turn chat
- 📢 PushPlus Group Push — `PUSHPLUS_TOPIC` (#402)
- 📅 Trading Day Check (Issue #373, #375) — `TRADING_DAY_CHECK_ENABLED`, `--force-run`

### Fixed
- 🐛 DeepSeek reasoning mode (Issue #379, #386)
- 🐛 Agent news intel persistence (Fixes #396, #405)
- 🐛 Bare except clauses replaced with `except Exception` (#398)
- 🐛 UUID fallback for HTTP non-secure context (fixes #377, #381)
- 🐛 Docker DNS resolution (Fixes #372, #374)
- 🐛 Agent session/strategy bugs — multiple follow-up fixes for #367
- 🐛 yfinance parallel download data filtering

### Changed
- Market review strategy consistency — unified cn/us template
- Agent test assertions updated (`6 -> 11`)


## [3.2.11] - 2026-02-23

### Fixed (#patch)
- 🐛 **StockTrendAnalyzer Never Executed** (Issue #357)
  - Root cause: `get_analysis_context` only returned 2 days of data without `raw_data`; `raw_data in context` was always False in the pipeline
  - Fix: Step 3 directly calls `get_data_range` to fetch 90 calendar days (~60 trading days) of historical data for trend analysis
  - Improvement: Logs full traceback via `logger.warning(..., exc_info=True)` when trend analysis fails

## [3.2.10] - 2026-02-22

### Added
- ⚙️ Supported `RUN_IMMEDIATELY` configuration setting; when set to `true`, executes an immediate analysis run upon scheduler trigger without waiting for the first scheduled time slot

### Fixed
- 🐛 Fixed Web UI page centering issue
- 🐛 Fixed Settings returning 500 error

## [3.2.9] - 2026-02-22

### Fixed
- 🐛 **ETF Analysis Focused Solely on Index Trend** (Issue #274)
  - US/HK ETFs (e.g. VOO, QQQ) and A-share ETFs no longer include fund company-level risks (litigation, reputation, etc.)
  - Search dimensions: ETF/index-specific risk_check, earnings, and industry queries, preventing hits on fund manager corporate news
  - AI prompt: Index-type asset analysis constraints, disallowing fund manager operational risks in `risk_alerts`

## [3.2.8] - 2026-02-21

### Fixed
- 🐛 **Unified Stock Symbol Casing Across BOT and WEB UI** (Issue #355)
  - Stock symbols triggered via BOT `/analyze` and WEB UI unified to uppercase (e.g. `aapl` -> `AAPL`)
  - Added `canonical_stock_code()`, normalizing at BOT, API, Config, CLI, and task_queue entry points
  - History records and task deduplication logic correctly identify identical stocks regardless of case

## [3.2.7] - 2026-02-20

### Added
- 🔐 **Web Page Password Authentication** (Issue #320, #349)
  - Added `ADMIN_AUTH_ENABLED=true` support to enable Web login protection
  - Set initial password on first web visit; supports password changes via "System Settings > Change Password" and CLI reset via `python -m src.auth reset_password`

## [3.2.6] - 2026-02-20
### ⚠️ Breaking Changes

- **History API Changes (Issue #322)**
  - Route change: `GET /api/v1/history/{query_id}` -> `GET /api/v1/history/{record_id}`
  - Parameter change: `query_id` (string) -> `record_id` (integer)
  - News endpoint change: `GET /api/v1/history/{query_id}/news` -> `GET /api/v1/history/{record_id}/news`
  - Reason: `query_id` could collide during batch analysis and could not uniquely identify a single history record. Switched to database primary key `id` for guaranteed uniqueness
  - Impact scope: All clients using the legacy history details API must update accordingly

### Fixed
- Fixed conflicting technical indicators for US stocks (e.g. ADBE): AkShare US stock adjusted data was erratic; unified US historical data source to YFinance (Issue #311)
- 🐛 **History Record Query and Display Issues (Issue #322)**
  - Fixed date inconsistency in history record list queries: uses tomorrow as endDate to ensure full-day coverage for today
  - Fixed server UI report selection issue caused by multiple records sharing identical `query_id` resulting in always displaying the first entry. Now uses `analysis_history.id` as unique identifier
  - Fully adapted history details, news API, and frontend components to `record_id`
  - Added background polling (every 30s) and silent refresh of history list upon page visibility change, ensuring frontend stays in sync with CLI-initiated analysis; uses `silent` mode to avoid triggering loading spinners
- 🐛 **US Index Real-Time Quotes and Daily Bar Data** (Issue #273)
  - Fixed missing real-time quotes for US indices including SPX, DJI, IXIC, NDX, VIX, RUT
  - Added `us_index_mapping` module, mapping user input (e.g. SPX) to Yahoo Finance symbols (e.g. ^GSPC)
  - Routed US index and equity daily bars directly to YfinanceFetcher, avoiding unsupported providers
  - Eliminated duplicate US stock identification logic, unifying under `is_us_stock_code()` function

### Changed
- 🎨 **Home Input Bar and Market Sentiment Layout Alignment**
  - Aligned left edge of stock symbol input box with history record glass-card
  - Aligned right edge of Analyze button with Market Sentiment outer container
  - Stretched Market Sentiment card downwards to fill the grid, eliminating gap above STRATEGY POINTS
  - Full-width input bar on narrow viewports maintaining consistent responsive alignment

## [3.2.5] - 2026-02-19

### Added
- 🌍 **Configurable Market Review Regions** (Issue #299)
  - Supported `MARKET_REVIEW_REGION` environment variable: `cn` (A-shares), `us` (US equities), `both` (both)
  - `us` mode uses SPX/Nasdaq/Dow/VIX indices; `both` mode reviews both A-shares and US markets simultaneously
  - Defaults to `cn`, maintaining backward compatibility

## [3.2.4] - 2026-02-18

### Fixed
- 🐛 **Unified US Data Source to YFinance** (Issue #311)
  - AkShare US adjusted data was erratic; unified US historical data source to YFinance
  - Fixed conflicting technical indicators for US equities such as ADBE

## [3.2.3] - 2026-02-18

### Fixed
- 🐛 **S&P 500 Real-Time Data Missing** (Issue #273)
  - Fixed missing live quotes for US indices including SPX, DJI, IXIC, NDX, VIX, RUT
  - Added `us_index_mapping` module, mapping user input (e.g. SPX) to Yahoo Finance symbols (e.g. `^GSPC`)
  - Routed US index and equity daily bars directly to YfinanceFetcher, avoiding unsupported data providers

## [3.2.2] - 2026-02-16

### Added
- 📊 **PE Ratio Support** (Issue #296)
  - Added PE valuation analysis to AI system prompts
- 📰 **News Freshness Filtering** (Issue #296)
  - `NEWS_MAX_AGE_DAYS`: Maximum news age in days (default 3) to prevent using outdated information
- 📈 **Relaxed Bias Threshold for Strong Trend Stocks** (Issue #296)
  - `BIAS_THRESHOLD`: Configurable price bias threshold percentage (default 5.0%)
  - Automatically relaxes bias threshold to 1.5x for strong trend stocks (bullish moving average alignment and trend strength >= 70)

## [3.2.1] - 2026-02-16

### Added
- 🔧 **Configurable EastMoney Interface Patch**
  - Added `EFINANCE_PATCH_ENABLED` environment variable toggling EastMoney patch (default `true`)
  - Allows disabling patch gracefully when unavailable without interrupting primary pipeline

## [3.2.0] - 2026-02-15

### Added
- 🔒 **Unified CI Gates (P0)**
  - Added `scripts/ci_gate.sh` as single entry point for backend validation gates
  - Structured primary CI into three stages: `backend-gate`, `docker-build`, `web-gate`
  - Triggered CI on all PRs, preventing merge blocks from missing required checks due to path filtering
  - `web-gate` triggers on demand upon frontend path changes
  - Added non-blocking `network-smoke` workflow for network-dependent regression tests
- 📦 **Release Pipeline Convergence (P0)**
  - Configured `docker-publish` to trigger primarily on tags with pre-release gate validation
  - Manual release workflow adds `release_tag` input with strict semver and changelog validation
  - Added Docker smoke test verifying key module imports before publishing
- 📝 **PR Template Upgrade (P0)**
  - Added required sections for context, scope, verification commands/results, rollback plan, and issue references
- 🤖 **Enhanced AI Review Coverage (P0)**
  - Included `.github/workflows/**` in `pr-review` scope
  - Added `AI_REVIEW_STRICT` toggle, optionally upgrading AI review failures to blocking status

## [3.1.13] - 2026-02-15

### Added
- 📊 **Summary-Only Analysis Results** (Issue #262)
  - Added `REPORT_SUMMARY_ONLY` environment variable; when set to `true`, delivers summary overview only without single-stock details
  - Defaults to `false`, providing quick overview mode for multi-stock analysis

## [3.1.12] - 2026-02-15

### Added
- 📧 **Merged Notification for Single-Stock Analysis and Market Review** (Issue #190)
  - Supported `MERGE_EMAIL_NOTIFICATION` environment variable; when set to `true`, merges single-stock analysis and market review into a single notification
  - Defaults to `false`, reducing email volume and lowering the risk of spam detection

## [3.1.11] - 2026-02-15

### Added
- 🤖 **Anthropic Claude API Support** (Issue #257)
  - Added support for `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_TEMPERATURE`, `ANTHROPIC_MAX_TOKENS`
  - AI analysis priority: Gemini > Anthropic > OpenAI
- 📷 **Stock Symbol Extraction from Images** (Issue #257)
  - Upload watchlist screenshots to automatically extract stock symbols via Vision LLMs
  - API: `POST /api/v1/stocks/extract-from-image`; supports JPEG/PNG/WebP/GIF up to 5MB
  - Added `OPENAI_VISION_MODEL` configuration for image recognition models
- ⚙️ **Manual TongDaXin Data Source Configuration** (Issue #257)
  - Added support for `PYTDX_HOST`, `PYTDX_PORT`, or `PYTDX_SERVERS` to configure custom TongDaXin servers

## [3.1.10] - 2026-02-15

### Added
- ⚙️ **Immediate Execution Configuration** (Issue #332)
  - Added `RUN_IMMEDIATELY` environment variable; when `true`, executes immediately upon scheduled job start
- 🐛 Fixed Docker build issue

## [3.1.9] - 2026-02-14

### Added
- 🔌 **EastMoney Interface Patch Mechanism**
  - Added `patch/eastmoney_patch.py` fixing efinance upstream interface changes
  - Preserves normal operation of other data sources

## [3.1.8] - 2026-02-14

### Added
- 🔐 **Webhook Certificate Verification Toggle** (Issue #265)
  - Added `WEBHOOK_VERIFY_SSL` environment variable, allowing disabling HTTPS certificate verification for self-signed certificates
  - Verification enabled by default; disabling carries MITM risks and is recommended only for trusted internal networks

## [3.1.7] - 2026-02-14

### Fixed
- 🐛 Fixed package import error

## [3.1.6] - 2026-02-13

### Fixed
- 🐛 Fixed `query_id` inconsistency in `news_intel`

## [3.1.5] - 2026-02-13

### Added
- 📷 **Markdown-to-Image Notifications** (Issue #289)
  - Added `MARKDOWN_TO_IMAGE_CHANNELS` configuration, delivering image-format reports to Telegram, WeChat Work, custom Webhook (Discord), and Email
  - Inlines image attachments in emails, enhancing compatibility with email clients lacking rich HTML support
  - Requires `wkhtmltopdf` and `imgkit`

## [3.1.4] - 2026-02-12

### Added
- 📧 **Stock Grouping with Destination-Specific Emails** (Issue #268)
  - Added `STOCK_GROUP_N` + `EMAIL_GROUP_N` configuration, routing different stock group reports to designated email inboxes
  - Market review reports are sent to all configured email addresses

## [3.1.3] - 2026-02-12

### Fixed
- 🐛 Fixed `[Errno 16] Device or resource busy` error when modifying configuration via Web UI in Docker

## [3.1.2] - 2026-02-11

### Fixed
- 🐛 Fixed Docker consistency issues, resolving critical batch processing and notification bugs

## [3.1.1] - 2026-02-11

### Changed
- ♻️ `API_HOST` -> `WEBUI_HOST`: Unified Docker Compose configuration settings

## [3.1.0] - 2026-02-11

### Added
- 📊 **ETF Support Enhancement and Symbol Normalization**
  - Unified ETF symbol handling logic across data sources
  - Added `canonical_stock_code()` to unify symbol formats and ensure accurate provider routing

## [3.0.5] - 2026-02-08

### Fixed
- 🐛 Fixed mismatch between signal emoji and recommendations (compound recommendations like "Sell/Wait" were improperly mapped)
- 🐛 Fixed markdown escaping issue for `*ST` stock names in WeChat and Dashboard
- 🐛 Fixed TypeError in market review when `idx.amount` is None
- 🐛 Fixed analysis API returning `report=None` and ReportStrategy type inconsistency
- 🐛 Fixed Tushare return type error (dict -> UnifiedRealtimeQuote) and API endpoint routing

### Added
- 📊 Injected structured data into market review reports (gain/loss statistics, index tables, sector rankings)
- 🔍 Search results TTL cache (500 items max, FIFO eviction)
- 🔧 Automatically injects real-time quote priority when Tushare Token is present
- 📰 News summary truncation length expanded from 50 to 200 characters

### Changed
- ⚡ Capped supplementary quote field requests to maximum 1 attempt, reducing redundant network requests

## [3.0.4] - 2026-02-07

### Added
- 📈 **Backtesting Engine** (PR #269)
  - Added backtesting engine based on historical analysis records, evaluating returns, win rate, and maximum drawdown metrics
  - Integrated backtesting results display in Web UI

## [3.0.3] - 2026-02-07

### Fixed
- 🐛 Fixed sniper point data parsing error (PR #271)

## [3.0.2] - 2026-02-06

### Added
- ✉️ Configurable email sender name (PR #272)
- 🌐 English keyword search support for international stocks

## [3.0.1] - 2026-02-06

### Fixed
- 🐛 Fixed ETF real-time quote fetching, market data fallback, and WeChat Work message chunking issues
- 🔧 Simplified CI workflows

## [3.0.0] - 2026-02-06

### Removed
- 🗑️ **Legacy WebUI Removed**
  - Removed legacy Web UI based on `http.server.ThreadingHTTPServer` (`web/` package)
  - All legacy Web UI features are completely superseded by FastAPI (`api/`) + React frontend
  - CLI options `--webui` / `--webui-only` marked as deprecated, automatically redirecting to `--serve` / `--serve-only`
  - Environment variables `WEBUI_ENABLED` / `WEBUI_HOST` / `WEBUI_PORT` maintained for compatibility, forwarded to FastAPI service
  - Retained `webui.py` as compatibility wrapper, delegating directly to FastAPI backend on launch
  - Removed `webui` service definition from Docker Compose, standardizing on `server` service

### Changed
- ♻️ **Service Layer Refactoring**
  - Migrated async task service from `web/services.py` to `src/services/task_service.py`
  - Bot analyze command (`bot/commands/analyze.py`) updated to use `src.services.task_service`
  - Renamed Docker environment variables `WEBUI_HOST`/`WEBUI_PORT` to `API_HOST`/`API_PORT` (legacy names remain backward-compatible)

## [2.3.0] - 2026-02-01

### Added
- 🇺🇸 **Enhanced US Stock Support** (Issue #153)
  - Implemented AkShare-based US stock historical daily data retrieval (`ak.stock_us_daily()`)
  - Implemented YFinance-based US stock real-time quotes (priority strategy)
  - Added US stock symbol filtering and fast fallback for unsupported data sources (Tushare/Baostock/Pytdx/Efinance)

### Fixed
- 🐛 Fixed issue where US symbols like AMD were misidentified as A-shares (Issue #153)

## [2.2.5] - 2026-02-01

### Added
- 🤖 **AstrBot Push Notifications** (PR #217)
  - Added AstrBot notification channel supporting push to QQ and WeChat
  - Supported HMAC SHA256 signature verification for secure communication
  - Configured via `ASTRBOT_URL` and `ASTRBOT_TOKEN`

## [2.2.4] - 2026-02-01

### Added
- ⚙️ **Configurable Data Source Priority** (PR #215)
  - Supported dynamic data source priority adjustment via environment variables (e.g. `YFINANCE_PRIORITY=0`)
  - Prioritizes specific data sources (such as Yahoo Finance) without modifying code

## [2.2.3] - 2026-01-31

### Fixed
- 📦 Updated requirements.txt with `lxml_html_clean` dependency resolving compatibility issues

## [2.2.2] - 2026-01-31

### Fixed
- 🐛 Fixed case-sensitivity issue in proxy configuration (fixes #211)

## [2.2.1] - 2026-01-31

### Fixed
- 🐛 **YFinance Compatibility Fix** (PR #210, fixes #209)
  - Fixed data parsing error caused by MultiIndex column names returned by newer yfinance versions

## [2.2.0] - 2026-01-31

### Added
- 🔄 **Enhanced Multi-Source Fallback Strategy**
  - Implemented more robust data retrieval fallback mechanisms (feat: multi-source fallback strategy)
  - Optimized automatic failover switching logic when data providers fail

### Fixed
- 🐛 Fixed issue where modifying stock_list in .env after analyzer startup failed to update tracked stocks

## [2.1.14] - 2026-01-31

### Documentation
- 📝 Updated README and optimized auto-tag rules

## [2.1.13] - 2026-01-31

### Fixed
- 🐛 **Tushare Priority and Real-Time Quotes** (Fixed #185)
  - Fixed Tushare data source priority configuration issue
  - Fixed Tushare real-time quote retrieval function

## [2.1.12] - 2026-01-30

### Fixed
- 🌐 Fixed case-sensitivity issue in proxy configuration under certain conditions
- 🌐 Fixed logic for disabling proxies in local environments

## [2.1.11] - 2026-01-30

### Changed
- 🚀 **Feishu Message Stream Optimization** (PR #192)
  - Optimized message type handling for Feishu Stream mode
  - Changed default Stream message mode to disabled, preventing runtime errors on misconfiguration

## [2.1.10] - 2026-01-30

### Merged
- 📦 Merged contributions from PR #154

## [2.1.9] - 2026-01-30

### Added
- 💬 **WeChat Plain Text Message Support** (PR #137)
  - Added plain text message type support for WeChat Work notifications
  - Added `WECHAT_MSG_TYPE` configuration setting

## [2.1.8] - 2026-01-30

### Fixed
- 🐛 Fixed incorrect API provider display in logs (PR #197)

## [2.1.7] - 2026-01-30

### Fixed
- 🌐 Disabled proxy settings in local environment to prevent network connection issues

## [2.1.6] - 2026-01-29

### Added
- 📡 **Pytdx Data Source (Priority 2)**
  - Added TongDaXin data source, free without registration required
  - Automatic multi-server failover
  - Supports real-time quotes and historical data
- 🏷️ **Multi-Source Stock Name Resolution**
  - Added `get_stock_name()` method to DataFetcherManager
  - Added `batch_get_stock_names()` batch query method
  - Automatic fallback across multiple data sources
  - Added stock name and list methods to Tushare and Baostock
- 🔍 **Enhanced Search Fallback**
  - Added `search_stock_price_fallback()` when all primary data sources fail
  - Added search dimensions: market analysis, industry analysis
  - Increased maximum search attempts from 3 to 5
  - Improved search result format (4 results per dimension)

### Changed
- Updated search query templates to improve relevance
- Enhanced `format_intel_report()` output structure

## [2.1.5] - 2026-01-29

### Added
- 📡 Added Pytdx data source and multi-source stock name resolution

## [2.1.4] - 2026-01-29

### Documentation
- 📝 Updated sponsor information

## [2.1.3] - 2026-01-28

### Documentation
- 📝 Refactored README layout
- 🌐 Added Traditional Chinese translation (README_CHT.md)

### Fixed
- 🐛 Fixed issue preventing US stock symbol input in WebUI
  - Updated input logic to automatically convert all characters to uppercase
  - Supported input of `.` (e.g. `BRK.B`)

## [2.1.2] - 2026-01-27

### Fixed
- 🐛 Fixed single-stock analysis notification failure and report path issue (fixes #166)
- 🐛 Fixed CR error, ensuring maximum byte limit configuration for WeChat messages takes effect

## [2.1.1] - 2026-01-26

### Added
- 🔧 Added GitHub Actions auto-tag workflow
- 📡 Added YFinance fallback data source and missing data warning

### Fixed
- 🐳 Fixed docker-compose paths and documentation commands
- 🐳 Updated Dockerfile to copy `src/` directory (fixes #145)

## [2.1.0] - 2026-01-25

### Added
- 🇺🇸 **US Stock Analysis Support**
  - Supported direct input of US stock symbols (e.g. `AAPL`, `TSLA`)
  - Utilized YFinance as data source for US equities
- 📈 **MACD and RSI Technical Indicators**
  - MACD: Trend confirmation and golden/death cross signals (golden cross above zero axis ⭐, golden cross ✅, death cross ❌)
  - RSI: Overbought/oversold assessment (oversold ⭐, strong ✅, overbought ⚠️)
  - Integrated indicator signals into comprehensive scoring system
- 🎮 **Discord Notification Support** (PR #124, #125, #144)
  - Supported both Discord Webhook and Bot API methods
  - Configured via `DISCORD_WEBHOOK_URL` or `DISCORD_BOT_TOKEN` + `DISCORD_MAIN_CHANNEL_ID`
- 🤖 **Bot Command Interaction**
  - DingTalk bot supports `/analyze <symbol>` command to trigger analysis
  - Supported Stream persistent connection mode
- 🌡️ **Configurable AI Temperature Parameter** (PR #142)
  - Supported custom AI model temperature configuration
- 🐳 **Zeabur Deployment Support**
  - Added Zeabur container deployment workflow
  - Supported dual tagging with commit hash and latest

### Changed
- 🏗️ **Project Structure Optimization**
  - Moved core code into `src/` directory for cleaner root layout
  - Moved documentation into `docs/` directory
  - Moved Docker configuration into `docker/` directory
  - Fixed all import paths while maintaining backward compatibility
- 🔄 **Data Source Architecture Upgrade**
  - Added circuit breaker mechanism for data sources with automatic failover on consecutive failures
  - Optimized real-time quote caching with batch prefetching to reduce API calls
  - Intelligent proxy routing with direct connection for mainland China endpoints
- 🤖 Refactored Discord bot into platform adapter architecture

### Fixed
- 🌐 **Network Stability Enhancements**
  - Automatically detects proxy configuration and enforces direct connections for domestic market endpoints
  - Fixed intermittent `ProtocolError` in EfinanceFetcher
  - Added low-level network error handling and retry mechanisms
- 📧 **Email Rendering Optimization**
  - Fixed issue where tables failed to render in emails (#134)
  - Optimized email formatting for a more compact and elegant layout
- 📢 **WeChat Work Notification Fixes**
  - Fixed incomplete market review push notifications
  - Enhanced message chunking logic supporting additional heading formats
  - Added throttling interval between batch deliveries to prevent rate-limiting drops
- 👷 **CI/CD Fixes**
  - Fixed path reference errors in GitHub Actions

## [2.0.0] - 2026-01-24

### Added
- 🇺🇸 **US Stock Analysis Support**
  - Supported direct input of US stock symbols (e.g. `AAPL`, `TSLA`)
  - Utilized YFinance as data source for US equities
- 🤖 **Bot Command Interaction** (PR #113)
  - DingTalk bot supports `/analyze <symbol>` command to trigger analysis
  - Supported Stream persistent connection mode
  - Supported selection of condensed or full reports
- 🎮 **Discord Notification Support** (PR #124)
  - Supported Discord Webhook notifications
  - Added Discord environment variables to workflows

### Fixed
- 🐳 Fixed WebUI binding to 0.0.0.0 in Docker (fixed #118)
- 🔔 Fixed Feishu persistent connection notification issue
- 🐛 Fixed undefined `analysis_delay` error
- 🔧 Enhanced notification channel check in config.py at startup, fixing false unconfigured warnings when custom channels are active

### Changed
- 🔧 Optimized Tushare priority evaluation logic, improving encapsulation
- 🔧 Fixed issue where elevated Tushare priority remained ranked below Efinance
- ⚙️ Automatically elevated Tushare data source priority when `TUSHARE_TOKEN` is configured
- ⚙️ Resolved 4 user feedback issues (#112, #128, #38, #119)

## [1.6.0] - 2026-01-19

### Added
- 🖥️ WebUI Management Interface and API Support (PR #72)
  - Brand new Web architecture: layered design (Server/Router/Handler/Service)
  - Core APIs: `/analysis` (trigger analysis), `/tasks` (query progress), `/health` (health check)
  - Interactive UI: enter stock symbols directly to trigger analysis with real-time progress display
  - Run mode: added `--webui-only` mode to launch Web service only
  - Solved core requirement of [#70](https://github.com/ZhuLinsen/daily_stock_analysis/issues/70) (providing API endpoints to trigger analysis)
- ⚙️ Enhanced GitHub Actions Configuration Flexibility ([#79](https://github.com/ZhuLinsen/daily_stock_analysis/issues/79))
  - Supported reading non-sensitive configurations from Repository Variables (e.g. STOCK_LIST, GEMINI_MODEL)
  - Maintained backward compatibility with Secrets

### Fixed
- 🐛 Fixed WeChat Work / Feishu report truncation issue ([#73](https://github.com/ZhuLinsen/daily_stock_analysis/issues/73))
  - Removed unnecessary hardcoded truncation logic in notification.py
  - Relied on underlying automatic chunking mechanism to handle long messages
- 🐛 Fixed missing environment variables in GitHub Workflow ([#80](https://github.com/ZhuLinsen/daily_stock_analysis/issues/80))
  - Fixed issue where `CUSTOM_WEBHOOK_BEARER_TOKEN` was not properly passed to Runner

## [1.5.0] - 2026-01-17

### Added
- 📲 Single-Stock Notification Mode ([#55](https://github.com/ZhuLinsen/daily_stock_analysis/issues/55))
  - Pushes notification immediately upon completing each stock analysis without waiting for batch completion
  - CLI flag: `--single-notify`
  - Environment variable: `SINGLE_STOCK_NOTIFY=true`
- 🔐 Custom Webhook Bearer Token Authentication ([#51](https://github.com/ZhuLinsen/daily_stock_analysis/issues/51))
  - Supported Webhook endpoints requiring Token authentication
  - Environment variable: `CUSTOM_WEBHOOK_BEARER_TOKEN`

## [1.4.0] - 2026-01-17

### Added
- 📱 Pushover Notification Support (PR #26)
  - Supported cross-platform notifications on iOS/Android
  - Configured via `PUSHOVER_USER_KEY` and `PUSHOVER_API_TOKEN`
- 🔍 Bocha Search API Integration (PR #27)
  - Chinese search optimization with AI summary support
  - Configured via `BOCHA_API_KEYS`
- 📊 Efinance Data Source Support (PR #59)
  - Added efinance as data source option
- 🇭🇰 Hong Kong Stocks Support (PR #17)
  - Supported 5-digit symbols or HK prefix (e.g. `hk00700`, `hk1810`)

### Fixed
- 🔧 Feishu Markdown Rendering Optimization (PR #34)
  - Fixed rendering issues using interactive cards and formatters
- ♻️ Stock List Hot-Reloading (PR #42 fix)
  - Automatically reloads `STOCK_LIST` configuration before analysis
- 🐛 DingTalk Webhook 20KB Limit Handling
  - Automatically chunks long messages to prevent truncation
- 🔄 AkShare API Retry Mechanism Enhancement
  - Added failure caching to prevent repeated requests to failing endpoints

### Changed
- 📝 Streamlined and optimized README
  - Moved advanced configuration to `docs/full-guide.md`


## [1.3.0] - 2026-01-12

### Added
- 🔗 Custom Webhook Support
  - Supported arbitrary POST JSON Webhook endpoints
  - Automatically recognized DingTalk, Discord, Slack, Bark, and common service formats
  - Supported multiple Webhook configurations (comma-separated)
  - Configured via `CUSTOM_WEBHOOK_URLS` environment variable

### Fixed
- 📝 WeChat Work Long Message Batch Chunking
  - Resolved push failures when watchlist content exceeded 4096 character limit
  - Intelligently chunks by stock analysis section, appending page markers to each batch (e.g. 1/3, 2/3)
  - 1-second interval between batches to avoid triggering rate limits

## [1.2.0] - 2026-01-11

### Added
- 📢 Multi-Channel Notification Support
  - WeChat Work Webhook
  - Feishu Webhook (new)
  - Email SMTP (new)
  - Automatic channel type detection for simplified configuration

### Changed
- Standardized on `NOTIFICATION_URL` configuration, backward-compatible with legacy `WECHAT_WEBHOOK_URL`
- Supported Markdown-to-HTML rendering for emails

## [1.1.0] - 2026-01-11

### Added
- 🤖 OpenAI-Compatible API Support
  - Supported DeepSeek, Qwen, Moonshot, Zhipu GLM, etc.
  - Choice between Gemini and OpenAI formats
  - Automatic fallback retry mechanism

## [1.0.0] - 2026-01-10

### Added
- 🎯 AI Decision Dashboard Analysis
  - One-sentence core conclusion
  - Precise buy / stop-loss / target price levels
  - Checklist (✅⚠️❌)
  - Differentiated position advice (unhedged/flat vs existing holders)
- 📊 Market Review Feature
  - Major index quotes
  - Gain/loss market breadth statistics
  - Sector leaderboard
  - AI-generated market review report
- 🔍 Multi-Source Data Support
  - AkShare (primary source, free)
  - Tushare Pro
  - Baostock
  - YFinance
- 📰 News Search Services
  - Tavily API
  - SerpAPI
- 💬 WeChat Work Bot Push Notifications
- ⏰ Scheduled Cron Jobs
- 🐳 Docker Deployment Support
- 🚀 Zero-Cost Deployment on GitHub Actions

### Technical Characteristics
- Gemini AI model (gemini-3-flash-preview)
- Automatic retry on 429 rate limits + model switching
- Inter-request delay to prevent blocking
- Multi-API-Key load balancing
- SQLite local data storage

---

[Unreleased]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.31.0...HEAD
[3.31.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.30.0...v3.31.0
[3.30.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.29.0...v3.30.0
[3.29.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.28.0...v3.29.0
[3.28.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.27.0...v3.28.0
[3.27.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.26.1...v3.27.0
[3.26.1]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.25.0...v3.26.1
[3.25.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.24.1...v3.25.0
[3.24.1]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.24.0...v3.24.1
[3.24.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.23.0...v3.24.0
[3.23.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.22.0...v3.23.0
[3.22.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.21.1...v3.22.0
[3.21.1]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.21.0...v3.21.1
[3.21.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.20.0...v3.21.0
[3.20.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.19.0...v3.20.0
[3.19.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.18.0...v3.19.0
[3.18.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.17.1...v3.18.0
[3.17.1]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.17.0...v3.17.1
[3.17.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.16.0...v3.17.0
[3.16.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.15.0...v3.16.0
[3.15.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.14.2...v3.15.0
[3.14.2]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.14.1...v3.14.2
[3.14.1]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.14.0...v3.14.1
[3.14.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.13.0...v3.14.0
[3.13.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.12.0...v3.13.0
[3.12.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.11.0...v3.12.0
[3.11.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.10.1...v3.11.0
[3.10.1]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.10.0...v3.10.1
[3.10.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.9.0...v3.10.0
[3.9.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.8.0...v3.9.0
[3.8.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.7.0...v3.8.0
[3.7.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.6.0...v3.7.0
[3.6.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.5.0...v3.6.0
[3.5.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.4.10...v3.5.0
[3.4.10]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.4.9...v3.4.10
[3.4.9]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.4.8...v3.4.9
[3.4.8]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.4.7...v3.4.8
[3.4.7]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.4.0...v3.4.7
[3.4.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.3.22...v3.4.0
[3.3.22]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.3.12...v3.3.22
[3.3.12]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.2.11...v3.3.12
[3.2.11]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v3.2.10...v3.2.11
[2.3.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.2.5...v2.3.0
[2.2.5]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.2.4...v2.2.5
[2.2.4]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.2.3...v2.2.4
[2.2.3]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.2.2...v2.2.3
[2.2.2]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.14...v2.2.0
[2.1.14]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.13...v2.1.14
[2.1.13]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.12...v2.1.13
[2.1.12]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.11...v2.1.12
[2.1.11]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.10...v2.1.11
[2.1.10]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.9...v2.1.10
[2.1.9]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.8...v2.1.9
[2.1.8]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.7...v2.1.8
[2.1.7]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.6...v2.1.7
[2.1.6]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.5...v2.1.6
[2.1.5]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.4...v2.1.5
[2.1.4]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.3...v2.1.4
[2.1.3]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v1.6.0...v2.0.0
[1.6.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ZhuLinsen/daily_stock_analysis/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ZhuLinsen/daily_stock_analysis/releases/tag/v1.0.0
