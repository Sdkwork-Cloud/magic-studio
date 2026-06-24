> Migrated from `docs/review/2026-04-06-magic-studio-front-back-integration-round-40.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 前后端对接检查与修复 Round 40

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：补�?`notifications` �?`trade` 两个远端业务包的 contract guard 闭环，确保它们继续稳定对�?`client.xxx -> @sdkwork/magic-studio-core -> retired generic app SDK -> retired Spring app API authority` 标准  
排除范围：`notes`

---

## 1. 本轮结论

本轮未新增或修改任何后端业务 API，也没有修改 `retired Spring app API authority` 的输入输出契约�?
本轮完成的是前端共享 SDK 消费边界的进一步收口：

1. `@sdkwork/magic-studio-notifications` 新增独立 `typecheck:contract`
2. `@sdkwork/magic-studio-trade` 新增独立 `typecheck:contract`
3. 两个包都新增了专�?`tsconfig.contract.json`
4. 两个包都新增了真�?app-api 类型守卫文件
5. 两个包的普�?`typecheck`、contract `typecheck` 和相关测试全部通过
6. 工作区级 `pnpm typecheck` �?`pnpm run check:sdk-standard` 均通过

结论�?
1. 当前 `magic-studio-v2` 在排�?`notes` 后，`notifications` �?`trade` 也已经纳入共�?SDK 契约守卫闭环
2. 本轮没有后端接口新增/修改，属于“前端包侧契约防漂移增强�?
---

## 2. 本轮问题列表与根�?
### P0. `notifications` 缺少独立 contract guard

现象�?
1. `notificationService.ts` 已通过 `getSdkworkClient().notification.*` 消费真实生成 SDK
2. 但包内没有：
   - `typecheck:contract`
   - `tsconfig.contract.json`
   - `notificationService.contract-typecheck.ts`

风险�?
1. `TestNotificationForm`、`PlusApiResultPageNotificationVO` 等真实类型一旦漂�?2. 当前包不会第一时间在编译阶段失�?3. 运行时可能在字段映射处才暴露问题

### P0. `trade` 缺少独立 contract guard

现象�?
1. `orderService.ts` �?`paymentService.ts` 已通过�?   - `client.orders.*`
   - `client.payments.*`
   - `client.account.*`
2. 但包内没有：
   - `typecheck:contract`
   - `tsconfig.contract.json`
   - `orderService.contract-typecheck.ts`
   - `paymentService.contract-typecheck.ts`

风险�?
1. `OrderCreateForm`、`OrderPayForm`、`RefundApplyForm`
2. `PlusApiResultOrderDetailVO`、`PlusApiResultPaymentStatusVO`
3. `CashRechargeForm`、`PlusApiResultCashRechargeVO`

这些真实生成 SDK 类型若变更，当前包不会在最短链路上�?guard 拦住�?
---

## 3. 本轮接口输入输出定义

说明�?
1. 以下全部为当前已对接且本轮通过 contract guard 固化的真�?app-api 输入输出
2. 本轮没有修改这些接口，只是把它们纳入自动化静态守�?
### 3.1 Notification 模块

#### `client.notification.listNotifications`

输入：`QueryParams`

```ts
{
  page?: number
  pageNo?: number
  pageIndex?: number
  size?: number
  pageSize?: number
}
```

输出：`PlusApiResultPageNotificationVO`

```ts
{
  code: string
  msg: string
  requestId: string
  errorName: string
  data: {
    content?: NotificationVO[]
    number?: number
    size?: number
    totalElements?: number
    totalPages?: number
    total?: number
  }
}
```

#### `client.notification.sendTest`

输入：`TestNotificationForm`

```ts
{
  title: string
  content: string
  type?: string
  deviceId?: string
}
```

输出：`PlusApiResultVoid`

#### `client.notification.markAsRead`

输入：`notificationId`

输出：`PlusApiResultNotificationVO`

```ts
{
  code: string
  msg: string
  requestId: string
  errorName: string
  data: {
    notificationId?: string
    title?: string
    content?: string
    type?: string
    isRead?: boolean
  }
}
```

#### `client.notification.markAllAsRead`

输入：`QueryParams | void`

输出：`PlusApiResultVoid`

#### `client.notification.getUnreadCount`

输入：无

输出：`PlusApiResultMapStringInteger`

```ts
{
  code: string
  msg: string
  requestId: string
  errorName: string
  data: Record<string, number>
}
```

#### `client.notification.deleteNotification`

输入：`notificationId`

输出：`PlusApiResultVoid`

### 3.2 Trade Order 模块

#### `client.orders.createOrder`

输入：`OrderCreateForm`

```ts
{
  orderType: string
  productId?: string
  quantity?: number
  items?: Array<{
    productId?: string
    skuId?: string
    quantity?: number
    price?: string
    productName?: string
    contentType?: string
    contentId?: string
  }>
  addressId?: string
  paymentMethod?: string
  couponId?: string
  remark?: string
  sourceChannel?: string
  rechargePoints?: number
  orderPayloadValid?: boolean
}
```

输出：`PlusApiResultOrderVO`

#### `client.orders.listOrders`

输入：`QueryParams`

输出：`PlusApiResultPageOrderVO`

```ts
{
  code: string
  msg: string
  requestId: string
  errorName: string
  data: {
    content?: OrderVO[]
    number?: number
    size?: number
    totalElements?: number
    totalPages?: number
  }
}
```

#### `client.orders.getOrderDetail`

输入：`orderId`

输出：`PlusApiResultOrderDetailVO`

#### `client.orders.pay`

输入：`orderId + OrderPayForm`

```ts
{
  orderId?: string
  paymentMethod?: string
  amount?: string
  paymentPassword?: string
  clientIp?: string
}
```

输出：`PlusApiResultPaymentParamsVO`

#### `client.orders.applyRefund`

输入：`orderId + RefundApplyForm`

```ts
{
  orderId?: string
  refundAmount?: string
  refundReason?: string
  reason?: string
  refundType?: string
  proofImage?: string
}
```

输出：`PlusApiResultVoid`

#### `client.orders.cancel`

输入：`orderId + OrderCancelForm`

```ts
{
  orderId?: string
  cancelReason?: string
  reason?: string
  cancelType?: string
}
```

输出：`PlusApiResultVoid`

#### `client.orders.confirmReceipt`

输入：`orderId`

输出：`PlusApiResultVoid`

#### `client.orders.deleteOrder`

输入：`orderId`

输出：`PlusApiResultVoid`

#### `client.orders.getOrderStatistics`

输入：无

输出：`PlusApiResultOrderStatisticsVO`

### 3.3 Trade Payment / Account 模块

#### `client.payments.getPaymentDetail`

输入：`paymentId`

输出：`PlusApiResultPaymentStatusVO`

#### `client.payments.getPaymentStatus`

输入：`paymentId`

输出：`PlusApiResultPaymentStatusVO`

#### `client.payments.getPaymentStatusByOutTradeNo`

输入：`outTradeNo`

输出：`PlusApiResultPaymentStatusVO`

#### `client.payments.listPaymentRecords`

输入：`QueryParams`

输出：`PlusApiResultPagePaymentStatusVO`

#### `client.account.createRechargeCash`

输入：`CashRechargeForm`

```ts
{
  amount: number
  paymentMethod?: string
  remarks?: string
  couponId?: string
}
```

输出：`PlusApiResultCashRechargeVO`

#### `client.account.getCash`

输入：无

输出：`PlusApiResultCashAccountInfoVO`

#### `client.account.getPoints`

输入：无

输出：`PlusApiResultPointsAccountInfoVO`

#### `client.account.getHistoryCash`

输入：`QueryParams`

输出：`PlusApiResultPageHistoryVO`

---

## 4. 本轮实施方案与修改项

### 4.1 方案判定

是否新增后端 API：否  
是否修改后端 API：否  
是否修改前端业务调用方式：否  
是否修改上传标准：否

本轮动作是：

1. 为已存在的真实前后端对接能力补静态契约守�?2. 不改业务路径，只增强防漂移能�?
### 4.2 修改文件

#### 新增

1. `packages/sdkwork-magic-studio-notifications/tsconfig.contract.json`
2. `packages/sdkwork-magic-studio-notifications/src/services/notificationService.contract-typecheck.ts`
3. `packages/sdkwork-magic-studio-trade/tsconfig.contract.json`
4. `packages/sdkwork-magic-studio-trade/src/services/orderService.contract-typecheck.ts`
5. `packages/sdkwork-magic-studio-trade/src/services/paymentService.contract-typecheck.ts`
6. `packages/sdkwork-magic-studio-trade/src/services/orderService.test.ts`

#### 修改

1. `packages/sdkwork-magic-studio-notifications/package.json`
2. `packages/sdkwork-magic-studio-notifications/tsconfig.json`
3. `packages/sdkwork-magic-studio-notifications/tests/notificationService.test.ts`
4. `packages/sdkwork-magic-studio-trade/package.json`
5. `packages/sdkwork-magic-studio-trade/tsconfig.json`
6. `packages/sdkwork-magic-studio-trade/src/services/paymentService.test.ts`

---

## 5. 上传链路说明

本轮没有改动上传能力，上传标准继续保持：

1. `client.upload.getPresignedUrl`
2. 浏览器直传预签名 URL
3. `client.upload.registerPresigned`
4. 需要资产中心落库时再走 `client.assetCenter.saveAsset`

结论�?
1. 本轮 `notifications` / `trade` 守卫补齐不影�?S3 预签�?URL 上传链路

---

## 6. 验证结果

### 6.1 红灯验证

命令�?
```bash
pnpm exec vitest run \
  packages/sdkwork-magic-studio-notifications/tests/notificationService.test.ts \
  packages/sdkwork-magic-studio-trade/src/services/paymentService.test.ts \
  packages/sdkwork-magic-studio-trade/src/services/orderService.test.ts
