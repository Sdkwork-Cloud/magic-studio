export interface WaitForCanonicalTaskResultOptions<TTask> {
  taskId: string;
  readTask: (taskId: string) => Promise<TTask | null | undefined>;
  shouldReturnTask: (task: TTask) => boolean;
  waitMs: number;
  maxAttempts: number;
  timeoutMessage: string;
}

const wait = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function waitForCanonicalTaskResult<TTask>(
  options: WaitForCanonicalTaskResultOptions<TTask>,
): Promise<TTask> {
  const {
    taskId,
    readTask,
    shouldReturnTask,
    waitMs,
    maxAttempts,
    timeoutMessage,
  } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const task = await readTask(taskId);

    if (task && shouldReturnTask(task)) {
      return task;
    }

    if (attempt < maxAttempts - 1) {
      await wait(waitMs);
    }
  }

  throw new Error(timeoutMessage);
}
