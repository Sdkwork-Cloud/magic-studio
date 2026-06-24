> Migrated from `docs/review/2026-04-07-magic-studio-front-back-integration-round-49.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 前后端对接检查与修复 Round 49

日期: 2026-04-07  
范围: `apps/magic-studio-v2`  
目标: 修复 `trade/orderService` 的订单状态查询与统计契约失真，确保前端状态筛选、聚合分页、统计口径都对齐真实 app-api  
排除范围: `notes`

---

## 1. 本轮结论

本轮不新增后�?API，也不修�?`retired Spring app API authority` 的接口定义�? 
本轮处理的是前端 `@sdkwork/magic-studio-trade` �?app-api 订单状态模型的错误消费�?
1. 前端�?`PENDING_PAYMENT / IN_PROGRESS / REFUNDED / DISPUTED` 当成可以直接传给后端的状态筛选值�?2. �?app-api `OrderAppApiController.listOrders(...)` 内部真实只接受后端枚举：
   - `PENDING`
   - `PAID`
   - `DELIVERED`
   - `COMPLETED`
   - `CANCELLED`
   - `REFUNDING`
   - `PARTIAL_REFUND`
   - `FULL_REFUND`
3. 前端 `getOrderStatistics()` 又把 `pendingShipment + pendingReceipt` 当成进行中订单数，但当前 app-api 统计实现没有填充这两个字段，导致结果长期失真�?
结论:

1. 本轮应修改前端服务实现，不修改后端接口�?2. 本轮应把前端“展示状态”和后端“查询状态”解耦�?3. 本轮应对后端不支持的聚合状态在前端做聚合查询或显式拒绝，不能继续假设后端直接支持�?
---

## 2. 问题列表与根�?
### P0. `getOrderList` 把前端展示状态直接传成后端查询状�?
问题位置:

1. `packages/sdkwork-magic-studio-trade/src/services/orderService.ts`

现状:

1. `PENDING_PAYMENT` 会被直接传给后端
2. `IN_PROGRESS` 会被错误映射�?`PENDING_SHIPMENT`
3. `REFUNDED` 会被直接传给后端
4. `DISPUTED` 会被直接传给后端

根因:

1. 前端状态枚举是 UI 语义，不�?app-api 原生查询枚举
2. 后端 `listOrders` 走的�?`OrderStatus.valueOf(...)`
3. 任何不属于真�?`OrderStatus` 的值都会被 controller 判定为非�?
### P0. `getOrderStatistics` 使用了当�?app-api 未填充的字段

问题位置:

1. `packages/sdkwork-magic-studio-trade/src/services/orderService.ts`
2. `retired Spring app API authority/src/main/java/com/sdkwork/ai/gateway/api/app/v3/trade/OrderAppApiController.java`

现状:

1. 前端直接计算:
   - `inProgressOrders = pendingShipment + pendingReceipt`
2. 但当�?app-api `getOrderStatistics()` 只填�?
   - `totalOrders`
   - `pendingPayment`
   - `completed`
   - `totalAmount`
3. `pendingShipment` �?`pendingReceipt` 当前返回为空时，前端会长期得�?`0`

根因:

1. OpenAPI/VO 暴露了两个字段，�?controller 当前实现没有真实填�?2. 前端把“字段存在”误当成“字段已稳定可用�?
### P1. UI 状态筛选项包含 app-api 不支持的直接筛选�?
问题位置:

1. `packages/sdkwork-magic-studio-trade/src/components/Order/OrderList.tsx`

现状:

1. UI 暴露�?
   - `PENDING_PAYMENT`
   - `IN_PROGRESS`
   - `REFUNDED`
   - `DISPUTED`
2. 其中这些值不能直接作�?app-api `status` 查询参数使用

根因:

1. UI 层与后端契约层没有建立状态查询计�?2. 过滤项设计沿用了前端旧模型，但查询实现已切到 app-api

---

## 3. 本轮处理方法�?API 输入输出

说明:

1. 本节只列本轮会处理的方法
2. 每个方法都明确“是否新�?是否修改�?3. 后端 API 只做对齐消费，不�?contract

### 3.1 `orderService.getOrderList(params)`

方法:

```ts
getOrderList(params: TradePageRequest): Promise<TradePageResponse<Order>>
```

前端输入:

```ts
{
  page: number
  pageSize: number
  keyword?: string
  status?: string
  type?: string
  startTime?: string
  endTime?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

真实后端 API:

```ts
client.orders.listOrders(query: QueryParams): Promise<PlusApiResultPageOrderVO>
```

真实后端可接受状�?

```ts
'PENDING' | 'PAID' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDING' | 'PARTIAL_REFUND' | 'FULL_REFUND'
```

本轮输出语义:

1. `PENDING_PAYMENT -> PENDING`
2. `PAID -> PAID`
3. `IN_PROGRESS -> 聚合查询 [PAID, DELIVERED]`
4. `COMPLETED -> COMPLETED`
5. `CANCELLED -> CANCELLED`
6. `REFUNDING -> REFUNDING`
7. `REFUNDED -> 聚合查询 [PARTIAL_REFUND, FULL_REFUND]`
8. `DISPUTED -> 前端拒绝，显式报错`

本轮变更类型:

1. 前端方法: 修改
2. 后端 API: 不修�?3. SDK 生成契约: 不修�?
### 3.2 `orderService.getMyOrderList(params)`

方法:

```ts
getMyOrderList(params: TradePageRequest): Promise<TradePageResponse<Order>>
```

输入输出:

1. 输入�?`getOrderList` 完全一�?2. 输出�?`getOrderList` 完全一�?3. 通过复用 `getOrderList` 的状态查询计划获得修�?
本轮变更类型:

1. 前端方法: 间接修改
2. 后端 API: 不修�?
### 3.3 `orderService.getPendingPaymentOrders()`

方法:

```ts
getPendingPaymentOrders(): Promise<Order[]>
```

输入:

1. �?
输出:

1. 返回前端 `Order[]`
2. 实际通过 `getMyOrderList({ status: 'PENDING_PAYMENT' })` 获取
3. 本轮修复后会正确落到后端 `PENDING`

本轮变更类型:

1. 前端方法: 间接修改
2. 后端 API: 不修�?
### 3.4 `orderService.getInProgressOrders()`

方法:

```ts
getInProgressOrders(): Promise<Order[]>
```

输入:

1. �?
输出:

1. 返回前端 `Order[]`
2. 本轮修复后将通过聚合查询:
   - `PAID`
   - `DELIVERED`

本轮变更类型:

1. 前端方法: 间接修改
2. 后端 API: 不修�?
### 3.5 `orderService.getOrderStatistics()`

方法:

```ts
getOrderStatistics(): Promise<OrderStatistics>
```

前端输入:

1. �?
真实后端 API:

```ts
client.orders.getOrderStatistics(): Promise<PlusApiResultOrderStatisticsVO>
```

后端当前输出:

```ts
{
  totalOrders?: number
  pendingPayment?: number
  pendingShipment?: number
  pendingReceipt?: number
  completed?: number
  totalAmount?: string
}
```

本轮前端输出:

```ts
{
  totalOrders: number
  pendingPaymentOrders: number
  inProgressOrders: number
  completedOrders: number
  totalSpent: number
  monthSpent: number
}
```

本轮修复口径:

1. `pendingPaymentOrders = stats.pendingPayment`
2. `inProgressOrders`
   - 优先使用 `pendingShipment + pendingReceipt`
   - 若后端未填充，则前端派生:
     - `PAID.totalElements + DELIVERED.totalElements`
3. `completedOrders = stats.completed`
4. `totalSpent = stats.totalAmount`
5. `monthSpent`
   - app-api 当前无真实字�?   - 继续输出 `0`
   - 在文档中保留限制说明

本轮变更类型:

1. 前端方法: 修改
2. 后端 API: 不修�?3. 后端 controller: 本轮不改

### 3.6 `OrderList` 状态筛�?UI

组件:

```tsx
<OrderList />
```

前端输入:

1. `initialStatus?: OrderStatus`
2. 用户选择的筛选状�?
本轮输出语义:

1. 保留可被正确执行的状态筛�?2. `DISPUTED` 从筛选项移除
3. `IN_PROGRESS` / `REFUNDED` 保留，但改为前端聚合查询，不再假设后端直接支�?
本轮变更类型:

1. 前端组件: 修改
2. 后端 API: 不修�?
---

## 4. 实施方案

### 4.1 方案判定

是否新增后端 API: �? 
是否修改后端 API: �? 
是否修改前端服务实现: �? 
是否修改前端筛�?UI: �? 
是否修改上传方案: �?
上传标准保持不变:

1. `client.upload.getPresignedUrl`
2. 浏览器直�?S3 预签�?URL
3. `client.upload.registerPresigned`
4. 需要资产中心落库时�?`client.assetCenter.saveAsset`

### 4.2 修复路径

1. 先补失败测试，证明当前状态查询映射失�?2. 引入“前端状态查询计划”而不是字符串直传
3. 对聚合状态做多次 app-api 查询并在前端合并分页结果
4. 对统计接口做真实字段优先、聚合查询兜�?5. 删除 UI 中后端无对应 contract �?`DISPUTED` 直接筛选项
6. 同步修正 contract guard 样例中的状态值，避免继续使用伪状态样�?
---

## 5. 预期验证

1. `orderService.getOrderList({ status: 'PENDING_PAYMENT' })` 实际向后端发 `PENDING`
2. `orderService.getOrderList({ status: 'IN_PROGRESS' })` 会聚�?`PAID + DELIVERED`
3. `orderService.getOrderList({ status: 'REFUNDED' })` 会聚�?`PARTIAL_REFUND + FULL_REFUND`
4. `orderService.getOrderList({ status: 'DISPUTED' })` 会前端快速失�?5. `orderService.getOrderStatistics()` �?`pendingShipment/pendingReceipt` 缺失时，能从聚合查询推导 `inProgressOrders`

---

## 6. 实际修改文件

修改:

1. `packages/sdkwork-magic-studio-trade/src/services/orderService.ts`
2. `packages/sdkwork-magic-studio-trade/src/services/orderService.test.ts`
3. `packages/sdkwork-magic-studio-trade/src/services/orderService.contract-typecheck.ts`
4. `packages/sdkwork-magic-studio-trade/src/components/Order/OrderList.tsx`

新增:

1. `docs/review/2026-04-07-magic-studio-front-back-integration-round-49.md`

---

## 7. 实际验证结果

### 7.1 红灯验证

命令:

```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/orderService.test.ts
```

结果:

1. 初次执行失败
2. 失败点与根因一�?
   - `PENDING_PAYMENT` 被直接发给后�?   - `IN_PROGRESS` 被错误发�?`PENDING_SHIPMENT`
   - `REFUNDED` 被直接发给后�?   - `DISPUTED` 没有在前端被拒绝
   - `getOrderStatistics()` 在后端未填充 shipment 字段时得�?`0`

### 7.2 绿灯验证

命令:

```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/orderService.test.ts
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/orderService.test.ts src/services/paymentService.test.ts src/components/Payment/PaymentDialog.test.tsx
pnpm --filter @sdkwork/magic-studio-trade run typecheck
pnpm --filter @sdkwork/magic-studio-trade run typecheck:contract
pnpm run check:sdk-standard
pnpm typecheck
```

结果:

1. `orderService.test.ts` 通过，`11` 个测试全部通过
2. trade 关联回归通过，`3` 个测试文件、`23` 个测试全部通过
3. `@sdkwork/magic-studio-trade` `typecheck` 通过
4. `@sdkwork/magic-studio-trade` `typecheck:contract` 通过
5. `check:sdk-standard` 通过，`trade-standard` 通过
6. 工作�?`pnpm typecheck` 通过
7. `pnpm typecheck` 末尾仍有 turbo archive path warning，但退出码�?`0`

---

## 8. 当前阶段判断

到本轮为止，`trade` 模块在订单状态查询这一层已从“前端伪状态直传后端”修正为“前端展示状态映射真�?app-api 查询计划�?

1. `PENDING_PAYMENT` 已对齐后�?`PENDING`
2. `IN_PROGRESS` 已改为前端聚�?`PAID + DELIVERED`
3. `REFUNDED` 已改为前端聚�?`PARTIAL_REFUND + FULL_REFUND`
4. `DISPUTED` 已从 UI 过滤项移除，并在服务层显式拒�?5. `getOrderStatistics()` �?app-api 未填�?`pendingShipment/pendingReceipt` 时，已能派生真实进行中订单数

结论:

1. 本轮没有修改后端 API
2. 本轮完成的是前端对真�?app-api 状�?contract 的修正闭�?3. `trade` 的下一个高价值收口点仍是类型建模，不是状态查询契�?
---

## 9. 下一�?
本轮完成后，下一优先级建议继续收�?`trade` 的状�?类型双层建模:

1. 继续审计 `Order.type` 是否需要拆分为 `tradeType + businessType`
2. 审计 `OrderDetail` 是否需要把 `items[].productType` 引入为更细粒度展示依�?3. 若后端未来补�?`pendingShipment/pendingReceipt` 真值，再考虑删掉前端统计兜底逻辑

