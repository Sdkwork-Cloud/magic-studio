import React, { useState, useMemo } from 'react';
import { Zap, Briefcase, FileText, DollarSign, Search, Filter, Banknote, Users, TrendingUp, Award, Sparkles } from 'lucide-react';
import type { AvailableTask, TradePageRequest } from '../entities';
import { taskService } from '../services/taskService';
import { TaskCard } from '../components/Task/TaskCard';
import { useRouter, ROUTES } from '@sdkwork/react-core';
import { TradeLayout } from '../components/Layout/TradeLayout';

type TaskMarketTab = 'market' | 'orders' | 'published' | 'wallet';

const TaskMarketPage: React.FC = () => {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<TaskMarketTab>('market');
  const [selectedTask, setSelectedTask] = useState<AvailableTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<AvailableTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [filters, setFilters] = useState<TradePageRequest>({ page: 1, pageSize });
  const [sortBy, setSortBy] = useState<'latest' | 'budget' | 'difficulty'>('latest');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [keyword, setKeyword] = useState('');

  React.useEffect(() => { loadTasks(); }, [filters]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const result = await taskService.getAvailableTasks(filters);
      setTasks(result.items);
      setTotal(result.total);
      setPage(result.currentPage);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (task: AvailableTask) => {
    try {
      await taskService.acceptTask({ taskUuid: task.uuid });
      alert('接单成功！');
      setSelectedTask(null);
      loadTasks();
    } catch (error) {
      console.error('Failed to accept task:', error);
      alert('接单失败，请重试');
    }
  };

  const handleApplyFilters = () => {
    setFilters({ page: 1, pageSize, type: selectedType || undefined, keyword: keyword || undefined, sortBy: sortBy === 'budget' ? 'budget' : sortBy === 'difficulty' ? 'difficulty' : undefined, sortOrder: sortBy === 'budget' ? 'desc' : 'asc' });
  };

  const handlePageChange = (newPage: number) => { setFilters((prev: TradePageRequest) => ({ ...prev, page: newPage })); };
  const totalPages = Math.ceil(total / pageSize);
  const stats = useMemo(() => ({ totalTasks: total, totalBudget: tasks.reduce((sum, t) => sum + t.budget, 0), activeUsers: 128, completedToday: 24 }), [tasks, total]);
  const formatBudget = (budget: number) => `¥${(budget / 100).toFixed(2)}`;

  const TABS = [
    { id: 'market', label: '订单大厅', icon: Zap },
    { id: 'orders', label: '我的订单', icon: FileText },
    { id: 'published', label: '我发布的', icon: Briefcase },
    { id: 'wallet', label: '钱包', icon: DollarSign },
  ];

  return (
    <TradeLayout>
          <div className="relative overflow-hidden bg-gradient-to-b from-blue-900/30 via-cyan-900/20 to-[#0a0a0f] border-b border-white/5">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-12">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 mb-6">
                  <Briefcase size={16} className="text-blue-400" />
                  <span className="text-xs text-gray-300">AI 任务市场 - 用技能赚钱</span>
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">任务市场</span> - 发现优质任务
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  探索 {total}+ 个AI任务，用你的技能赚取收入
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="搜索任务关键词..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-12 pr-6 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-1">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TaskMarketTab)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-white/10 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="">全部类型</option>
                    <option value="TEXT_TO_VIDEO">文生视频</option>
                    <option value="IMAGE_TO_VIDEO">图生视频</option>
                    <option value="VIDEO_EXTEND">视频扩展</option>
                    <option value="VIDEO_RESTORE">视频修复</option>
                  </select>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="">全部难度</option>
                    <option value="EASY">简单</option>
                    <option value="MEDIUM">中等</option>
                    <option value="HARD">困难</option>
                    <option value="EXPERT">专家</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="latest">最新发布</option>
                    <option value="budget">最高报酬</option>
                    <option value="difficulty">最高难度</option>
                  </select>
                  <button
                    onClick={handleApplyFilters}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg"
                  >
                    <Filter size={14} /> 筛选
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-8">
            {activeTab === 'market' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Zap size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.totalTasks}</div>
                        <div className="text-xs text-gray-400">可接任务</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Banknote size={20} className="text-green-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{formatBudget(stats.totalBudget)}</div>
                        <div className="text-xs text-gray-400">总预算</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Users size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
                        <div className="text-xs text-gray-400">活跃用户</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <TrendingUp size={20} className="text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.completedToday}</div>
                        <div className="text-xs text-gray-400">今日完成</div>
                      </div>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-sm text-gray-500">加载中...</span>
                    </div>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <Briefcase size={32} className="text-gray-600" />
                      </div>
                      <h3 className="text-base font-semibold text-white mb-2">暂无可接任务</h3>
                      <p className="text-sm text-gray-500">请稍后再来看看新任务</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {tasks.map((task) => (
                        <TaskCard key={task.uuid} task={task} onAccept={handleAcceptTask} onViewDetail={setSelectedTask} />
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                          className="px-4 py-2 bg-[#1e1e20] border border-white/10 rounded-lg text-sm text-gray-400 disabled:opacity-50"
                        >
                          上一页
                        </button>
                        <span className="text-sm text-gray-500 px-4">{page} / {totalPages}</span>
                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page === totalPages}
                          className="px-4 py-2 bg-[#1e1e20] border border-white/10 rounded-lg text-sm text-gray-400 disabled:opacity-50"
                        >
                          下一页
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {activeTab === 'orders' && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                  <h3 className="text-base font-semibold text-white mb-2">订单功能</h3>
                  <p className="text-sm text-gray-500 mb-4">查看和管理你的订单</p>
                  <button
                    onClick={() => navigate(ROUTES.MY_TASKS)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg"
                  >
                    前往我的任务
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'published' && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Briefcase size={48} className="mx-auto text-gray-600 mb-4" />
                  <h3 className="text-base font-semibold text-white mb-2">发布任务</h3>
                  <p className="text-sm text-gray-500 mb-4">发布你的任务需求</p>
                  <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg">
                    发布新任务
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="xl mx-auto py-8">
                <div className="bg-gradient-tomax-w-2-br from-blue-600/20 to-purple-600/20 border border-white/10 rounded-2xl p-8 mb-6">
                  <div className="text-sm text-gray-400 mb-2">总余额</div>
                  <div className="text-4xl font-bold text-white mb-4">¥1,000.00</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1e1e20] rounded-xl p-4">
                      <div className="text-xs text-gray-400 mb-1">可用余额</div>
                      <div className="text-lg font-semibold text-white">¥1,000.00</div>
                    </div>
                    <div className="bg-[#1e1e20] rounded-xl p-4">
                      <div className="text-xs text-gray-400 mb-1">冻结金额</div>
                      <div className="text-lg font-semibold text-white">¥0.00</div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#141416] border border-white/5 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">积分</div>
                      <div className="text-xs text-gray-500">100 积分 = ¥1</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">10,000</div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg">积分兑换</button>
                    <button className="flex-1 px-4 py-2 bg-[#1e1e20] hover:bg-white/10 text-white text-sm font-medium rounded-lg">获取积分</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1e20] hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium">
                    <DollarSign size={16} />充值
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1e20] hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium">
                    <FileText size={16} />交易记录
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/5 mt-8">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="bg-gradient-to-r from-blue-900/30 via-cyan-900/30 to-teal-900/30 rounded-2xl p-8 border border-white/10">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Award size={24} className="text-blue-400" />
                    <h2 className="text-xl font-bold text-white">成为任务发布者</h2>
                  </div>
                  <p className="text-gray-400 text-sm mb-6 max-w-2xl mx-auto">
                    发布你的 AI 任务需求，找到合适的创作者帮助你完成
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                      <Sparkles size={16} />
                      发布任务
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors">
                      了解更多
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedTask && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#1e1e20] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">{selectedTask.title}</h2>
                    <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white/10 rounded-lg">
                      <span className="text-gray-400 text-xl">×</span>
                    </button>
                  </div>
                  <TaskCard task={selectedTask} onAccept={handleAcceptTask} />
                </div>
              </div>
            </div>
          )}
    </TradeLayout>
  );
};

export { TaskMarketPage };
