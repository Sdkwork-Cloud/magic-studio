# Magic Studio V2 前后端对接检查与修复 Round 42

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：修�?`trade` 支付弹窗�?`retired Spring app API authority` 真实合同不一致的问题，收敛前端假能力，确保订单支付只走当前服务端真实支持的方�? 
排除范围：`notes`

---

## 1. 本轮结论

本轮没有新增或修改任何后�?API，也没有修改 `retired Spring app API authority` 的接口定义�?
本轮修复的是一个前后端合同错配问题�?
1. `PaymentDialog` 暴露�?`BALANCE / POINTS / CREDIT_CARD` 等前端支付方�?2. 同时还暴露了 `useBalance / usePoints` 勾选项
3. �?`client.orders.pay -> OrderPayForm -> OrderAppApiController.payOrder -> PlusPaymentService.createPayment`
4. 当前真实只支持按第三�?`provider` 创建支付�?5. 并不支持余额/积分混合支付，也不消�?`useBalance / usePoints`

因此旧实现会造成两类问题�?
1. 用户看到并选择了服务端根本不支持的支付方式
2. 用户勾选余�?积分抵扣，但这些输入不会进入真实后端支付能力

本轮通过 TDD 对前端做了合同守卫和 UI 收敛，消除了这条支付链路里的假能力�?
---

## 2. 问题列表与根�?
### P0. `PaymentDialog` 暴露了后端不支持的订单支付方�?
问题位置�?
1. `packages/sdkwork-magic-studio-trade/src/components/Payment/PaymentDialog.tsx`
2. `packages/sdkwork-magic-studio-trade/src/services/paymentService.ts`

问题现象�?
1. 支付弹窗会展示：
   - `ALIPAY`
   - `WECHAT_PAY`
   - `CREDIT_CARD`
   - `BALANCE`
   - `POINTS`
2. 还会展示�?   - `market.payment.use_balance`
   - `market.payment.use_points`
3. 但当�?app-api 真实支付方法列表来自 `PaymentConverter.buildPaymentMethods(clientType)`，只包含�?   - `WECHAT_PAY`
   - `ALIPAY`
   - `UNION_PAY`
4. 订单支付真实入口 `OrderAppApiController.payOrder` 只会�?`paymentMethod` 解析�?`PaymentProvider`
5. `PlusPaymentServiceImpl.createPayment` 只支持第三方通道建单，不支持余额/积分扣减

根因�?
1. `trade` 包本地定义了比后端合同更宽的 `PaymentMethod`
2. `PaymentDialog` 直接把这些本地枚举当成真实可支付能力暴露给用�?3. `paymentService.initiatePayment` 也没有在调用 `client.orders.pay` 前做合同守卫

---

## 3. 本轮接口输入输出说明

说明�?
1. 本轮没有变更后端 I/O
2. 本轮处理的是前端对真实后�?I/O 的收�?
### 3.1 `paymentService.initiatePayment`

当前前端输入�?
```ts
{
  orderUuid: string;
  method: PaymentMethod;
  useBalance?: number;
  usePoints?: number;
}
```

当前真实后端接受�?
```ts
client.orders.pay(orderId, {
  orderId?: string;
  paymentMethod?: string;
  amount?: string;
  paymentPassword?: string;
  clientIp?: string;
})
```

当前真实输出�?
```ts
{
  success: boolean;
  payment?: Payment;
  errorMessage?: string;
  redirectUrl?: string;
  transactionId?: string;
}
```

本轮约束结论�?
1. `method` 只允许前后端当前交集�?   - `ALIPAY`
   - `WECHAT_PAY`
2. `useBalance / usePoints` 当前不属于真实订单支付合�?
### 3.2 `PaymentDialog`

输入�?
```ts
{
  order: Order;
  onClose: () => void;
  onSuccess?: () => void;
}
```

输出�?
1. 渲染支付弹窗 UI
2. 用户点击确认后调�?`paymentService.initiatePayment`

本轮约束结论�?
1. 只展示当前真实支持的订单支付方式
2. 不再展示会误导用户的余额/积分抵扣入口

---

## 4. 根因确认过程

### 4.1 前端链路确认

检查结果：

1. `PaymentDialog` 会把 `selectedMethod / useBalance / usePoints` 传给 `paymentService.initiatePayment`
2. `paymentService.initiatePayment` 实际只调用：

```ts
client.orders.pay(orderUuid, {
  orderId: orderUuid,
  paymentMethod: toSdkPaymentMethod(params.method),
})
```

3. `useBalance / usePoints` 只会落到本地 fallback `metadata`
4. 不会真正进入后端支付能力

### 4.2 app-api 合同确认

检查结果：

1. `OrderPayForm` 只有�?   - `orderId`
   - `paymentMethod`
   - `amount`
   - `paymentPassword`
   - `clientIp`
2. `OrderAppApiController.payOrder` 当前并不消费 `amount`
3. 也没有余�?积分混付字段

### 4.3 服务端能力确�?
检查结果：

1. `PaymentConverter.buildPaymentMethods` 当前只构建：
   - `WECHAT_PAY`
   - `ALIPAY`
   - `UNION_PAY`
