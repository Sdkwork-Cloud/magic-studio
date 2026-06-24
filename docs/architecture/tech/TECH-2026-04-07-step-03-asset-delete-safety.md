> Migrated from `docs/review/2026-04-07-step-03-asset-delete-safety.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 资产删除安全边界收敛

## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

在不扩散到三大引擎大面积接线改造的前提下，优先关闭 Step 03 中最危险的一条真实风险链路：

1. 资产中心删除回收必须限制�?Magic Studio 受管目录�?2. 外部绝对路径即使被资产记录引用，也只能删除索引，不能直接删除本地文件
3. 受管目录判定必须下沉为共享规则，而不是分散在调用侧各自判�?
这对�?Step 03 文档中的以下要求�?
- 统一本地目录与存储层�?- 固化删除回收策略
- 降低“删除回收误伤本地文件”的高风险问�?
## 实际变更

### 1. AssetCenterService 删除路径加受管目录门�?
- 更新 `packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts`
- `deleteById(...)` 在执行文件删除前，会先读取当�?Magic Studio 存储配置
- 仅当待删绝对路径落在 Magic Studio 受管目录内时，才允许调用 VFS 删除
- 若路径位于受管目录之外，则跳过物理文件删除，仅继续删除资产索引记录，并输出警告日�?
### 2. 受管目录判定收敛到共享布局�?
- 更新 `packages/sdkwork-magic-studio-assets/src/asset-center/application/magicStudioAssetLayout.ts`
- 新增 `isManagedAssetAbsolutePath(...)`
- 统一识别以下可删目录�?  - `system/library`
  - 工作区项目下�?`media`
  - 工作区项目下�?`cache`
  - 工作区项目下�?`exports`
  - 独立覆写配置下的 `cacheRootDir`
  - 独立覆写配置下的 `exportsRootDir`
- 明确拒绝以下非资产受管路径：
  - 根级系统配置文件，如 `system/settings.json`
  - 工作区外部任意绝对路�?  - 仅因被索引引用但不在受管树内的桌�?下载目录文件

### 3. 测试补齐

- 新增 `packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts`
  - 验证受管项目媒体目录中的文件会被删除
  - 验证外部绝对路径不会被删除，但索引记录仍会被移除
- 更新 `packages/sdkwork-magic-studio-assets/tests/magicStudioAssetLayout.test.ts`
  - 验证 `isManagedAssetAbsolutePath(...)` 对项目媒体目录和覆写缓存根目录返�?`true`
  - 验证对系统设置文件和外部绝对路径返回 `false`

## 检查点结果

### CP03-1 资产 identity 与目录策略冻�?
- 结果: `PARTIAL`
- 说明: 本轮没有继续扩展 `assetId` 主引用迁移，但受管目录判定和删除门禁已经冻结为共享规则，目录策略进入可验证状�?
### CP03-2 三大引擎主引用切换到 `assetId`

- 结果: `NOT YET`
- 说明: Film / MagicCut / Canvas 仍有后续接线工作，本轮未宣称完成

### CP03-3 资产测试与跨模式读取通过

- 结果: `PARTIAL`
- 说明: 已新增删除安全与目录判定测试，并回归导入布局测试；跨引擎统一读取还需后续 Step 03 轮次继续补齐

### CP03-4 允许进入引擎与插件相�?Step

- 结果: `PARTIAL`
- 说明: 删除安全风险已显著下降，后续引擎 Step 的本地资产落地不会再默认携带“可能误删外部文件”的高风险；�?Step 03 仍未整体完工

## 运行命令与结�?
### Red

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads`
  - 结果: `FAIL`
  - 失败�? 外部绝对路径 `/Users/demo/Desktop/imports/raw-resource-1.mp4` 被错误删�?
### Green / Regression

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads`
  - 结果: `1 file, 2 tests passed`

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/magicStudioAssetLayout.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果: `1 file, 5 tests passed`

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果: `1 file, 6 tests passed`

- `pnpm.cmd exec tsc --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts packages/sdkwork-magic-studio-assets/src/asset-center/application/magicStudioAssetLayout.ts`
  - 结果: `PASS`

## 风险 / Blocker

- 当前仓库存在 `.worktrees/` 历史副本，同名测试在 Vitest 中会产生误扫噪音，因此本轮回归命令显式添加了 `--exclude ".worktrees/**"`
- Step 03 的主目标仍未全部完成，仍缺少�?  - 三大引擎统一 `assetId` 主引用收�?  - 资产反向引用追踪
  - 本地缓存与工程资源主干统一
  - 远程 URL 注册与受控本地化的一致策�?
## 是否达到门槛

- 是否达到解锁最�?bar: `YES`
  - 理由: 资产中心已从“可导入”推进到“可安全删除”，关闭了误删外部文件这一高风险缺�?
- 是否达到能力完工 bar: `NO`
  - 理由: Step 03 的统一 `assetId` 主引用、跨引擎接线和引用追踪仍未完成，不能误判为整步闭�?
## 文档回写情况

- `docs/review`: `YES`
- `docs/架构`: `NO`
  - 理由: 本轮实现的是既有 Step 03 风险条目的真实落地，没有改变架构标准本身
- `docs/release/CHANGELOG.md`: `YES`
- `docs/release/VERSION.md`: `YES`
- 本轮 release 记录: `YES`

## 是否允许进入下一�?
- 允许进入下一�? `YES`
- 允许进入下一 Step: `NO`
- 建议: 继续留在 `Step 03`，优先做统一 `assetId` 主引用收敛和跨引擎资源接线，不要提前宣告 Step 03 完成

## 并行 / 串行建议

### 可并�?
- Lane B1: `assetId / primaryResourceId / resourceViewId` 引用协议收敛
- Lane B2: Film / MagicCut / Canvas 对资产中心主引用接线
- Lane B3: 资产引用追踪、删除前引用检查、垃圾回收统�?
### 必须串行

- `AssetCenterService.ts`
- `magicStudioAssetLayout.ts`

这两个文件属�?Step 03 共享主干，应继续保持�?owner，避免多 lane 同时改写目录规则和删除策略�?
## 自我反证结论

- 本轮不是“只补测试”，而是补上了真实的删除安全门禁
- 本轮也不�?Step 03 全量完成，只是完成了一个高价值、强约束、可验证的子闭环
- 与商业化交付的关系是直接的：
  - 关闭外部文件误删风险
  - 提升本地存储治理可信�?  - 为后续引擎资产接线提供可依赖的删除边�?
