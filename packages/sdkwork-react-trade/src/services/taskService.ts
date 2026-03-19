import type {
  AvailableTask,
  TradePageRequest,
  TradePageResponse,
} from '../entities';

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

const TASK_NOT_FOUND_ERROR = 'Task not found';
const TASK_NOT_ACCEPTABLE_ERROR = 'Task is not available for acceptance';
const TASK_NOT_IN_PROGRESS_ERROR = 'Task is not currently in progress';

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
    const availableTasks = tasks.filter((task) => task.status === 'AVAILABLE');
    return this.paginateTasks(availableTasks, params);
  }

  async getTaskById(uuid: string): Promise<AvailableTask | null> {
    const tasks = await this.getTasks();
    return tasks.find((task) => task.uuid === uuid) || null;
  }

  async acceptTask(params: AcceptTaskParams): Promise<AvailableTask> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex((task) => task.uuid === params.taskUuid);

    if (index === -1) {
      throw new Error(TASK_NOT_FOUND_ERROR);
    }

    const task = tasks[index];
    if (task.status !== 'AVAILABLE') {
      throw new Error(TASK_NOT_ACCEPTABLE_ERROR);
    }

    const now = new Date().toISOString();
    task.status = 'ACCEPTED';
    task.acceptorUuid = 'current-user';
    task.acceptorName = 'Current User';
    task.acceptedAt = now;
    task.updatedAt = now;

    tasks[index] = task;
    await this.saveTasks(tasks);
    return task;
  }

  async submitTask(params: SubmitTaskParams): Promise<AvailableTask> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex((task) => task.uuid === params.taskUuid);

    if (index === -1) {
      throw new Error(TASK_NOT_FOUND_ERROR);
    }

    const task = tasks[index];
    if (task.status !== 'IN_PROGRESS') {
      throw new Error(TASK_NOT_IN_PROGRESS_ERROR);
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
    const index = tasks.findIndex((task) => task.uuid === params.taskUuid);

    if (index === -1) {
      throw new Error(TASK_NOT_FOUND_ERROR);
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
    const index = tasks.findIndex((task) => task.uuid === taskUuid);

    if (index === -1) {
      throw new Error(TASK_NOT_FOUND_ERROR);
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
    const publishedTasks = tasks.filter((task) => task.publisherUuid === 'current-user');
    return this.paginateTasks(publishedTasks, params);
  }

  async getAcceptedTasks(params: TradePageRequest): Promise<TradePageResponse<AvailableTask>> {
    const tasks = await this.getTasks();
    const acceptedTasks = tasks.filter((task) => task.acceptorUuid === 'current-user');
    return this.paginateTasks(acceptedTasks, params);
  }

  private paginateTasks(
    tasks: AvailableTask[],
    params: TradePageRequest,
  ): TradePageResponse<AvailableTask> {
    let filtered = [...tasks];

    if (params.status) {
      filtered = filtered.filter((task) => task.status === params.status);
    }
    if (params.type) {
      filtered = filtered.filter((task) => task.type === params.type);
    }
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = filtered.filter((task) => (
        task.title.toLowerCase().includes(keyword)
        || task.description.toLowerCase().includes(keyword)
      ));
    }
    if (params.difficulty) {
      filtered = filtered.filter((task) => task.difficulty === params.difficulty);
    }

    const difficultyOrder = { EASY: 0, MEDIUM: 1, HARD: 2, EXPERT: 3 };
    filtered.sort((taskA, taskB) => {
      if (params.sortBy === 'budget') {
        return params.sortOrder === 'desc' ? taskB.budget - taskA.budget : taskA.budget - taskB.budget;
      }
      if (params.sortBy === 'difficulty') {
        const diffA = difficultyOrder[taskA.difficulty];
        const diffB = difficultyOrder[taskB.difficulty];
        return params.sortOrder === 'desc' ? diffB - diffA : diffA - diffB;
      }

      return taskA.createdAt < taskB.createdAt ? 1 : -1;
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

export const taskService = new TaskService();
