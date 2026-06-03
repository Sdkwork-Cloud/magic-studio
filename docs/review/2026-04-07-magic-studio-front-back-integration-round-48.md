# Magic Studio V2 前后端对接检查与修复 Round 48

日期: 2026-04-07  
范围: `apps/magic-studio-v2`  
目标: 修复 `trade/orderService.createOrder` 的真实合同错位，收口下单交易类型、内容类型和数�?ID 映射  
排除范围: `notes`

---

## 1. 本轮结论

本轮没有新增后端 API，也没有修改 `spring-ai-plus-app-api` 或后端业�?service 的接口定义�?
本轮处理的是一个前端下单合同错位问题，根因不是单一字段，而是三层同时错位�?
1. 前端把业务能力类型直接当成后端交�?`orderType`
2. 前端默认发送的 `contentType = GENERATION` 不是后端合法 `PlusContentType`
3. 前端默认�?`projectUuid/workspaceUuid` 当成后端要求的数�?`productId/contentId`

修复�?

1. 前端 `createOrder` 会把业务类型映射成真�?app-api 交易类型
2. 前端会生成真实后端可识别�?`contentType`
3. 当前端无法提供数�?`productId/contentId` 时，会在调用前直接失败，不再把坏请求发到后端
4. 订单读回映射和筛选器也开始支持真实后端交易类�?
---

## 2. 问题列表与根�?
### P1. `createOrder` 发送了后端根本不接受的 `orderType`

问题位置:

1. `packages/sdkwork-magic-studio-trade/src/services/orderService.ts`

旧行�?

```ts
orderType: params.type
```

例如:

1. `IMAGE_GENERATION`
2. `VIDEO_GENERATION`
3. `CREDIT_TOPUP`

�?app-api `OrderAppApiController.createOrder(...)` 内部真实只接�?

1. `GOODS`
2. `VIRTUAL`
3. `MEMBER`
4. `POINTS`
5. `IM_GROUP`
6. `BOOKING`

### P2. `createOrder` 默认发送了无效�?`contentType`

旧行�?

```ts
contentType: params.taskType || 'GENERATION'
```

但后�?`parseContentType(...)` 走的�?`PlusContentType.valueOf(...)`，`GENERATION` 不是合法枚举值�?
### P3. `createOrder` 默认�?`projectUuid/workspaceUuid` 当成后端数�?ID

旧行�?

1. `productId = projectUuid || workspaceUuid || 'virtual-product'`
2. `contentId = projectUuid || workspaceUuid`

但后端在 controller �?service 中会把这些字段按 `Long` 解析�?
如果传入普�?UUID 或业务字符串:

1. `productId` 解析失败
2. `contentId` 解析失败
3. 请求会在后端报错，而不是在前端被及时阻�?
### P4. 订单读回映射仍按前端旧业务类型猜测，而不是识别真实交易类�?
旧行�?

1. `mapOrderType` 只识�?
   - `VIDEO_GENERATION`
   - `IMAGE_GENERATION`
   - `AUDIO_GENERATION`
   - `MUSIC_GENERATION`
   - `VIDEO_EDITING`
   - `CUSTOM_SERVICE`
   - `SUBSCRIPTION`
   - `CREDIT_TOPUP`
2. 如果后端返回 `VIRTUAL` / `POINTS` / `MEMBER`，前端会落到错误 fallback

根因总结:

1. 前端 `OrderType` 混用了“能力类型”和“交易类型�?2. 下单请求和订单读取没有围绕真�?app-api 合同建模
3. 旧实现是前端本地语义，不是后端真实合�?
---

## 3. 本轮处理方法的输入与输出

### 3.1 前端入口方法

方法:

```ts
orderService.createOrder(params: CreateOrderParams): Promise<Order>
```

本轮修正后的输入:

```ts
{
  type: OrderType;
  title: string;
  amount: number;
  productId?: string | number;
  contentId?: string | number;
  taskType?: string;
  projectUuid?: string;
  workspaceUuid?: string;
  description?: string;
  remark?: string;
}
```

### 3.2 真实服务端对�?
方法:

```ts
client.orders.createOrder(body: OrderCreateForm)
```

真实 `OrderCreateForm` 输入:

```ts
{
  orderType: 'GOODS' | 'VIRTUAL' | 'MEMBER' | 'POINTS' | 'IM_GROUP' | 'BOOKING';
  productId?: string;
  items?: Array<{
    productId?: string;
    skuId?: string;
    price?: string;
    productName?: string;
    contentType?: string;
    contentId?: string;
  }>;
  rechargePoints?: number;
}
```

### 3.3 本轮修正后的输出语义

高置信映�?

