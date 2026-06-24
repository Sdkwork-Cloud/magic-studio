> Migrated from `docs/review/2026-04-06-magic-studio-front-back-integration-round-45.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 前后端对接检查与修复 Round 45

日期: 2026-04-06  
范围: `apps/magic-studio-v2`  
目标: 修复 `trade/paymentService.requestRefund` 把“部分退款”伪装成已支持能力的问题  
排除范围: `notes`

---

## 1. 本轮结论

本轮没有新增后端 API，也没有修改 `retired Spring app API authority` 或后端业�?service 的接口定义�?
本轮处理的是一个前�?service 语义错配问题，结论如下：

1. 修改现有方法: `packages/sdkwork-magic-studio-trade/src/services/paymentService.ts#requestRefund`
2. 不新增前端业务方�?3. 不修�?app-api `client.orders.applyRefund(...)` 合同
4. 不修改后�?`OrderAppApiController.applyRefund(...)`
5. 不修改后�?`PlusOrderService.applyRefund(...)`

修复后，前端只允许“整单退款申请”语义：

1. `amount` 为空: 允许
2. `amount === existing.amount`: 允许
3. `amount !== existing.amount`: 直接拒绝，不再伪造部分退款成�?
---

## 2. 问题列表与根�?
### P1. `requestRefund` 对外暴露了后端当前并不支持的“部分退款金额”能�?
问题位置:

1. `packages/sdkwork-magic-studio-trade/src/services/paymentService.ts`

问题现象:

1. 前端入口参数定义�?

```ts
interface RefundParams {
  paymentUuid: string;
  amount?: number;
  reason: string;
}
```

2. 旧实现会调用:

```ts
client.orders.applyRefund(existing.orderUuid, {
  reason: normalizeText(params.reason) || 'user_refund_request',
})
```

3. 该接口并不会�?`amount` 传给后端
4. 但旧实现又会�?fallback 返回值里伪�?

```ts
refundAmount: params.amount || existing.amount
```

5. 这会让调用方误以为“部分退款金额已被成功提交�?
根因确认:

1. app-api `RefundApplyForm` 虽然存在 `refundAmount` 字段，但当前 controller 没有传递该字段到业务层
2. `OrderAppApiController.applyRefund(orderId, form)` 实际只调�?

```java
orderService.applyRefund(orderId, userId, form.getReason());
```

3. 后端 `PlusOrderService.applyRefund(Long orderId, Long userId, String reason)` 不接受退款金�?4. 后端实现只会把订单设置为:
   - `status = REFUNDING`
   - `refundStatus = PENDING`
5. 当前真实能力是“整单退款申请”，不是“指定金额退款申请�?
影响:

1. 前端和后端能力模型不一�?2. 调用方可能错误构建“部分退款”产品流�?3. fallback payment 会制造错误的 `refundAmount`
4. 这类错误会进一步污�?UI、日志和后续状态判�?
---

## 3. 本轮处理方法的输入与输出

### 3.1 前端入口方法

方法:

```ts
paymentService.requestRefund(params: RefundParams): Promise<Payment>
```

输入:

```ts
{
  paymentUuid: string;
  amount?: number;
  reason: string;
}
```

### 3.2 本轮确认的真实服务端对接 API

方法:

```ts
client.orders.applyRefund(orderUuid, {
  reason: string,
})
```

输入:

```ts
{
  path: {
    orderUuid: string;
  };
  body: {
    reason: string;
  };
}
```

输出:

```ts
PlusApiResultVoid
```

真实语义:

1. 提交退款申�?2. 不返回退款金�?3. 不支持指定部分退款金�?4. 退款状态的真实落库由后端负�?
### 3.3 修复后的前端输出

�?`amount` 缺省或等于整单金额时:

```ts
Promise<Payment>
```

�?`amount` 与整单金额不一致时:

```ts
throw new Error('App SDK refund currently supports full-order refunds only')
```

fallback `Payment` 输出语义:

```ts
{
  ...existing,
  status: 'REFUNDING',
  refundAmount: existing.amount,
  refundReason?: string,
}
```

说明:

1. fallback 只允许回填整单金�?2. 不再�?`params.amount` 当作已生效金�?
### 3.4 本轮变更类型

1. `paymentService.requestRefund`: 修改
2. `paymentService.contract-typecheck`: 修改
3. `paymentService.test`: 修改
4. app-api: 不修�?5. backend service: 不修�?
---

## 4. 实施方案

### 4.1 TDD 红灯

新增测试:

1. `rejects partial refund amounts before calling client.orders.applyRefund`
2. `routes full refund requests through client.orders.applyRefund and preserves full refund fallback state`

红灯目标:

1. 证明旧实现会错误接受部分退款金�?2. 证明旧实现会伪�?`refundAmount = params.amount`

### 4.2 最小生产修�?
修改文件:

1. `packages/sdkwork-magic-studio-trade/src/services/paymentService.ts`

修复�?

1. 在调�?`client.orders.applyRefund(...)` 之前校验 `params.amount`
2. �?`params.amount` 存在且不等于整单金额，则直接抛错
3. fallback payment �?`refundAmount` 固定�?`existing.amount`
4. 保持真实后端调用不变，仍然只发�?`reason`

### 4.3 合同防漂�?
修改文件:

1. `packages/sdkwork-magic-studio-trade/src/services/paymentService.contract-typecheck.ts`

新增约束:

1. �?`RefundApplyForm` 增加 typecheck sample
2. 锁定当前 app-api 生成类型中的退款申请表单字�?
---

## 5. 修改文件

修改:

1. `packages/sdkwork-magic-studio-trade/src/services/paymentService.ts`
2. `packages/sdkwork-magic-studio-trade/src/services/paymentService.test.ts`
3. `packages/sdkwork-magic-studio-trade/src/services/paymentService.contract-typecheck.ts`

新增:

1. `docs/review/2026-04-06-magic-studio-front-back-integration-round-45.md`

---

## 6. 验证结果

### 6.1 红灯验证

命令:

```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/paymentService.test.ts
```

结果:

1. 旧实现下失败
2. 失败原因是部分退款请求被错误接受，Promise 被解析而不是拒�?
### 6.2 绿灯验证

命令:

```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/paymentService.test.ts
```

结果:

1. 通过
2. `11` 个测试通过
3. `0` 个失�?
---

## 7. 当前阶段判断

到本轮为止，`trade` 模块的退款申请语义已经进一步收口：

1. 前端不再制造后端当前没有实现的“部分退款”假能力
2. `client.orders.applyRefund(...)` 的真实语义与前端 service 已对�?3. fallback payment 不再回填错误的退款金�?
---

## 8. 下一步建�?
建议继续按同样方式审�?`trade` 余下高价值点�?
1. 审计 `paymentService.getPaymentById`
   - 确认多候选查询顺序是否存在误判和状态覆�?2. 审计 `paymentService.getPaymentList`
   - 确认列表分页字段和后�?page contract 是否完全一�?3. 审计 `orderService` 剩余状态分�?   - 继续剔除任何“前端伪装后端能力”的假动�?
