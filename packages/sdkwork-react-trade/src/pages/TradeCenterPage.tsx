import React, { useState } from 'react';
import { Briefcase, ClipboardList, DollarSign, FileText, Zap } from 'lucide-react';
import { cn } from '@sdkwork/react-commons';
import { OrderCard } from '../components/Order/OrderCard';
import { OrderList } from '../components/Order/OrderList';
import { PaymentDialog } from '../components/Payment/PaymentDialog';
import { TaskCard } from '../components/Task/TaskCard';
import { TaskList } from '../components/Task/TaskList';
import type { AvailableTask, Order } from '../entities';
import { tradeBusinessService } from '../services';
import { formatTradeCurrency, useTradeI18n } from '../useTradeI18n';

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
  defaultTab = 'tasks',
}) => {
  const { t } = useTradeI18n();
  const [activeTab, setActiveTab] = useState<TradeTab>(defaultTab);
  const [selectedTask, setSelectedTask] = useState<AvailableTask | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const isMarketMode = mode === 'market';

  const tabs: { id: TradeTab; label: string; icon: React.ElementType }[] = isMarketMode
    ? [
        { id: 'tasks', label: t('market.pages.trade_center.tabs.market'), icon: Zap },
        { id: 'orders', label: t('market.pages.trade_center.tabs.orders'), icon: FileText },
        { id: 'published', label: t('market.pages.trade_center.tabs.published'), icon: Briefcase },
        { id: 'wallet', label: t('market.pages.trade_center.tabs.wallet'), icon: DollarSign },
      ]
    : [
        { id: 'tasks', label: t('market.pages.trade_center.tabs.tasks'), icon: ClipboardList },
        { id: 'orders', label: t('market.pages.trade_center.tabs.orders'), icon: FileText },
        { id: 'published', label: t('market.pages.trade_center.tabs.published'), icon: Briefcase },
        { id: 'wallet', label: t('market.pages.trade_center.tabs.wallet'), icon: DollarSign },
      ];

  const handleAcceptTask = async (task: AvailableTask) => {
    try {
      await tradeBusinessService.taskService.acceptTask({ taskUuid: task.uuid });
      alert(t('market.actions.accept_success'));
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to accept task:', error);
      alert(t('market.actions.accept_failed'));
    }
  };

  const handlePayOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowPayment(true);
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm(t('market.actions.confirm_cancel_order', { orderNo: order.orderNo }))) {
      return;
    }

    try {
      alert(t('market.actions.order_cancelled'));
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert(t('market.actions.cancel_failed'));
    }
  };

  return (
    <div className={cn('min-h-screen bg-[#0a0a0c]', className)}>
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
                  {isMarketMode ? t('market.pages.trade_center.market_title') : t('market.pages.trade_center.my_title')}
                </h1>
                <p className="text-xs text-gray-500">
                  {isMarketMode ? t('market.pages.trade_center.market_subtitle') : t('market.pages.trade_center.my_subtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-white/20',
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

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
            <h3 className="text-sm font-medium text-white mb-2">{t('market.pages.trade_center.published_title')}</h3>
            <p className="text-xs text-gray-500 mb-4">{t('market.pages.trade_center.published_description')}</p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
              {t('market.common.publish')}
            </button>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="text-center py-12">
            <DollarSign size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-sm font-medium text-white mb-2">{t('market.pages.trade_center.wallet_title')}</h3>
            <p className="text-xs text-gray-500 mb-4">{t('market.pages.trade_center.wallet_description')}</p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-[#1e1e20] border border-white/10 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">{t('market.wallet.total_balance')}</div>
                <div className="text-2xl font-bold text-white">{formatTradeCurrency(100000)}</div>
              </div>
              <div className="bg-[#1e1e20] border border-white/10 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">{t('market.wallet.points')}</div>
                <div className="text-2xl font-bold text-white">10,000</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e20] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">{selectedTask.title}</h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label={t('market.common.close')}
                >
                  <span className="text-gray-400">×</span>
                </button>
              </div>
              <TaskCard task={selectedTask} onAccept={handleAcceptTask} />
            </div>
          </div>
        </div>
      )}

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
