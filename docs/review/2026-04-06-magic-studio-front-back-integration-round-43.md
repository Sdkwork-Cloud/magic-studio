# Magic Studio V2 前后端对接检查与修复 Round 43

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：修�?`trade` 模块交易流水查询�?`spring-ai-plus-app-api` 钱包交易契约不一致的问题�? 
排除范围：`notes`

---

## 1. 本轮结论

本轮没有新增后端 API，也没有修改 `spring-ai-plus-app-api` 的接口定义�?
本轮处理的是一个前后端契约错位问题，类型明确如下：

1. 修改现有前端方法：`packages/sdkwork-magic-studio-trade/src/services/paymentService.ts#getTransactionList`
2. 不新增前端业务方�?3. 不修改后�?Controller / Service
4. 不修�?OpenAPI / 生成 SDK
5. 修正一个已滞后的标准校验脚本：`apps/scripts/check-trade-standard.mjs`

修复后，`trade` 交易流水查询已从旧的 `client.account.getHistoryCash(...)` 收口到标准路径：

`client.wallet.listTransactions(...)`

同时把请求参数名从旧的页面内部字段映射为后端真实接收�?`WalletHistoryQueryForm`�?
---

## 2. 问题列表与根�?
### P1. `getTransactionList` 仍走�?cash history 接口，且请求参数名与后端真实契约不一�?
问题位置�?
1. `packages/sdkwork-magic-studio-trade/src/services/paymentService.ts`

问题现象�?
1. 旧实现调用的�?`client.account.getHistoryCash(...)`
2. 旧实现发送的参数是：
   - `page`
   - `pageNo`
   - `pageSize`
   - `size`
   - `type`
   - `keyword`
   - `startTime`
   - `endTime`
   - `sortBy`
   - `sortOrder`
3. 但后端真实接收的历史查询表单�?`HistoryQueryForm / WalletHistoryQueryForm`，字段为�?   - `pageNum`
   - `pageSize`
   - `status`
   - `transactionType`
   - `startDate`
   - `endDate`
   - `sortField`
   - `sortDirection`
   - `accountType`
4. 当前 app-sdk 已经提供统一钱包交易入口 `client.wallet.listTransactions(...)`

根因�?
1. `trade` 模块历史遗留地沿用了较早�?`account cash history` 路径
2. 调用层没有按当前 app-api 的钱包交易查询参数做映射
3. 前端虽然使用�?app-sdk，但没有使用当前最准确的业务边�?`client.wallet`

影响�?
1. 请求参数大量不能被后端表单正确绑�?2. 查询结果依赖后端默认值，分页、筛选、排序存在失真风�?3. `trade` 模块与当前统一钱包契约脱节

### P2. `trade-standard` 校验脚本仍要求旧�?`client.account.getHistoryCash(...)`

问题位置�?
1. `apps/scripts/check-trade-standard.mjs`

问题现象�?
1. 业务代码修复后，定向测试和类型检查都通过
2. �?`pnpm run check:sdk-standard` 失败
3. 根因是标准脚本仍�?`client.account.getHistoryCash(...)` 当作 `paymentService` 的唯一正确实现

根因�?
1. 标准脚本滞后于当�?app-api 的钱包统一契约
2. 自动校验口径没有跟随业务边界�?`account cash history` 演进�?`wallet transactions`

影响�?
1. 会阻断正确实现通过全局标准校验
2. 会诱导未来回退到旧路径

---

## 3. 本轮处理方法的输入与输出

说明�?
1. 本轮只处理一个方法：`paymentService.getTransactionList`
2. 本轮是“修改现有方法”，不是“新增方法�?
### 3.1 前端入口输入

方法�?
`paymentService.getTransactionList(params: TradePageRequest)`

输入�?
```ts
{
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  status?: string;
  type?: string;
  startTime?: string;
  endTime?: string;
}
```

### 3.2 对接 app-sdk 的真实请求输�?
方法�?
`client.wallet.listTransactions(query)`

本轮对接后的输入�?
```ts
{
  accountType: 'CASH';
  pageNum: number;
  pageSize: number;
  status?: string;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortDirection?: 'ASC' | 'DESC';
}
```

字段映射关系�?
1. `page -> pageNum`
2. `pageSize -> pageSize`
3. `status -> status`
4. `type -> transactionType`
5. `startTime -> startDate`
6. `endTime -> endDate`
7. `sortBy -> sortField`
8. `sortOrder -> sortDirection`
9. `accountType` 本轮固定�?`CASH`，保持与旧功能语义一�?10. `keyword` 本轮不再传递，因为当前钱包交易查询契约没有该字�?
### 3.3 后端真实输出

后端输出�?
```ts
{
  code: string;
  data: {
    content: HistoryVO[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}
```

