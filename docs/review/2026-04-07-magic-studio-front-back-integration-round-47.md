# Magic Studio V2 前后端对接检查与修复 Round 47

日期: 2026-04-07  
范围: `apps/magic-studio-v2`  
目标: 修复前端订单状态模型缺�?`REFUNDING`，导致后端退款中状态被错误压缩成已退�? 
排除范围: `notes`

---

## 1. 本轮结论

本轮没有新增后端 API，也没有修改 `retired Spring app API authority` 或后端业�?service 的接口定义�?
本轮处理的是一个前端订单状态模型缺项问题，结论如下�?
1. 修改现有前端枚举: `packages/sdkwork-magic-studio-trade/src/entities/index.ts#OrderStatus`
2. 修改现有前端映射方法: `packages/sdkwork-magic-studio-trade/src/services/orderService.ts#mapOrderStatus`
3. 修改现有前端支付状态映�? `packages/sdkwork-magic-studio-trade/src/services/orderService.ts#mapPaymentStatus`
4. 修改现有前端展示层文案和状态展�?5. 不修�?app-api 和后端接口定�?
修复�?

1. 后端 `REFUNDING` 会保真映射为前端 `OrderStatus.REFUNDING`
2. 后端 `FULL_REFUND` / `PARTIAL_REFUND` / `REFUNDED` 才映射为前端 `OrderStatus.REFUNDED`
3. `Order.paymentStatus` 会跟随订单状态正确区�?`REFUNDING` �?`REFUNDED`

---

## 2. 问题列表与根�?
### P1. 后端存在 `REFUNDING`，但前端订单状态模型没有这个�?
问题位置:

1. `packages/sdkwork-magic-studio-trade/src/entities/index.ts`
2. `packages/sdkwork-magic-studio-trade/src/services/orderService.ts`

证据:

1. 后端订单枚举 `OrderStatus` 明确存在:
   - `REFUNDING`
   - `PARTIAL_REFUND`
   - `FULL_REFUND`
2. 后端退款申请逻辑 `applyRefund(...)` 会把订单状态设置为 `REFUNDING`
3. 前端 `OrderStatus` 枚举缺少 `REFUNDING`
4. 前端旧映射逻辑里所有包�?`REFUND` 的状态都会直接压�?`REFUNDED`

旧行�?

1. `REFUNDING -> REFUNDED`
2. `paymentStatus -> REFUNDED`

根因:

1. 前端订单状态模型不完整
2. 映射函数无法区分“退款中”和“已退款�?3. 文案层和 UI 层也缺少订单�?`refunding` 展示支持

影响:

1. 前后端状态不一�?2. UI 会把退款中误展示成已退�?3. 列表、详情和过滤器都无法准确表达真实退款阶�?
---

## 3. 本轮处理方法的输入与输出

### 3.1 订单详情映射入口

方法:

```ts
orderService.getOrderById(uuid: string): Promise<Order | null>
```

输入:

```ts
{
  uuid: string;
}
```

服务端真实对�?

```ts
client.orders.getOrderDetail(orderId)
```

### 3.2 本轮目标输出

当后端状态为 `REFUNDING` �?

```ts
{
  status: 'REFUNDING',
  paymentStatus: 'REFUNDING'
}
```

当后端状态为 `FULL_REFUND` / `PARTIAL_REFUND` / `REFUNDED` �?

```ts
{
  status: 'REFUNDED',
  paymentStatus: 'REFUNDED'
}
```

### 3.3 本轮变更类型

1. `OrderStatus` 枚举: 修改
2. `mapOrderStatus`: 修改
3. `mapPaymentStatus`: 修改
4. `useTradeI18n.orderStatusLabel`: 修改
5. `OrderCard` / `OrderDetail` / `OrderList`: 修改
6. app-api: 不修�?7. backend service: 不修�?
---

## 4. 实施方案

### 4.1 TDD 红灯

新增测试:

1. `preserves backend REFUNDING order status instead of collapsing it into REFUNDED`

红灯目标:

1. 证明旧实现会�?`REFUNDING` 压成 `REFUNDED`
2. 证明 `paymentStatus` 也被连带压错

### 4.2 最小生产修�?
修复�?

1. �?`OrderStatus` 增加 `REFUNDING`
2. �?`mapOrderStatus` 中优先识�?`REFUNDING`
3. 只把 `FULL_REFUND` / `PARTIAL_REFUND` / `REFUNDED` 映射�?`REFUNDED`
4. �?`mapPaymentStatus` 中增�?`OrderStatus.REFUNDING -> PaymentStatus.REFUNDING`
5. 为订单状态文案增�?`market.order.status.refunding`
6. 为订单卡片、详情和状态筛选增�?`REFUNDING` 支持

### 4.3 合同防漂�?
修改:

1. `packages/sdkwork-magic-studio-trade/src/services/orderService.contract-typecheck.ts`

新增:

1. `status: 'REFUNDING'` 的订单详情合�?sample

---

## 5. 修改文件

修改:

1. `packages/sdkwork-magic-studio-trade/src/entities/index.ts`
2. `packages/sdkwork-magic-studio-trade/src/services/orderService.ts`
3. `packages/sdkwork-magic-studio-trade/src/services/orderService.test.ts`
4. `packages/sdkwork-magic-studio-trade/src/services/orderService.contract-typecheck.ts`
5. `packages/sdkwork-magic-studio-trade/src/useTradeI18n.ts`
6. `packages/sdkwork-magic-studio-trade/src/components/Order/OrderCard.tsx`
7. `packages/sdkwork-magic-studio-trade/src/components/Order/OrderDetail.tsx`
8. `packages/sdkwork-magic-studio-trade/src/components/Order/OrderList.tsx`
9. `packages/sdkwork-magic-studio-i18n/src/locales/zh-CN/market.ts`
10. `packages/sdkwork-magic-studio-i18n/src/locales/en/market.ts`

新增:

1. `docs/review/2026-04-07-magic-studio-front-back-integration-round-47.md`

---

## 6. 验证结果

### 6.1 红灯验证

命令:

```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/orderService.test.ts
```

结果:

1. 旧实现下失败
2. 失败表现�?
   - `status: REFUNDED`
   - `paymentStatus: REFUNDED`
3. 这证明旧实现确实压平�?`REFUNDING`

### 6.2 绿灯验证

命令:

```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/orderService.test.ts
```

结果:

1. 通过
2. `4` 个测试通过
3. `0` 个失�?
---

## 7. 当前阶段判断

到本轮为止，`trade` 订单状态模型已经进一步与后端对齐�?
1. `REFUNDING` 不再被伪装成 `REFUNDED`
2. 订单状态与支付状态在退款阶段都能保真表�?3. 文案、图标和筛选器已经能展示真实退款中状�?
---

## 8. 下一步建�?
建议继续按同样方式审�?`trade` 剩余高价值点�?
1. 审计 `getOrderStatistics`
   - 确认 `pendingShipment/pendingReceipt` 统计字段是否稳定
2. 审计 `OrderType` 与后�?`orderType` 的映射覆盖率
3. 审计 `OrderList` / `OrderDetail` 是否需要为 `PARTIAL_REFUND` 提供更细粒度展示策略
