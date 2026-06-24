> Migrated from `docs/review/2026-04-06-magic-studio-front-back-integration-round-44.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 前后端对接检查与修复 Round 44

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：修�?`trade` 模块 `orderService.updateOrderStatus` 中把 `PAID` 当成可直接更新状态的伪语义问题�? 
排除范围：`notes`

---

## 1. 本轮结论

本轮没有新增后端 API，也没有修改 `retired Spring app API authority` 的接口定义�?
本轮处理的是一个前端服务层语义错误，类型明确如下：

1. 修改现有前端方法：`packages/sdkwork-magic-studio-trade/src/services/orderService.ts#updateOrderStatus`
2. 不新增前端业务方�?3. 不修改后�?Controller / Service
4. 不修�?OpenAPI / 生成 SDK

修复后，`updateOrderStatus(orderId, OrderStatus.PAID)` 不再伪装成“可以直接把订单改成已支付”的状态更新，而是明确拒绝这种错误调用�?
---

## 2. 问题列表与根�?
### P1. `updateOrderStatus(..., PAID)` 把“发起支付”误当成“订单已支付�?
问题位置�?
1. `packages/sdkwork-magic-studio-trade/src/services/orderService.ts`

问题现象�?
1. 旧实现收�?`status === PAID` 时会调用�?
```ts
client.orders.pay(orderId, { paymentMethod: 'ALIPAY' })
```

2. 紧接着又调�?`getOrderById(orderId)`，并返回一�?`Order`
3. 从接口语义上看，这像是在执行“订单状态更新为已支付�?4. 但后端真实接�?`POST /orders/{orderId}/pay` 只是创建支付参数，返回的�?`PaymentParamsVO`
5. 这个动作并不会直接把订单状态改�?`PAID`

根因�?
1. 前端把“发起支付”与“支付完成”这两个不同阶段混成了一个状态跃�?2. `updateOrderStatus` 这个通用状态分发器�?`PAID` 也纳入了可执行动�?3. �?app-api 中真正的 `PAID` 是支付回�?支付结果落库后的事实状态，不是客户端可以直接设置的命令

影响�?
1. 调用方会误以�?`updateOrderStatus(orderId, PAID)` 是合法业务动�?2. 真实运行时会走错接口语义
3. 旧实现甚至会因为支付接口返回的不是订单详情而在后续读取流程中抛出无意义错误

---

## 3. 本轮处理方法的输入与输出

说明�?
1. 本轮只处理一个方法：`orderService.updateOrderStatus`
2. 本轮是“修改现有方法”，不是“新增方法�?
### 3.1 前端入口输入

方法�?
`orderService.updateOrderStatus(uuid: string, status: OrderStatus)`

输入�?
```ts
{
  uuid: string;
  status:
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'REFUNDED'
    | 'DISPUTED';
}
```

### 3.2 本轮确认的真实后端动作映�?
当前真实可映射动作：

1. `CANCELLED -> client.orders.cancel(orderId, { reason })`
2. `COMPLETED -> client.orders.confirmReceipt(orderId)`
3. `REFUNDED -> client.orders.applyRefund(orderId, { reason })`

当前不应被视为直接状态更新动作：

1. `PAID`

原因�?
```ts
client.orders.pay(orderId, body)
```

真实输出是：

```ts
{
  orderId?: string;
  paymentId?: string;
  outTradeNo?: string;
  amount?: string;
  paymentMethod?: string;
  paymentParams?: Record<string, unknown>;
}
```

这属于“发起支付并拿支付参数”，而不是“订单状态已变为 PAID”�?
### 3.3 本轮修复后的输出

当输入为 `PAID` 时：

```ts
throw new Error(
  'Direct PAID status transition is not supported; use initiatePayment and wait for payment callback'
)
```

当输入为以下状态时，输出仍保持为：

```ts
Promise<Order>
```

适用状态：