`HistoryVO` 关键字段�?
```ts
{
  historyId?: string;
  transactionId?: string;
  transactionType?: string;
  transactionTypeName?: string;
  amount?: number;
  points?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  relatedId?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### 3.4 前端方法输出

输出�?
```ts
{
  items: Transaction[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
```

`Transaction` 映射结果�?
```ts
{
  uuid: string;
  transactionNo: string;
  type: 'RECHARGE' | 'CONSUME' | 'REFUND' | 'TRANSFER' | 'REWARD' | 'WITHDRAW';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  pointsChange: number;
  orderUuid?: string;
  paymentUuid?: string;
  userUuid: string;
  description: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 4. 根因确认过程

### 4.1 SDK 能力确认

确认结果�?
1. 生成 SDK 已存�?`client.wallet`
2. `client.wallet.listTransactions` 已映射到 `/app/v3/api/wallet/transactions`
3. 因此问题不是“后端没能力”，而是“前端没走正确能力�?
### 4.2 app-api 契约确认

确认结果�?
1. `WalletAppApiController.listTransactions` 真实接收 `WalletHistoryQueryForm`
2. `WalletHistoryQueryForm` 继承 `HistoryQueryForm`
3. 真实字段名是 `pageNum / pageSize / status / transactionType / startDate / endDate / sortField / sortDirection`
4. 并且 `accountType` 是必填字�?
### 4.3 旧实现问题确�?
确认结果�?
1. 旧实现请求字段名与后端表单字段名大量不一�?2. 旧实现没有传 `accountType`
3. 旧实现也没有使用当前统一钱包交易入口

最终结论：

这是一个真实的前后端契约错配问题，且修复方式应是：

1. 修改前端现有调用路径
2. 改为当前标准 `client.wallet.listTransactions`
3. 对齐真实请求字段�?4. 保持功能语义不扩大，仅继续查�?`CASH` 交易流水

---

## 5. 实施方案

### 5.1 TDD 红灯

新增失败用例位置�?
1. `packages/sdkwork-magic-studio-trade/src/services/paymentService.test.ts`

红灯覆盖点：

1. 必须调用 `client.wallet.listTransactions`
2. 必须传�?`WalletHistoryQueryForm` 对应字段�?3. 不允许再调用 `client.account.getHistoryCash`
4. 返回结果要继续映射为 `TradePageResponse<Transaction>`

红灯结果�?
1. 测试失败
2. 失败原因符合预期：旧实现未走 wallet 契约，导致返回结构不匹配

### 5.2 最小生产修�?
修复点一：`packages/sdkwork-magic-studio-trade/src/services/paymentService.ts`

1. �?`client.account.getHistoryCash(...)` 替换�?`client.wallet.listTransactions(...)`
2. 增加 `wallet.listTransactions` 可用性保�?3. 把旧参数名映射为�?   - `pageNum`
   - `pageSize`
   - `status`
   - `transactionType`
   - `startDate`
   - `endDate`
   - `sortField`
   - `sortDirection`
4. 固定 `accountType: 'CASH'`
5. 删除无契约字�?`keyword`

修复点二：`packages/sdkwork-magic-studio-trade/src/services/paymentService.contract-typecheck.ts`

1. 新增 `WalletHistoryQueryForm` 类型守卫样例
2. 防止后续再次回退到旧参数�?
修复点三：`apps/scripts/check-trade-standard.mjs`

1. �?`paymentService` 的交易流水必需调用�?`client.account.getHistoryCash(...)` 更新�?`client.wallet.listTransactions(...)`
2. 保证自动标准校验与当前真�?app-api 契约一�?
---

## 6. 修改文件

修改�?
1. `packages/sdkwork-magic-studio-trade/src/services/paymentService.ts`
2. `packages/sdkwork-magic-studio-trade/src/services/paymentService.test.ts`
3. `packages/sdkwork-magic-studio-trade/src/services/paymentService.contract-typecheck.ts`
4. `apps/scripts/check-trade-standard.mjs`

新增�?
1. `docs/review/2026-04-06-magic-studio-front-back-integration-round-43.md`

---

## 7. 验证结果

### 7.1 红灯验证

命令�?
```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/paymentService.test.ts
```

结果�?
1. 失败
2. 失败原因为旧实现没有�?`client.wallet.listTransactions`
3. 证明测试确实锁定了目标缺�?
### 7.2 绿灯验证

命令�?
```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/paymentService.test.ts
```

结果�?
1. 通过
2. `9` 个测试通过
3. `0` 失败

### 7.3 package 类型检�?
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
4. `trade-standard` 已与 `wallet.listTransactions` 契约对齐

---

## 8. 当前阶段判断

到本轮为止，`trade` 的交易流水查询已经完成以下收口：

1. 从旧 cash history 路径切换到统一钱包交易路径
2. 从旧参数名切换到 app-api 真实契约字段�?3. 保持了现有前端输出模型不变，降低影响�?4. 用测试和 contract typecheck 同时守住运行时与类型�?
---

## 9. 下一步建�?
建议继续按同样方式推�?`trade` 的下一批高价值问题：

1. `getWallet`
   - 评估是否应收口到 `client.wallet.getOverview`
2. `requestRefund`
   - 继续核对退款表单字段与状态回写语�?3. `updateOrderStatus`
   - 继续核对支付、确认收货、退款、取消动作与真实订单状态流�?