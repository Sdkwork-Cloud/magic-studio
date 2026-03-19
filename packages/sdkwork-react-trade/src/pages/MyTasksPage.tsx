import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  Briefcase,
  CheckCircle,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Sparkles,
} from 'lucide-react';
import { ROUTES, useRouter } from '@sdkwork/react-core';
import { OrderList } from '../components/Order/OrderList';
import { PaymentDialog } from '../components/Payment/PaymentDialog';
import { TradeLayout } from '../components/Layout/TradeLayout';
import type { Order } from '../entities';
import { formatTradeCurrency, useTradeI18n } from '../useTradeI18n';

type MyTasksTab = 'tasks' | 'orders' | 'published' | 'wallet';

const MyTasksPage: React.FC = () => {
  const { navigate } = useRouter();
  const { t } = useTradeI18n();
  const [activeTab, setActiveTab] = useState<MyTasksTab>('tasks');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handlePayOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowPayment(true);
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm(t('market.actions.confirm_cancel_order', { orderNo: order.orderNo }))) {
      return;
    }

    alert(t('market.actions.order_cancelled'));
  };

  const tabs = [
    { id: 'tasks', label: t('market.pages.my_tasks.tabs.tasks'), icon: ClipboardList },
    { id: 'orders', label: t('market.pages.my_tasks.tabs.orders'), icon: FileText },
    { id: 'published', label: t('market.pages.my_tasks.tabs.published'), icon: Briefcase },
    { id: 'wallet', label: t('market.pages.my_tasks.tabs.wallet'), icon: DollarSign },
  ] as const;

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
              <span className="text-xs text-gray-300">{t('market.pages.my_tasks.badge')}</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">
                {t('market.pages.my_tasks.title')}
              </span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('market.pages.my_tasks.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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
              onClick={() => navigate(ROUTES.TASK_MARKET)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg"
            >
              <Briefcase size={14} />
              {t('market.pages.my_tasks.marketplace')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'tasks' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Clock}
                iconClassName="text-yellow-400"
                iconWrapperClassName="bg-yellow-500/20"
                value="3"
                label={t('market.pages.my_tasks.stats_in_progress')}
              />
              <StatCard
                icon={CheckCircle}
                iconClassName="text-green-400"
                iconWrapperClassName="bg-green-500/20"
                value="24"
                label={t('market.pages.my_tasks.stats_completed')}
              />
              <StatCard
                icon={AlertCircle}
                iconClassName="text-orange-400"
                iconWrapperClassName="bg-orange-500/20"
                value="2"
                label={t('market.pages.my_tasks.stats_pending_review')}
              />
              <StatCard
                icon={DollarSign}
                iconClassName="text-blue-400"
                iconWrapperClassName="bg-blue-500/20"
                value={formatTradeCurrency(258000)}
                label={t('market.pages.my_tasks.stats_income')}
              />
            </div>

            <div className="bg-[#141416] border border-white/5 rounded-xl p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <ClipboardList size={32} className="text-gray-600" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {t('market.pages.my_tasks.empty_active_title')}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {t('market.pages.my_tasks.empty_active_description')}
                </p>
                <button
                  onClick={() => navigate(ROUTES.TASK_MARKET)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg"
                >
                  {t('market.pages.my_tasks.browse_tasks')}
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
              <h3 className="text-base font-semibold text-white mb-2">
                {t('market.pages.my_tasks.empty_published_title')}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t('market.pages.my_tasks.empty_published_description')}
              </p>
              <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg">
                {t('market.pages.my_tasks.publish_action')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-white/10 rounded-2xl p-8 mb-6">
              <div className="text-sm text-gray-400 mb-2">{t('market.wallet.total_balance')}</div>
              <div className="text-4xl font-bold text-white mb-4">{formatTradeCurrency(100000)}</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1e1e20] rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">{t('market.wallet.available_balance')}</div>
                  <div className="text-lg font-semibold text-white">{formatTradeCurrency(100000)}</div>
                </div>
                <div className="bg-[#1e1e20] rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">{t('market.wallet.frozen_balance')}</div>
                  <div className="text-lg font-semibold text-white">{formatTradeCurrency(0)}</div>
                </div>
              </div>
            </div>
            <div className="bg-[#141416] border border-white/5 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-white mb-1">{t('market.wallet.points')}</div>
                  <div className="text-xs text-gray-500">{t('market.common.points_rule')}</div>
                </div>
                <div className="text-2xl font-bold text-purple-400">10,000</div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg">
                  {t('market.wallet.redeem_points')}
                </button>
                <button className="flex-1 px-4 py-2 bg-[#1e1e20] hover:bg-white/10 text-white text-sm font-medium rounded-lg">
                  {t('market.wallet.earn_points')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1e20] hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium">
                <DollarSign size={16} /> {t('market.wallet.top_up')}
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1e20] hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium">
                <FileText size={16} /> {t('market.wallet.transaction_history')}
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
                <h2 className="text-xl font-bold text-white">{t('market.pages.my_tasks.skill_title')}</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6 max-w-2xl mx-auto">
                {t('market.pages.my_tasks.skill_description')}
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => navigate(ROUTES.PORTAL_SKILLS)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <Sparkles size={16} />
                  {t('market.pages.my_tasks.skill_market')}
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors">
                  {t('market.pages.my_tasks.level_system')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </TradeLayout>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  iconClassName: string;
  iconWrapperClassName: string;
  value: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  iconClassName,
  iconWrapperClassName,
  value,
  label,
}) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconWrapperClassName}`}>
        <Icon size={20} className={iconClassName} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  </div>
);

export { MyTasksPage };