1. `IMAGE_GENERATION -> VIRTUAL + GENERATION_IMAGE`
2. `VIDEO_GENERATION -> VIRTUAL + GENERATION_VIDEO`
3. `VIDEO_EDITING -> VIRTUAL + VIDEO`
4. `AUDIO_GENERATION -> VIRTUAL + AUDIO`
5. `MUSIC_GENERATION -> VIRTUAL + AUDIO`
6. `CREDIT_TOPUP -> POINTS + PRODUCT`
7. `SUBSCRIPTION -> MEMBER + VIP_PACKAGE`

前端失败输出:

```ts
throw new Error('App SDK createOrder requires numeric productId and contentId values compatible with app-api trade contracts')
```

�?`type` 不属于当前前端已明确支持的真实建单映射时:

```ts
throw new Error(`App SDK createOrder does not support frontend order type: ${type}`)
```

### 3.4 本轮变更类型

1. `CreateOrderParams`: 修改
2. `orderService.createOrder`: 修改
3. `orderService.mapOrderType`: 修改
4. `orderService.getOrderList` 查询类型映射: 修改
5. `OrderType` 枚举: 修改，补充真实交易类�?6. `orderTypeLabel` 与订单筛选器: 修改
7. app-api: 不修�?8. backend service: 不修�?
---

## 4. 实施方案

### 4.1 TDD 红灯

新增测试:

1. `maps image generation orders to the real app-api VIRTUAL order contract`
2. `rejects non-numeric project identifiers before calling app-api createOrder`

红灯结果证明:

1. 旧实现把 `IMAGE_GENERATION` 直接发到�?`orderType`
2. 旧实现把 `GENERATION` 直接发到�?`contentType`
3. 旧实现会把非数�?`projectUuid` 发给后端，而不是前端提前失�?
### 4.2 最小生产修�?
修复�?

1. 增加 `toBackendCreateOrderType(...)`
2. 增加 `toBackendContentType(...)`
3. 增加数�?ID 校验 `toPositiveIntegerId(...)`
4. `createOrder` 只在 `productId/contentId` 可形成合法数值字符串时才发请�?5. `mapOrderType` 开始识别真实后端交易类�?
   - `GOODS`
   - `VIRTUAL`
   - `MEMBER`
   - `POINTS`
   - `IM_GROUP`
   - `BOOKING`
   - `SERVICE`
6. `getOrderList` 查询类型映射改成真实交易类型查询

### 4.3 合同防漂�?
修改:

1. `packages/sdkwork-magic-studio-trade/src/services/orderService.contract-typecheck.ts`

本轮�?create-order sample 从错误的 `IMAGE_GENERATION` 改成真实�?`VIRTUAL`�?
---

## 5. 修改文件

修改:

1. `packages/sdkwork-magic-studio-trade/src/entities/index.ts`
2. `packages/sdkwork-magic-studio-trade/src/services/orderService.ts`
3. `packages/sdkwork-magic-studio-trade/src/services/orderService.test.ts`
4. `packages/sdkwork-magic-studio-trade/src/services/orderService.contract-typecheck.ts`
5. `packages/sdkwork-magic-studio-trade/src/useTradeI18n.ts`
6. `packages/sdkwork-magic-studio-trade/src/components/Order/OrderList.tsx`
7. `packages/sdkwork-magic-studio-i18n/src/locales/zh-CN/market.ts`
8. `packages/sdkwork-magic-studio-i18n/src/locales/en/market.ts`

新增:

1. `docs/review/2026-04-07-magic-studio-front-back-integration-round-48.md`

---

## 6. 验证结果

### 6.1 红灯验证

命令:

```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/orderService.test.ts
```

结果:

1. 旧实现下失败
2. 失败�?
   - `orderType` 发成�?`IMAGE_GENERATION`
   - `contentType` 发成�?`GENERATION`
   - 非数�?`projectUuid` 没有前置拦截

### 6.2 绿灯验证

命令:

```bash
pnpm --filter @sdkwork/magic-studio-trade exec vitest run src/services/orderService.test.ts
```

结果:

1. 通过
2. `6` 个测试通过
3. `0` 个失�?
---

## 7. 当前阶段判断

到本轮为止，`trade` 下单合同已经开始从“前端自定义语义”回到“真�?app-api 合同”：

1. 创建订单时不再把业务能力类型直接当成交易类型
2. 不再发送后端不支持�?`GENERATION` contentType
3. 不再把普�?UUID 当成后端数�?ID 盲发
4. 订单列表筛选和订单类型标签开始支持真实交易类�?
---

## 8. 下一步建�?
建议下一轮继续把 `trade` 的订单类型建模彻底收口：

1. 审计 `Order.type` �?UI 上是否还需要保留“业务能力类型”与“交易类型”的双层模型
2. 审计 `getOrderStatistics`
   - 确认 `pendingShipment/pendingReceipt` 字段稳定�?3. 审计 `OrderDetail` 是否需要把 `items[].productType` / 其他字段引入为更细粒度的前端展示依据