2. `PlusPaymentServiceImpl.createPayment` 是典型第三方支付通道建单逻辑
3. 没有余额支付、积分支付或混合支付实现

最终结论：

1. 这是前端假能力问�?2. 不是“只差一个字段没传�?3. 在未补完后端业务能力前，正确做法是先收敛前端入口

---

## 5. 实施方案

### 5.1 TDD 红灯

新增失败用例�?
1. `packages/sdkwork-magic-studio-trade/src/services/paymentService.test.ts`
2. `packages/sdkwork-magic-studio-trade/src/components/Payment/PaymentDialog.test.tsx`

红灯覆盖点：

1. `paymentService.initiatePayment`
   - 当支付方式为 `BALANCE / POINTS / CREDIT_CARD / MIXED` �?   - 应在调用 SDK 前直接失�?2. `PaymentDialog`
   - 只应展示 `ALIPAY / WECHAT_PAY`
   - 不应再展�?`CREDIT_CARD / BALANCE / POINTS`
   - 不应再展�?`use_balance / use_points` 勾选项

红灯结果�?
1. 服务测试失败�?   - 旧实现会继续调用支付流程，最终抛出错误读�?`paymentId`
2. 组件测试失败�?   - �?UI 仍然渲染 `Credit Card / Balance / Points`
   - 也仍然渲染余�?积分勾选项

### 5.2 最小生产修�?
修复点一：`paymentService.ts`

1. 增加 `SUPPORTED_ORDER_PAYMENT_METHODS`
2. 增加 `isSupportedOrderPaymentMethod(method)`
3. �?`initiatePayment` 开头增加合同守�?4. 遇到不支持方式时，直接返回明确错误：

```ts
App SDK order pay does not support payment method: ${method}
```

修复点二：`PaymentDialog.tsx`

1. 支付方式改为基于 `SUPPORTED_ORDER_PAYMENT_METHODS` 构建
2. 初始默认值改为真实支持方式列表中的首�?3. 移除 `useBalance / usePoints` 本地状�?4. 移除余额/积分勾�?UI
5. 提交支付时不再传递伪参数

---

## 6. 修改文件

### 新增

1. `packages/sdkwork-magic-studio-trade/src/components/Payment/PaymentDialog.test.tsx`

### 修改

1. `packages/sdkwork-magic-studio-trade/src/services/paymentService.ts`
2. `packages/sdkwork-magic-studio-trade/src/services/paymentService.test.ts`
3. `packages/sdkwork-magic-studio-trade/src/components/Payment/PaymentDialog.tsx`

---

## 7. 验证结果

### 7.1 红灯验证

命令�?
```bash
pnpm exec vitest run packages/sdkwork-magic-studio-trade/src/services/paymentService.test.ts packages/sdkwork-magic-studio-trade/src/components/Payment/PaymentDialog.test.tsx
```

结果�?
1. 失败
2. 失败原因符合预期�?   - 服务未做合同守卫
   - 组件仍暴露不支持的支付方式和勾选项

### 7.2 修复后目标测�?
命令�?
```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/paymentService.test.ts src/components/Payment/PaymentDialog.test.tsx
```

结果�?
1. `2` 个测试文件通过
2. `9` 个测试通过
3. `0` 失败

### 7.3 trade 包类型检�?
命令�?
```bash
pnpm --filter @sdkwork/magic-studio-trade run typecheck
```

结果�?
1. 通过

### 7.4 工作区级验证

命令�?
```bash
pnpm typecheck
pnpm run check:sdk-standard
```

结果�?
1. `pnpm typecheck` 通过
2. `pnpm run check:sdk-standard` 通过
3. `sdk-compliance` 严格模式 `0` 违规
4. `trade-standard` 通过

补充说明�?
1. `pnpm typecheck` 输出末尾存在若干 `turbo` �?archive path warning
2. 当前命令整体退出码�?`0`
3. 不影响本轮变更正确性，但值得后续单独排查构建链路告警来源

---

## 8. 当前阶段判断

到本轮为止，`trade` 支付链路在“订单支付入口”这一级已经从假能力收敛到真实合同�?
1. 前端不会再展示当前后端不支持的订单支付方�?2. 前端不会再展示当前后端不支持的余�?积分抵扣勾选项
3. 服务层在 UI 之外也补上了支付方式合同守卫
4. `trade` 继续保持 `client.xxx` 标准路径，没有引入任何包�?HTTP 旁路

---

## 9. 下一步建�?
建议下一轮继续沿同样方式推进 `trade`�?
1. `requestRefund`
   - 核对退款状态映射是否与真实后端一�?2. `getTransactionList`
   - 核对 cash history 与前�?`Transaction` 字段映射
3. `updateOrderStatus`
   - 核对 `PAID / COMPLETED / REFUNDED / CANCELLED` 的动作边�?4. 如果后续确需支持余额/积分支付
   - 先补 `retired Spring app API authority` 合同
   - 再补后端服务能力
   - 最后回�?`trade` 重新开放对应前端入�?