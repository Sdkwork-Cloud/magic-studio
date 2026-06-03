import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import {
  isMagicStudioServerResourceNotFoundError,
  type MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';

import type {
  AvailableTask,
  TradePageRequest,
  TradePageResponse,
} from '../entities';
import {
  mapTradeMarketplaceTask,
  mapTradeMarketplaceTaskPage,
  toTradeTaskQuery,
} from './tradeTaskMapper';

export interface AcceptTaskParams {
  taskUuid: string;
  message?: string;
}

export interface SubmitTaskParams {
  taskUuid: string;
  deliveryResourceUuids: string[];
  description?: string;
}

export interface ApproveTaskParams {
  taskUuid: string;
  approved: boolean;
  feedback?: string;
}

export interface ITaskService {
  getAvailableTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>>;
  getTaskById(uuid: string): Promise<AvailableTask | null>;
  acceptTask(params: AcceptTaskParams): Promise<AvailableTask>;
  submitTask(params: SubmitTaskParams): Promise<AvailableTask>;
  approveTask(params: ApproveTaskParams): Promise<AvailableTask>;
  cancelTask(taskUuid: string): Promise<AvailableTask>;
  getPublishedTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>>;
  getAcceptedTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>>;
}

type TradeTaskServerClient = Pick<
  MagicStudioServerClient,
  | 'acceptTradeTask'
  | 'approveTradeTask'
  | 'cancelTradeTask'
  | 'listTradeAcceptedTasks'
  | 'listTradeAvailableTasks'
  | 'listTradePublishedTasks'
  | 'readTradeTask'
  | 'submitTradeTask'
>;

export interface TaskServiceOptions {
  serverClient?: TradeTaskServerClient;
}

const TRADE_TASK_NOT_FOUND_CODES = ['APP_TRADE_TASK_NOT_FOUND'] as const;

export class TaskService implements ITaskService {
  private readonly serverClient?: TradeTaskServerClient;
  private cachedServerClient?: TradeTaskServerClient;

  constructor(options: TaskServiceOptions = {}) {
    this.serverClient = options.serverClient;
  }

  private getServerClient(): TradeTaskServerClient {
    if (this.serverClient) {
      return this.serverClient;
    }

    if (!this.cachedServerClient) {
      const runtime = readDefaultPlatformRuntime('TradeTaskService');
      if (!isMagicStudioServerRuntimeSupported(runtime)) {
        throw new Error(
          '[TradeTaskService] trade marketplace requires the canonical Magic Studio server runtime',
        );
      }
      this.cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
    }

    return this.cachedServerClient;
  }

  async getAvailableTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>> {
    const response = await this.getServerClient().listTradeAvailableTasks(
      toTradeTaskQuery(params),
    );
    return mapTradeMarketplaceTaskPage(response);
  }

  async getTaskById(uuid: string): Promise<AvailableTask | null> {
    try {
      const response = await this.getServerClient().readTradeTask(uuid);
      return mapTradeMarketplaceTask(response.data);
    } catch (error) {
      if (isMagicStudioServerResourceNotFoundError(error, TRADE_TASK_NOT_FOUND_CODES)) {
        return null;
      }
      throw error;
    }
  }

  async acceptTask(params: AcceptTaskParams): Promise<AvailableTask> {
    const response = await this.getServerClient().acceptTradeTask(params.taskUuid, {
      message: params.message,
    });
    return mapTradeMarketplaceTask(response.data);
  }

  async submitTask(params: SubmitTaskParams): Promise<AvailableTask> {
    const response = await this.getServerClient().submitTradeTask(params.taskUuid, {
      deliveryResourceUuids: params.deliveryResourceUuids,
      description: params.description,
    });
    return mapTradeMarketplaceTask(response.data);
  }

  async approveTask(params: ApproveTaskParams): Promise<AvailableTask> {
    const response = await this.getServerClient().approveTradeTask(params.taskUuid, {
      approved: params.approved,
      feedback: params.feedback,
    });
    return mapTradeMarketplaceTask(response.data);
  }

  async cancelTask(taskUuid: string): Promise<AvailableTask> {
    const response = await this.getServerClient().cancelTradeTask(taskUuid);
    return mapTradeMarketplaceTask(response.data);
  }

  async getPublishedTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>> {
    const response = await this.getServerClient().listTradePublishedTasks(
      toTradeTaskQuery(params),
    );
    return mapTradeMarketplaceTaskPage(response);
  }

  async getAcceptedTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>> {
    const response = await this.getServerClient().listTradeAcceptedTasks(
      toTradeTaskQuery(params),
    );
    return mapTradeMarketplaceTaskPage(response);
  }
}

export const taskService = new TaskService();
