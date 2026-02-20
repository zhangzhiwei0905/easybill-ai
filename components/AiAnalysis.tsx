import React from 'react';

const AiAnalysis: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-background-light">
      <div className="max-w-[1200px] mx-auto p-8 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-text-main">AI 消费深度分析</h1>
          <div className="flex gap-2 text-sm text-text-sub">
            <span>数据更新于：刚刚</span>
            <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-primary hover:animate-spin">refresh</span>
          </div>
        </div>

        {/* AI Insight Hero Card */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-primary shadow-sm flex items-start gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[180px]">psychology</span>
          </div>
          <div className="bg-primary/10 p-3 rounded-full shrink-0 text-primary">
            <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
          </div>
          <div className="flex flex-col gap-2 relative z-10">
            <h3 className="text-base font-bold text-text-main">AI 智能洞察</h3>
            <p className="text-text-main leading-relaxed max-w-4xl">
              <span className="font-bold">智为，</span>本月您的餐饮支出较上月同期增长了 <span className="text-red-500 font-bold">15%</span>，主要是周末外卖频率增加导致。建议下周适当减少外食次数。此外，您的交通费用下降了 8%，继续保持！
            </p>
            <div className="flex gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600">
                <span className="material-symbols-outlined text-[14px]">restaurant</span> 餐饮预警
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-xs font-medium text-green-700">
                <span className="material-symbols-outlined text-[14px]">trending_down</span> 交通优化
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Analysis Column */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            
            {/* Trend Chart (Visual Simulation) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-text-main">收支趋势分析</h3>
                <select className="bg-background-light border-none text-sm font-medium rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer outline-none">
                  <option>近 6 个月</option>
                  <option>近 1 年</option>
                </select>
              </div>
              <div className="h-64 w-full flex items-end justify-between gap-2 px-2 relative">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full border-t border-dashed border-slate-100 h-0"></div>
                  ))}
                </div>
                {/* Bars */}
                {['5月', '6月', '7月', '8月', '9月', '本月'].map((month, i) => {
                   const h1 = [60, 65, 55, 75, 70, 80][i];
                   const h2 = [45, 50, 70, 40, 60, 55][i];
                   return (
                     <div key={i} className="flex flex-col items-center gap-2 flex-1 z-10 group">
                       <div className="w-full flex justify-center items-end gap-1 h-full">
                         <div className="w-3 bg-emerald-400/80 rounded-t-sm transition-all group-hover:bg-emerald-500" style={{height: `${h1}%`}}></div>
                         <div className="w-3 bg-primary/80 rounded-t-sm transition-all group-hover:bg-primary" style={{height: `${h2}%`}}></div>
                       </div>
                       <span className={`text-xs font-medium ${month === '本月' ? 'text-text-main font-bold' : 'text-slate-400'}`}>{month}</span>
                     </div>
                   );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-emerald-400"></span>
                  <span className="text-xs text-slate-500">收入</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-primary"></span>
                  <span className="text-xs text-slate-500">支出</span>
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-text-main mb-6">支出分类 TOP 5</h3>
              <div className="flex flex-col gap-5">
                {[
                  { name: '餐饮美食', amount: '¥ 2,450', percent: '45%', color: 'bg-orange-400', icon: 'restaurant', iconBg: 'bg-orange-50 text-orange-500' },
                  { name: '网购日常', amount: '¥ 1,280', percent: '25%', color: 'bg-blue-400', icon: 'shopping_bag', iconBg: 'bg-blue-50 text-blue-500' },
                  { name: '休闲娱乐', amount: '¥ 850', percent: '15%', color: 'bg-purple-400', icon: 'movie', iconBg: 'bg-purple-50 text-purple-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`size-10 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-text-main">{item.name}</span>
                        <span className="text-sm font-bold text-text-main">{item.amount}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`${item.color} h-full rounded-full`} style={{ width: item.percent }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            
            {/* Prediction Card */}
            <div className="bg-[#101922] p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
              <div className="absolute -right-6 -top-6 size-32 bg-primary/30 rounded-full blur-2xl"></div>
              <div className="absolute -left-6 bottom-0 size-24 bg-purple-500/20 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">timeline</span>
                  <h3 className="text-base font-bold">月底支出预测</h3>
                </div>
                <div className="mb-6">
                  <div className="text-xs text-gray-400 mb-1">预计本月总支出</div>
                  <div className="text-3xl font-bold tracking-tight">¥ 5,820</div>
                  <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <span className="size-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    有超支风险 (预算 ¥ 5,500)
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>当前支出</span>
                    <span>¥ 4,280</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-purple-400 h-full rounded-full w-[73%]"></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 pt-1">
                    <span>预测剩余</span>
                    <span className="text-white font-medium">¥ 1,540</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Suggestions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex-1">
              <h3 className="text-lg font-bold text-text-main mb-4">省钱建议</h3>
              <div className="flex flex-col gap-4">
                <SuggestionCard 
                  icon="coffee" color="text-yellow-600" bg="bg-yellow-50" border="border-yellow-100" titleColor="text-yellow-800"
                  title="咖啡开销优化" desc="本月星巴克消费已达 ¥350。如果改用公司咖啡机或自制，下个月预计可节省 ¥200。"
                />
                <SuggestionCard 
                  icon="subscriptions" color="text-blue-600" bg="bg-blue-50" border="border-blue-100" titleColor="text-blue-800"
                  title="订阅检查" desc="检测到两笔视频会员扣费。建议检查是否有闲置订阅服务。"
                />
                <SuggestionCard 
                  icon="savings" color="text-purple-600" bg="bg-purple-50" border="border-purple-100" titleColor="text-purple-800"
                  title="定投建议" desc="基于您当前的结余 ¥8,219，建议将其中的 40% 转入稳健理财。"
                />
              </div>
              <button className="w-full mt-4 py-2 text-sm text-primary font-bold hover:bg-primary/5 rounded-lg transition-colors border border-dashed border-primary/30">
                生成更多建议
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const SuggestionCard = ({ icon, color, bg, border, titleColor, title, desc }: any) => (
  <div className={`p-3 ${bg} rounded-lg border ${border}`}>
    <div className="flex items-start gap-3">
      <span className={`material-symbols-outlined ${color} mt-0.5`}>{icon}</span>
      <div>
        <h4 className={`text-sm font-bold ${titleColor}`}>{title}</h4>
        <p className={`text-xs ${color} mt-1 leading-relaxed opacity-90`}>{desc}</p>
      </div>
    </div>
  </div>
);

export default AiAnalysis;