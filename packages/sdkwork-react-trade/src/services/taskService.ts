import type {
  AvailableTask,
  TradePageRequest,
  TradePageResponse,
} from '../entities';

/**
 * 接单参数
 */
export interface AcceptTaskParams {
  /** 任务 UUID */
  taskUuid: string;
  /** 接单留言 */
  message?: string;
}

/**
 * 提交任务参数
 */
export interface SubmitTaskParams {
  /** 任务 UUID */
  taskUuid: string;
  /** 交付资源 UUID 列表 */
  deliveryResourceUuids: string[];
  /** 提交说明 */
  description?: string;
}

/**
 * 验收任务参数
 */
export interface ApproveTaskParams {
  /** 任务 UUID */
  taskUuid: string;
  /** 是否通过 */
  approved: boolean;
  /** 反馈说明 */
  feedback?: string;
}

/**
 * 任务服务接口
 */
export interface ITaskService {
  /**
   * 获取可接任务列表
   */
  getAvailableTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>>;

  /**
   * 获取任务详情
   */
  getTaskById(uuid: string): Promise<AvailableTask | null>;

  /**
   * 接单
   */
  acceptTask(params: AcceptTaskParams): Promise<AvailableTask>;

  /**
   * 提交任务
   */
  submitTask(params: SubmitTaskParams): Promise<AvailableTask>;

  /**
   * 验收任务
   */
  approveTask(params: ApproveTaskParams): Promise<AvailableTask>;

  /**
   * 取消任务
   */
  cancelTask(taskUuid: string): Promise<AvailableTask>;

  /**
   * 获取我发布的任务
   */
  getPublishedTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>>;

  /**
   * 获取我接的任�?   */
  getAcceptedTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>>;
}

/**
 * 任务服务实现 (本地存储版本)
 */
export class TaskService implements ITaskService {
  private readonly STORAGE_KEY = 'trade_tasks';

  private async getTasks(): Promise<AvailableTask[]> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private async saveTasks(tasks: AvailableTask[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
  }

  async getAvailableTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>> {
    const tasks = await this.getTasks();
    const availableTasks = tasks.filter((t) => t.status === 'AVAILABLE');
    return this.paginateTasks(availableTasks, params);
  }

  async getTaskById(uuid: string): Promise<AvailableTask | null> {
    const tasks = await this.getTasks();
    return tasks.find((t) => t.uuid === uuid) || null;
  }

  async acceptTask(params: AcceptTaskParams): Promise<AvailableTask> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex((t) => t.uuid === params.taskUuid);

    if (index === -1) {
      throw new Error('任务不存�?);
    }

    const task = tasks[index];
    if (task.status !== 'AVAILABLE') {
      throw new Error('任务当前不可�?);
    }

    const now = new Date().toISOString();
    task.status = 'ACCEPTED';
    task.acceptorUuid = 'current-user'; // TODO: 从认证上下文获取
    task.acceptorName = 'Current User';
    task.acceptedAt = now;
    task.updatedAt = now;

    tasks[index] = task;
    await this.saveTasks(tasks);
    return task;
  }

  async submitTask(params: SubmitTaskParams): Promise<AvailableTask> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex((t) => t.uuid === params.taskUuid);

    if (index === -1) {
      throw new Error('任务不存�?);
    }

    const task = tasks[index];
    if (task.status !== 'IN_PROGRESS') {
      throw new Error('任务不在进行中状�?);
    }

    const now = new Date().toISOString();
    task.status = 'COMPLETED';
    task.deliveryResourceUuids = params.deliveryResourceUuids;
    task.submittedAt = now;
    task.updatedAt = now;

    tasks[index] = task;
    await this.saveTasks(tasks);
    return task;
  }

  async approveTask(params: ApproveTaskParams): Promise<AvailableTask> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex((t) => t.uuid === params.taskUuid);

    if (index === -1) {
      throw new Error('任务不存�?);
    }

    const task = tasks[index];
    const now = new Date().toISOString();

    if (params.approved) {
      task.status = 'COMPLETED';
      task.approvedAt = now;
    } else {
      task.status = 'AVAILABLE';
      task.acceptorUuid = undefined;
      task.acceptorName = undefined;
      task.acceptedAt = undefined;
      task.deliveryResourceUuids = undefined;
    }

    task.updatedAt = now;

    tasks[index] = task;
    await this.saveTasks(tasks);
    return task;
  }

  async cancelTask(taskUuid: string): Promise<AvailableTask> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex((t) => t.uuid === taskUuid);

    if (index === -1) {
      throw new Error('任务不存�?);
    }

    const task = tasks[index];
    const now = new Date().toISOString();

    task.status = 'CANCELLED';
    if (task.acceptorUuid) {
      task.acceptorUuid = undefined;
      task.acceptorName = undefined;
      task.acceptedAt = undefined;
    }
    task.updatedAt = now;

    tasks[index] = task;
    await this.saveTasks(tasks);
    return task;
  }

  async getPublishedTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>> {
    const tasks = await this.getTasks();
    const publishedTasks = tasks.filter((t) => t.publisherUuid === 'current-user');
    return this.paginateTasks(publishedTasks, params);
  }

  async getAcceptedTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>> {
    const tasks = await this.getTasks();
    const acceptedTasks = tasks.filter((t) => t.acceptorUuid === 'current-user');
    return this.paginateTasks(acceptedTasks, params);
  }

  private paginateTasks(
    tasks: AvailableTask[],
    params: TradePageRequest
  ): TradePageResponse<AvailableTask> {
    let filtered = [...tasks];

    if (params.status) {
      filtered = filtered.filter((t) => t.status === params.status);
    }
    if (params.type) {
      filtered = filtered.filter((t) => t.type === params.type);
    }
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(keyword) ||
          t.description.toLowerCase().includes(keyword)
      );
    }

    // 按难度和预算排序
    const difficultyOrder = { EASY: 0, MEDIUM: 1, HARD: 2, EXPERT: 3 };
    filtered.sort((a, b) => {
      if (params.sortBy === 'budget') {
        return params.sortOrder === 'desc' ? b.budget - a.budget : a.budget - b.budget;
      }
      if (params.sortBy === 'difficulty') {
        const diffA = difficultyOrder[a.difficulty];
        const diffB = difficultyOrder[b.difficulty];
        return params.sortOrder === 'desc' ? diffB - diffA : diffA - diffB;
      }
      // 默认按创建时间降�?      return a.createdAt < b.createdAt ? 1 : -1;
    });

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      totalPages,
      currentPage: page,
      pageSize,
    };
  }
}

/**
 * 任务服务单例
 */
export const taskService = new TaskService();
