> Migrated from `docs/review/2026-04-06-magic-studio-front-back-integration-round-46.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 前后端对接检查与修复 Round 46

日期: 2026-04-06  
范围: `apps/magic-studio-v2`  
目标: 修复 `trade/orderService.updateOrderStatus` 把“发起退款申请”伪装成“订单已退款”的状态跳转问�? 
排除范围: `notes`

---

## 1. 本轮结论

本轮没有新增后端 API，也没有修改 `retired Spring app API authority` 或后端业�?service 的接口定义�?
本轮处理的是一个前�?service 语义错配问题，结论如下：

1. 修改现有方法: `packages/sdkwork-magic-studio-trade/src/services/orderService.ts#updateOrderStatus`
2. 不新增前端业务方�?3. 不修�?app-api `client.orders.applyRefund(...)` 合同
4. 不修改后�?`OrderAppApiController.applyRefund(...)`
5. 不修改后�?`PlusOrderService.applyRefund(...)`

修复�?

1. `PAID` 不能作为直接状态跳�?2. `REFUNDED` 也不能作为直接状态跳�?3. 发起退款申请必须走 `paymentService.requestRefund(...)`

---

## 2. 问题列表与根�?
### P1. `updateOrderStatus(..., REFUNDED)` 把“退款申请”误当成“已退款状态更新�?
问题位置:

1. `packages/sdkwork-magic-studio-trade/src/services/orderService.ts`

问题现象:

1. 旧实现收�?`status === REFUNDED` 时会调用:

```ts
client.orders.applyRefund(orderId, { reason: 'manual_refund' })
```

2. 紧接着又调�?`getOrderById(orderId)` 试图读取一个“已退款”的订单详情
3. 但后端真实接�?`POST /orders/{orderId}/refund` 的职责只是“提交退款申请�?4. 后端业务�?`applyRefund(orderId, userId, reason)` 实际会先把订单状态切�?`REFUNDING`
5. 因此前端把“发起退款申请”错误伪装成了“订单已退款�?
根因:

1. `updateOrderStatus` �?`REFUNDED` 误纳入了可直接触发的命令式状态迁�?2. 退款申请动作和退款完成事实被混在了同一个前端状态入口里
3. 后端并没有提供“直接将订单改为 REFUNDED�?的接�?
影响:

1. 调用方会误以�?`updateOrderStatus(orderId, REFUNDED)` 是合法动�?2. 真实运行时会走错接口语义
3. 退款链路会继续出现“前端假装后端已实现”的状态跳转问�?
---

## 3. 本轮处理方法的输入与输出

### 3.1 前端入口方法

方法:

```ts
orderService.updateOrderStatus(uuid: string, status: OrderStatus): Promise<Order>
```

输入:

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

### 3.2 本轮确认的真实服务端动作映射

可映射的真实动作:

1. `CANCELLED -> client.orders.cancel(orderId, { reason })`
2. `COMPLETED -> client.orders.confirmReceipt(orderId)`

不应再作为直接状态跳转的动作:

1. `PAID`
2. `REFUNDED`

原因:

1. `client.orders.pay(...)` 返回的是支付参数，不是订单已支付
2. `client.orders.applyRefund(...)` 提交的是退款申请，不是订单已退�?
### 3.3 修复后的输出

当输入为 `REFUNDED` �?

```ts
throw new Error(
  'Direct REFUNDED status transition is not supported; use paymentService.requestRefund and wait for refund workflow updates'
)
```

保留仍可执行的输�?

1. `CANCELLED -> Promise<Order>`
2. `COMPLETED -> Promise<Order>`

### 3.4 本轮变更类型

1. `orderService.updateOrderStatus`: 修改
2. `orderService.test`: 修改
3. app-api: 不修�?4. backend service: 不修�?
---

## 4. 实施方案

### 4.1 TDD 红灯

新增测试:

1. `rejects REFUNDED as a direct status transition because app-api applyRefund only creates a refund request`

红灯目标:

1. 证明旧实现会错误�?`REFUNDED` 当成可直接跳转状�?2. 证明旧实现会错误调用 `client.orders.applyRefund(...)`

### 4.2 最小生产修�?
修改文件:

1. `packages/sdkwork-magic-studio-trade/src/services/orderService.ts`

修复�?

1. �?`status === REFUNDED` 时提前抛�?2. 删除旧的 `client.orders.applyRefund(...)` 分支
3. 强制退款申请回�?`paymentService.requestRefund(...)` 入口

---

## 5. 修改文件

修改:

1. `packages/sdkwork-magic-studio-trade/src/services/orderService.ts`
2. `packages/sdkwork-magic-studio-trade/src/services/orderService.test.ts`

新增:

1. `docs/review/2026-04-06-magic-studio-front-back-integration-round-46.md`

---

## 6. 验证结果

### 6.1 红灯验证

命令:

```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/orderService.test.ts
```

结果:

1. 旧实现下失败
2. 失败原因是旧逻辑试图进入 `applyRefund -> getOrderById` 的错误链�?
### 6.2 绿灯验证

命令:

```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/orderService.test.ts
```

结果:

1. 通过
2. `3` 个测试通过
3. `0` 个失�?
---

## 7. 当前阶段判断

到本轮为止，`trade/orderService.updateOrderStatus` 的假状态跳转已经进一步收口：

1. `PAID` 已经被禁�?2. `REFUNDED` 也已经被禁止
3. 订单状�?service 不再伪装支付和退款两个异步业务流�?
---

## 8. 下一步建�?
建议继续按同样方式审�?`trade` 剩余高价值点�?
1. 审计 `mapOrderStatus`
   - 确认 `REFUNDING` 被映射到 `REFUNDED` 是否满足当前产品语义
2. 审计 `getOrderStatistics`
   - 确认 `pendingShipment/pendingReceipt` 统计字段�?app-api 返回字段是否稳定一�?3. 审计 `getOrderList`
   - 确认列表请求字段 `startDate/endDate/pageNo/size` 与后�?contract 完全对齐

