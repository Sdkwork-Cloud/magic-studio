# Magic Studio V2 前后端对接检查与修复 Round 41

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：在 `notifications` 已完成共�?SDK 契约守卫闭环后，继续补前端行为级回归，修复未读计数在本地状态层的真实错�? 
排除范围：`notes`

---

## 1. 本轮结论

本轮没有新增或修改任何后�?API，也没有修改 `retired Spring app API authority` 的接口定义�?
本轮处理的是一个前端状态层 bug�?
1. `NotificationStoreProvider.markAsRead(notificationKey)` 在本地状态更新时
2. 无论目标通知是否已读
3. 都会执行 `unreadCount - 1`

这会导致�?
1. 点击一条已读通知
2. 未读数仍然被错误减少
3. UI 计数和真实通知状态出现偏�?
本轮通过 TDD 修复了这个问题，并补�?provider 级回归测试�?
---

## 2. 问题列表与根�?
### P0. `notificationStore.markAsRead` 对已读通知重复扣减未读�?
问题位置�?
1. `packages/sdkwork-magic-studio-notifications/src/store/notificationStore.tsx`

问题现象�?
1. `NotificationCenter` 中每条通知都绑定了点击事件�?   - `onClick={() => markAsRead(resolveEntityKey(item))}`
2. `markAsRead` 旧实现里�?   - 先把匹配通知标记为已�?   - 然后无条件执�?`setUnreadCount(prev => Math.max(0, prev - 1))`

因此�?
1. 如果当前点击的是一条本来就已读的通知
2. `unreadCount` 仍然会被�?1
3. 只要连续点击已读通知，就会把本地未读计数扣错

根因�?
1. 本地状态更新逻辑没有先判断目标通知是否处于未读状�?2. 计数逻辑与通知实体状态之间缺少一致性判�?
---

## 3. 本轮接口输入输出说明

说明�?
1. 本轮没有修改后端接口 I/O
2. 继续沿用已有真实 SDK 接口

涉及但未变更的接口：

### 3.1 `client.notification.markAsRead`

输入：`notificationId`

输出：`PlusApiResultNotificationVO`

### 3.2 `client.notification.markAllAsRead`

输入：`void | QueryParams`

输出：`PlusApiResultVoid`

### 3.3 `client.notification.getUnreadCount`

输入：无

输出：`PlusApiResultMapStringInteger`

本轮结论�?
1. 问题不在后端接口
2. 问题在前�?`NotificationStoreProvider` 的本地状态同步逻辑

---

## 4. 实施方案

### 4.1 TDD 红灯

新增 provider 级测试：

1. `packages/sdkwork-magic-studio-notifications/tests/notificationStore.test.tsx`

测试目标�?
1. 构造一个通知快照�?   - 一条已�?   - 一条未�?   - `unreadCount = 1`
2. 调用 `markAsRead('notification-read')`
3. 断言�?   - `notificationBusinessService.markAsRead` 被调�?   - `unreadCount` 仍然保持 `1`

红灯结果�?
1. 测试失败
2. 实际得到 `unreadCount = 0`
3. 与预期不符，证明问题真实存在

### 4.2 根因修复

修复方式�?
1. �?`markAsRead(notificationKey)` 中，先基于当�?`notifications` 判断�?   - 目标通知是否为未�?2. 仅当 `targetWasUnread === true` 时，才执行未读数减一
3. 同时�?`notifications` 纳入 `useCallback` 依赖，确保判断基于最新状�?
修复后逻辑�?
1. 点击未读通知�?   - 本地通知状态设为已�?   - `unreadCount - 1`
2. 点击已读通知�?   - 保持 `unreadCount` 不变

---

## 5. 修改文件

### 新增

1. `packages/sdkwork-magic-studio-notifications/tests/notificationStore.test.tsx`

### 修改

1. `packages/sdkwork-magic-studio-notifications/src/store/notificationStore.tsx`

---

## 6. 验证结果

### 6.1 红灯验证

命令�?
```bash
pnpm exec vitest run packages/sdkwork-magic-studio-notifications/tests/notificationStore.test.tsx
```

结果�?
1. 失败
2. 失败断言�?   - 预期 `unreadCount = 1`
   - 实际 `unreadCount = 0`

### 6.2 修复后回�?
命令�?
```bash
pnpm exec vitest run packages/sdkwork-magic-studio-notifications/tests/notificationStore.test.tsx
```

结果�?
1. 通过
2. `1` 个文�?3. `1` 个测�?4. `0` 失败

### 6.3 通知包测试集

命令�?
```bash
pnpm exec vitest run packages/sdkwork-magic-studio-notifications/tests
```

结果�?
1. `3` 个测试文件通过
2. `6` 个测试通过
3. `0` 失败

### 6.4 通知包类型检�?
命令�?
```bash
pnpm --filter @sdkwork/magic-studio-notifications run typecheck
```

结果�?
1. 通过

### 6.5 工作区级验证

命令�?
```bash
pnpm typecheck
pnpm run check:sdk-standard
```

结果�?
1. `pnpm typecheck` 通过
2. `check:sdk-standard` 通过
3. `sdk-compliance` 严格模式 `0` 违规
4. `notification-standard` 通过
5. `trade-standard` 通过

---

## 7. 当前阶段判断

到本轮为止，`notifications` 模块已具备两层保护：

1. 契约层：
   - `notificationService.contract-typecheck.ts`
   - `tsconfig.contract.json`
2. 行为层：
   - `notificationService.test.ts`
   - `notificationSnapshotService.test.ts`
   - `notificationStore.test.tsx`

当前结论�?
1. `notifications` 不仅�?`client.xxx` 契约上对�?2. 本地状态层也补上了“已读通知重复点击不应扣减未读数”的行为级防回归

---

## 8. 下一步建�?
建议下一轮继续沿同样方式推进�?
1. `notifications`
   - `markAllAsRead`
   - `clearAll`
   - `notify`
2. `trade`
   - `createOrder`
   - `updateOrderStatus`
   - `requestRefund`
   - `getTransactionList`

目标�?
1. 继续把“已接入共享 SDK”推进到“关键行为有回归测试�?2. 让前后端对接不仅契约正确，而且前端本地状态与 UI 语义也稳�?