```

结果�?
1. 初次执行失败
2. 失败原因为：
   - `notificationService.contract-typecheck.ts` 缺失
   - `packages/sdkwork-magic-studio-notifications/tsconfig.contract.json` 缺失
   - `orderService.contract-typecheck.ts` 缺失
   - `paymentService.contract-typecheck.ts` 缺失
   - `packages/sdkwork-magic-studio-trade/tsconfig.contract.json` 缺失

### 6.2 绿灯回归

命令�?
```bash
pnpm exec vitest run \
  packages/sdkwork-magic-studio-notifications/tests \
  packages/sdkwork-magic-studio-trade/src/services/paymentService.test.ts \
  packages/sdkwork-magic-studio-trade/src/services/orderService.test.ts
```

结果�?
1. `4` 个测试文件通过
2. `10` 个测试通过
3. `0` 失败

### 6.3 包级类型检�?
命令�?
```bash
pnpm --filter @sdkwork/magic-studio-notifications run typecheck
pnpm --filter @sdkwork/magic-studio-notifications run typecheck:contract
pnpm --filter @sdkwork/magic-studio-trade run typecheck
pnpm --filter @sdkwork/magic-studio-trade run typecheck:contract
```

结果�?
1. 全部通过
2. 期间发现一次真实类型偏差：
   - `OrderDetailVO.items` 样例使用了不存在字段 `price`
3. 已按真实 `OrderItemVO` 定义修正为：
   - `unitPrice`
   - `totalAmount`

### 6.4 工作区级验证

命令�?
```bash
pnpm typecheck
pnpm run check:sdk-standard
```

结果�?
1. `pnpm typecheck` 通过
2. `check:sdk-standard` 通过
3. `sdk-compliance` 严格模式�?   - 扫描文件 `1892`
   - `0` 违规
4. `notification-standard` 通过
5. `trade-standard` 通过

---

## 7. 当前阶段判断

到本轮为止，排除 `notes` 后，`magic-studio-v2` 当前已纳�?contract guard 的远端业务包包括�?
1. 媒体域：
   - `assets`
   - `audio`
   - `character`
   - `film`
   - `image`
   - `music`
   - `portal-video`
   - `sfx`
   - `video`
   - `voicespeaker`
2. 非媒体域�?   - `auth`
   - `drive`
   - `notifications`
   - `prompt`
   - `settings`
   - `skills`
   - `trade`
   - `user`
   - `vip`
   - `workspace`

结论�?
1. 当前应用主链路的共享 SDK 契约守卫覆盖面继续扩�?2. 本轮没有发现新的业务 HTTP 旁路
3. 本轮没有发现新的后端 API 契约漂移

---

## 8. 下一步建�?
若继续推进本应用，建议按优先级继续：

1. �?`trade` 增补更深的行为级测试�?   - `createOrder`
   - `updateOrderStatus`
   - `requestRefund`
   - `getTransactionList`
2. �?`notifications` 增补更多业务级测试：
   - `markAsRead`
   - `markAllAsRead`
   - `deleteAll`
   - `getUnreadCount` 多形态响应解�?3. 若恢复范围外治理，再处理 `notes`

本轮可作�?`magic-studio-v2` 当前前后端对接与 contract guard 状态的最新基线�?
