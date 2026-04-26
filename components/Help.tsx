import React, { useState, useEffect, useRef } from 'react';

const Help: React.FC = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [showToc, setShowToc] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 监听滚动，显示返回顶部按钮和高亮当前章节
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowBackToTop(container.scrollTop > 400);

      // 检测当前可见的章节
      const sections = ['core-feature', 'modules', 'webhook', 'tech', 'faq'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top;
          if (relativeTop <= 150 && rect.bottom > containerRect.top + 150) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    const container = scrollContainerRef.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollTop = container.scrollTop + elRect.top - containerRect.top - 20;
      container.scrollTo({ top: scrollTop, behavior: 'smooth' });
      setShowToc(false);
    }
  };

  const tocItems = [
    { id: 'core-feature', label: '核心功能', icon: '⚡' },
    { id: 'modules', label: '功能模块', icon: '📖' },
    { id: 'webhook', label: 'Webhook 配置', icon: '📱' },
    { id: 'tech', label: '技术特性', icon: '🛡️' },
    { id: 'faq', label: '常见问题', icon: '❓' },
  ];

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {/* 移动端目录按钮 */}
        <button
          onClick={() => setShowToc(!showToc)}
          className="md:hidden fixed bottom-20 right-4 z-40 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 移动端目录抽屉 */}
        {showToc && (
          <div className="md:hidden fixed inset-0 z-30" onClick={() => setShowToc(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="absolute right-0 top-0 bottom-0 w-64 bg-white p-4 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg mb-4 text-gray-800">目录</h3>
              <nav className="space-y-2">
                {tocItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* 桌面端侧边目录 */}
        <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 w-48">
          <nav className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-sm text-gray-500 mb-3">快速导航</h3>
            <ul className="space-y-1">
              {tocItems.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-all ${
                      activeSection === item.id
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* 头部 */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 rounded-full text-sm text-blue-600">
            <span>📚</span>
            <span>使用指南</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            EasyBill AI
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            让 AI 帮你自动记账，告别手动输入的烦恼
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              在线
            </span>
            <span>•</span>
            <span>更新于 2026.04</span>
          </div>
        </div>

        {/* 核心亮点 */}
        <section id="core-feature" className="scroll-mt-20 mb-10">
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 md:p-8 border border-blue-200/50 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                ⚡
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Webhook 自动记账 + 手动录入 + AI 智能解析</h2>
                <p className="text-sm text-gray-500">核心功能</p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              通过 <span className="font-semibold text-blue-600">Webhook</span> 自动捕获银行短信，
              或使用 <span className="font-semibold text-green-600">手动录入</span> 记录消费，
              利用 <span className="font-semibold text-purple-600">DeepSeek AI</span> 智能解析：
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {[
                { icon: '💱', label: '交易类型', desc: '收入/支出' },
                { icon: '💰', label: '交易金额', desc: '精确到分' },
                { icon: '🏪', label: '商户名称', desc: '美团、淘宝等' },
                { icon: '📅', label: '交易日期', desc: '自动补全年份' },
                { icon: '🏷️', label: '智能分类', desc: '15 大类' },
                { icon: '📊', label: '置信度', desc: '高/中/低' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="font-medium text-sm text-gray-800">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span>💡</span>
                <span>示例</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                收到短信「您尾号1234的卡02月28日在美团消费128.50元」
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium">支出</span>
                <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-medium">¥128.50</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-medium">美团</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs font-medium">餐饮美食</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">2026-02-28</span>
              </div>
            </div>
          </div>
        </section>

        {/* 功能模块 */}
        <section id="modules" className="scroll-mt-20 mb-10">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 mb-6 text-gray-800">
            <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm">📖</span>
            功能模块介绍
          </h2>

          <div className="grid gap-4">
            {/* AI 审核 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-lg shrink-0">
                  🧠
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">AI 审核中心</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    AI 解析后的短信进入「待审核」状态，支持查看、编辑、确认和批量操作
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['查看原始短信', '编辑修正', '一键确认', '批量操作', '置信度显示'].map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                    💡 可配置「自动确认阈值」，高置信度记录自动入账
                  </div>
                </div>
              </div>
            </div>

            {/* 账单管理 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-lg shrink-0">
                  📊
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">账单管理</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    查看和管理所有已确认的账单记录，支持多维度筛选和导出
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['多维度筛选', '关键词搜索', '手动记账', '编辑删除', 'CSV 导出'].map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 数据看板 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-lg shrink-0">
                  📈
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">数据看板</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    可视化展示财务状况，收支趋势一目了然
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['收支概览', '趋势图表', '分类占比', '快捷操作'].map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI 分析 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white text-lg shrink-0">
                  🤖
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">AI 智能分析</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    AI 深度分析消费习惯，提供个性化建议
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['消费洞察', '趋势预测', '省钱建议', 'AI 推荐'].map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 如何配置 Webhook */}
        <section id="webhook" className="scroll-mt-20 mb-10">
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 md:p-8 border border-green-200/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                📱
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">配置短信自动捕获</h2>
                <p className="text-sm text-gray-500">3 步完成设置</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </div>
                  <div className="w-0.5 h-full bg-green-200 mt-2" />
                </div>
                <div className="pb-6">
                  <h4 className="font-semibold mb-1 text-gray-800">获取专属密钥</h4>
                  <p className="text-sm text-gray-600">
                    进入「设置」→「Webhook 配置」，复制你的 <span className="font-mono bg-white px-1 rounded border">Webhook Key</span> 和 <span className="font-mono bg-white px-1 rounded border">User ID</span>
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </div>
                  <div className="w-0.5 h-full bg-green-200 mt-2" />
                </div>
                <div className="pb-6">
                  <h4 className="font-semibold mb-1 text-gray-800">配置短信转发</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    使用 Tasker (Android) 或 Shortcuts (iOS) 配置规则：
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-green-500">→</span>
                      <span><strong>触发</strong>：收到包含「消费」「支付」等关键词的短信</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-green-500">→</span>
                      <span><strong>动作</strong>：发送 POST 请求到 Webhook 地址</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-gray-800">测试验证</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    发送测试请求验证配置：
                  </p>
                  <div className="p-3 bg-white rounded-lg font-mono text-xs overflow-x-auto border border-gray-200">
                    <div className="text-gray-400 mb-1"># Request</div>
                    <div className="text-green-600">POST /api/ai-items/webhook</div>
                    <div className="mt-2 text-gray-400 mb-1"># Body</div>
                    <pre className="text-gray-700">{`{
  "userId": "your-user-id",
  "webhookKey": "your-key",
  "rawText": "您尾号1234的卡在美团消费128.50元"
}`}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white/70 rounded-lg border border-yellow-200 text-sm">
              <span className="text-yellow-600 font-medium">⚠️ 安全提示</span>
              <span className="text-gray-600">：Webhook Key 是专属密钥，请妥善保管。如怀疑泄露，可在设置中重新生成。</span>
            </div>
          </div>
        </section>

        {/* 技术特性 */}
        <section id="tech" className="scroll-mt-20 mb-10">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 mb-6 text-gray-800">
            <span className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center text-white text-sm">🛡️</span>
            技术特性
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="group bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-xl">🤖</span>
              </div>
              <h4 className="font-semibold mb-1 text-blue-600">AI 驱动</h4>
              <p className="text-sm text-gray-600">
                DeepSeek 大语言模型，准确率 95%+
              </p>
            </div>

            <div className="group bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-green-300 transition-colors">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-xl">🔒</span>
              </div>
              <h4 className="font-semibold mb-1 text-green-600">数据安全</h4>
              <p className="text-sm text-gray-600">
                加密存储，专属密钥认证
              </p>
            </div>

            <div className="group bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-purple-300 transition-colors">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-xl">⚡</span>
              </div>
              <h4 className="font-semibold mb-1 text-purple-600">多端登录</h4>
              <p className="text-sm text-gray-600">
                支持邮箱、Google、微信登录
              </p>
            </div>

            <div className="group bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-orange-300 transition-colors">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-xl">📊</span>
              </div>
              <h4 className="font-semibold mb-1 text-orange-600">智能分析</h4>
              <p className="text-sm text-gray-600">
                AI 洞察，个性化建议
              </p>
            </div>
          </div>
        </section>

        {/* 常见问题 */}
        <section id="faq" className="scroll-mt-20 mb-10">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 mb-6 text-gray-800">
            <span className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white text-sm">❓</span>
            常见问题
          </h2>

          <div className="space-y-3">
            {[
              {
                q: 'AI 解析准确率如何？',
                a: '标准格式银行短信准确率达 95%+。系统会标注置信度，低置信度建议人工复核。可在设置中配置自动确认阈值。',
              },
              {
                q: '支持哪些银行的短信？',
                a: '理论上支持所有银行，包括工行、建行、招行、支付宝、微信支付等。AI 自动适配不同格式。',
              },
              {
                q: 'Webhook 配置复杂吗？',
                a: '需一定技术基础。iOS 用 Shortcuts，Android 推荐 Tasker 或 MacroDroid。配置一次长期可用。',
              },
              {
                q: '数据会被泄露吗？',
                a: '不会。数据加密存储，仅你本人可访问。Webhook 采用专属密钥，可随时重新生成。',
              },
              {
                q: '可以手动记账吗？',
                a: '可以！在「账单管理」点击「手动记账」添加现金交易，与 AI 记账数据统一管理分析。支持分类、备注、日期等完整信息录入。',
              },
              {
                q: '支持导出数据吗？',
                a: '支持。在「账单管理」页面点击「导出报表」按钮，可将账单导出为 CSV 文件，方便在 Excel 等工具中进一步分析。',
              },
              {
                q: '支持哪些登录方式？',
                a: '目前支持邮箱注册登录、Google 账号登录和微信登录（小程序端），数据在不同登录方式间通用。',
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="font-medium pr-4 text-gray-800">{item.q}</span>
                  <svg
                    className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100">
                  <p className="pt-3">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* 底部 */}
        <div className="text-center pt-8 border-t border-gray-200">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600 mb-4">
            <span>💬</span>
            <span>如有其他问题，欢迎通过帮助中心查看更多内容</span>
          </div>
          <p className="text-gray-400 text-xs">
            EasyBill AI · 让记账变得简单而智能
          </p>
        </div>

        {/* 返回顶部按钮 */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-20"
            aria-label="返回顶部"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Help;