1. `CANCELLED`
2. `COMPLETED`
3. `REFUNDED`

---

## 4. 根因确认过程

### 4.1 app-sdk 合同确认

确认结果�?
1. `client.orders.pay(orderId, body)` 的生�?SDK 返回类型�?`PlusApiResultPaymentParamsVO`
2. 这说明它的职责是“返回支付参数�?3. 它并不是“修改订单状态并返回订单详情”的接口

### 4.2 app-api 控制器确�?
确认结果�?
1. `OrderAppApiController.payOrder(...)` 内部调用的是支付创建逻辑
2. 返回值是 `PaymentParamsVO`
3. 真实 `PAID` 只能在支付完成后由支付结果驱动，不是前端直接设置

### 4.3 旧实现问题确�?
确认结果�?
1. 旧实现确实把 `PAID` 当成�?`updateOrderStatus` 的一个动作分�?2. 红灯测试也证明这条路径会走错语义并导致错�?
最终结论：

这不是“少传一个字段”或“拿错一个返回值”的小问题，而是动作语义本身错误。正确修复是�?
1. 明确禁止 `PAID` 作为直接状态更新动�?2. 让调用方改走真实支付链路�?   - `paymentService.initiatePayment(...)`
   - 等待支付回调 / 状态刷�?
---

## 5. 实施方案

### 5.1 TDD 红灯

新增失败用例位置�?
1. `packages/sdkwork-magic-studio-trade/src/services/orderService.test.ts`

红灯覆盖点：

1. `updateOrderStatus(orderId, PAID)` 应直接失�?2. 不能调用 `client.orders.pay(...)`
3. 不能继续调用 `getOrderDetail(...)`

红灯结果�?
1. 测试失败
2. 旧实现实际报错不是语义化错误，而是读取支付后续结果时出现的运行时错�?3. 证明旧实现确实存在伪状态更新问�?
### 5.2 最小生产修�?
修复点一：`packages/sdkwork-magic-studio-trade/src/services/orderService.ts`

1. �?`updateOrderStatus` 中提前拦�?`OrderStatus.PAID`
2. 抛出明确错误�?
```ts
Direct PAID status transition is not supported; use initiatePayment and wait for payment callback
```

3. 删除原本错误�?`client.orders.pay(...)` 分支

修复点二：清理死代码

1. `toSdkPaymentMethod` 在移�?`PAID` 分支后变成未使用函数
2. 一并删除，恢复类型检查通过

---

## 6. 修改文件

修改�?
1. `packages/sdkwork-magic-studio-trade/src/services/orderService.ts`
2. `packages/sdkwork-magic-studio-trade/src/services/orderService.test.ts`

新增�?
1. `docs/review/2026-04-06-magic-studio-front-back-integration-round-44.md`

---

## 7. 验证结果

### 7.1 红灯验证

命令�?
```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/orderService.test.ts
```

结果�?
1. 失败
2. 失败原因为旧实现会错误进入支付分支，并在后续读取流程中抛出运行时错误

### 7.2 绿灯验证

命令�?
```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/orderService.test.ts
```

结果�?
1. 通过
2. `2` 个测试通过
3. `0` 失败

---

## 8. 当前阶段判断

到本轮为止，`trade` 订单动作语义已经进一步收口：

1. `PAID` 不再被当成可直接设置的订单状�?2. 前端服务不再伪装一个后端根本没有提供的状态更新动�?3. 调用语义已与真实 app-api 对齐

---

## 9. 下一步建�?
建议继续按同样方式推�?`trade` 的剩余高价值点�?
1. 审计 `requestRefund`
   - 确认退款原因、退款金额、退款后状态映射是否完�?2. 审计 `updateOrderStatus` 其余分支
   - 例如 `COMPLETED -> confirmReceipt` 是否还需要前置状态防�?3. 审计订单详情到前�?`Order` 实体的状�?退款字段映�?
