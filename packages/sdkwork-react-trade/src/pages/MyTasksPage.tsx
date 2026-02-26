import React, { useState } from 'react';
import { ClipboardList, FileText, Briefcase, DollarSign, CheckCircle, Clock, AlertCircle, Award, Sparkles } from 'lucide-react';
import { OrderList } from '../components/Order/OrderList';
import { PaymentDialog } from '../components/Payment/PaymentDialog';
import type { Order } from '../entities';
import { TradeLayout } from '../components/Layout/TradeLayout';

type MyTasksTab = 'tasks' | 'orders' | 'published' | 'wallet';

const MyTasksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MyTasksTab>('tasks');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handlePayOrder = (order: Order) => { setSelectedOrder(order); setShowPayment(true); };
  const handleCancelOrder = async (order: Order) => { if (!confirm(`确定取消订单 ${order.orderNo} 吗?`)) return; alert('订单已取消'); };

  const TABS = [
    { id: 'tasks', label: '我的任务', icon: ClipboardList },
    { id: 'orders', label: '我的订单', icon: FileText },
    { id: 'published', label: '我发布的', icon: Briefcase },
    { id: 'wallet', label: '钱包', icon: DollarSign },
  ];

  return (
    <TradeLayout>
      <div className="relative overflow-hidden bg-gradient-to-b from-purple-900/30 via-pink-900/20 to-[#0a0a0f] border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 mb-6">
              <ClipboardList size={16} className="text-purple-400" />
              <span className="text-xs text-gray-300">任务管理中心</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">我的任务</span> - 管理你的工作
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              查看和管理你的任务、订单和收入
            </p>
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
                    onClick={() => setActiveTab(tab.id as MyTasksTab)}
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

            <button
              onClick={() => setActiveTab('orders')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg"
            >
              <Briefcase size={14} />
              前往任务市场
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'tasks' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Clock size={20} className="text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">3</div>
                    <div className="text-xs text-gray-400">进行中</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">24</div>
                    <div className="text-xs text-gray-400">已完成</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <AlertCircle size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">2</div>
                    <div className="text-xs text-gray-400">待审核</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <DollarSign size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">¥2,580</div>
                    <div className="text-xs text-gray-400">累计收入</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#141416] border border-white/5 rounded-xl p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <ClipboardList size={32} className="text-gray-600" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">暂无进行中的任务</h3>
                <p className="text-sm text-gray-500 mb-4">去任务市场抢单赚佣金吧</p>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg"
                >
                  浏览任务
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <OrderList onOrderClick={setSelectedOrder} onPay={handlePayOrder} onCancel={handleCancelOrder} />
        )}

        {activeTab === 'published' && (
          <div className="bg-[#141416] border border-white/5 rounded-xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Briefcase size={32} className="text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">暂无发布的任务</h3>
              <p className="text-sm text-gray-500 mb-4">发布你的任务需求</p>
              <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg">
                发布新任务
              </button>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-white/10 rounded-2xl p-8 mb-6">
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
          <div className="bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-rose-900/30 rounded-2xl p-8 border border-white/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Award size={24} className="text-purple-400" />
                <h2 className="text-xl font-bold text-white">提升你的技能等级</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6 max-w-2xl mx-auto">
                完成更多任务，获得更高等级和更多收入
              </p>
              <div className="flex items-center justify-center gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                  <Sparkles size={16} />
                  查看技能市场
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors">
                  了解等级系统
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPayment && selectedOrder && (
        <PaymentDialog
          order={selectedOrder}
          onClose={() => { setShowPayment(false); setSelectedOrder(null); }}
          onSuccess={() => { setShowPayment(false); setSelectedOrder(null); }}
        />
      )}
    </TradeLayout>
  );
};

export { MyTasksPage };
