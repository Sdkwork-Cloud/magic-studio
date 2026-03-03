import { createServiceAdapterController } from '@sdkwork/react-commons';
import { orderService } from './orderService';
import { paymentService } from './paymentService';
import { taskService } from './taskService';

export interface TradeBusinessAdapter {
  orderService: typeof orderService;
  paymentService: typeof paymentService;
  taskService: typeof taskService;
}

const localTradeAdapter: TradeBusinessAdapter = {
  orderService,
  paymentService,
  taskService
};

const controller = createServiceAdapterController<TradeBusinessAdapter>(localTradeAdapter);

export const tradeBusinessService: TradeBusinessAdapter = controller.service;
export const setTradeBusinessAdapter = controller.setAdapter;
export const getTradeBusinessAdapter = controller.getAdapter;
export const resetTradeBusinessAdapter = controller.resetAdapter;
