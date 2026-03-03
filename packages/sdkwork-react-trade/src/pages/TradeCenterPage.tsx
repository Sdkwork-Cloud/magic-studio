import React, { useState } from 'react';
import { Briefcase, FileText, DollarSign, Zap, ClipboardList } from 'lucide-react';
import type { AvailableTask, Order } from '../entities';
import { TaskList } from '../components/Task/TaskList';
import { OrderList } from '../components/Order/OrderList';
import { TaskCard } from '../components/Task/TaskCard';
import { OrderCard } from '../components/Order/OrderCard';
import { PaymentDialog } from '../components/Payment/PaymentDialog';
import { tradeBusinessService } from '../services';
import { cn } from '@sdkwork/react-commons';

type TradeCenterMode = 'market' | 'my';
type TradeTab = 'tasks' | 'orders' | 'published' | 'wallet';

export interface TradeCenterPageProps {
  className?: string;
  mode?: TradeCenterMode;
  defaultTab?: TradeTab;
}

export const TradeCenter: React.FC<TradeCenterPageProps> = ({ 
  className = '', 
  mode = 'market',
  defaultTab = 'tasks'
}) => {
  const [activeTab, setActiveTab] = useState<TradeTab>(defaultTab);
  const [selectedTask, setSelectedTask] = useState<AvailableTask | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const isMarketMode = mode === 'market';

  const tabs: { id: TradeTab; label: string; icon: React.ElementType }[] = isMarketMode
    ? [
        { id: 'tasks', label: '订单大厅', icon: Zap },
        { id: 'orders', label: '我的订单', icon: FileText },
        { id: 'published', label: '我发布的', icon: Briefcase },
        { id: 'wallet', label: '钱包', icon: DollarSign },
      ]
    : [
        { id: 'tasks', label: '我的任务', icon: ClipboardList },
        { id: 'orders', label: '我的订单', icon: FileText },
        { id: 'published', label: '我发布的', icon: Briefcase },
        { id: 'wallet', label: '钱包', icon: DollarSign },
      ];

  const handleAcceptTask = async (task: AvailableTask) => {
    try {
      await tradeBusinessService.taskService.acceptTask({ taskUuid: task.uuid });
      alert('接单成功！');
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to accept task:', error);
      alert('接单失败，请重试');
    }
  };

  const handlePayOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowPayment(true);
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm(`确定取消订单 ${order.orderNo} 吗?`)) {
      return;
    }
    try {
      alert('订单已取消');
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('取消失败，请重试');
    }
  };

  return (
    <div className={cn('min-h-screen bg-[#0a0a0c]', className)}>
      {/* Header */}
      <div className="bg-[#1e1e20] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                {isMarketMode ? (
                  <Briefcase size={20} className="text-white" />
                ) : (
                  <ClipboardList size={20} className="text-white" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {isMarketMode ? '任务市场' : '我的任务'}
                </h1>
                <p className="text-xs text-gray-500">
                  {isMarketMode ? '发现并抢单赚佣金' : '管理你的任务'}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'tasks' && (
          <TaskList
            onTaskAccept={handleAcceptTask}
            onTaskViewDetail={setSelectedTask}
          />
        )}

        {activeTab === 'orders' && (
          <OrderList
            onOrderClick={setSelectedOrder}
            onPay={handlePayOrder}
            onCancel={handleCancelOrder}
          />
        )}

        {activeTab === 'published' && (
          <div className="text-center py-12">
            <Briefcase size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-sm font-medium text-white mb-2">暂无发布的任务</h3>
            <p className="text-xs text-gray-500 mb-4">发布你的任务，让其他人来承接</p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
              发布任务
            </button>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="text-center py-12">
            <DollarSign size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-sm font-medium text-white mb-2">钱包功能</h3>
            <p className="text-xs text-gray-500 mb-4">管理你的余额和积分</p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-[#1e1e20] border border-white/10 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">余额</div>
                <div className="text-2xl font-bold text-white">¥1,000.00</div>
              </div>
              <div className="bg-[#1e1e20] border border-white/10 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">积分</div>
                <div className="text-2xl font-bold text-white">10,000</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e20] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">{selectedTask.title}</h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="text-gray-400">×</span>
                </button>
              </div>
              <TaskCard task={selectedTask} onAccept={handleAcceptTask} />
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e20] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <OrderCard
              order={selectedOrder}
              onClick={() => {}}
              onPay={handlePayOrder}
              onCancel={handleCancelOrder}
            />
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      {showPayment && selectedOrder && (
        <PaymentDialog
          order={selectedOrder}
          onClose={() => {
            setShowPayment(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            setShowPayment(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};
