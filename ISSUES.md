# Magic Studio v2 - 当前问题清单

**生成时间**: 2026-02-22  
**状态**: 进行中

---

## 问题总览

| 严重程度 | 类别 | 问题数量 | 已解决 |
|---------|------|---------|--------|
| 🔴 高 | TypeScript 类型错误 | ~1900+ | - |
| 🟡 中 | 构建配置问题 | 1 | ✅ 1 |
| 🟢 低 | 代码规范问题 | 未知 | - |

---

## 已解决问题

### ✅ sdkwork-react-i18n 构建错误 (2026-02-22)

**问题描述**: 
```
tsconfig.json(2,3): error TS5069: Option 'emitDeclarationOnly' cannot be specified without specifying option 'declaration' or option 'composite'.
```

**原因**: tsconfig.json 中 `noEmit: true` 与 `tsc --emitDeclarationOnly` 冲突

**解决方案**: 
- 修改 `packages/sdkwork-react-i18n/tsconfig.json`
- 设置 `noEmit: false`
- 添加 `declaration: true` 和 `declarationDir: "./dist"`

**验证**: 
```bash
pnpm --filter sdkwork-react-i18n build
# ✅ 构建成功
```

---

## 待解决问题

### 🔴 TypeScript 类型错误 (~1900+)

**影响范围**: 全项目

**主要原因**:
1. **缺失的类型定义**: 部分包未正确导出类型
2. **实体类型不匹配**: 不同包之间的实体类型定义不一致
3. **平台 API 方法可用性**: 某些平台 API 方法在某些环境下不可用
4. **模块导入路径问题**: 循环依赖导致类型解析失败

**建议修复步骤**:
```bash
# 1. 重新安装依赖
pnpm install

# 2. 构建基础包
pnpm --filter sdkwork-react-commons build
pnpm --filter sdkwork-react-core build
pnpm --filter sdkwork-react-fs build
pnpm --filter sdkwork-react-types build

# 3. 运行 TypeScript 检查
npx tsc --noEmit

# 4. 逐个修复类型错误
```

**优先级**:
1. `sdkwork-react-core` - 核心功能
2. `sdkwork-react-commons` - 共享类型和工具
3. `sdkwork-react-auth` - 认证相关
4. 其他功能模块

---

### 🟡 pnpm workspace 链接问题

**问题描述**: 部分包可能需要正确链接 workspace 依赖

**症状**: 
- 导入 workspace 包时出现 "Module not found" 错误
- 类型解析失败

**解决方案**:
```bash
# 清理 node_modules
rm -rf node_modules packages/*/node_modules

# 重新安装
pnpm install

# 验证链接
pnpm list --depth=0
```

---

### 🟡 TypeScript 缓存问题

**问题描述**: TypeScript 可能使用旧的缓存导致类型检查不准确

**解决方案**:
```bash
# 清理 TypeScript 缓存
find packages -name "*.tsbuildinfo" -delete

# 或者使用
npx tsc --build --clean
```

---

### 🟢 代码规范问题

**待检查项**:
- [ ] ESLint 配置是否统一
- [ ] Prettier 配置是否应用
- [ ] 提交前钩子是否配置

**建议**:
```bash
# 安装 ESLint 和 Prettier（如果未安装）
pnpm add -D eslint prettier eslint-config-prettier

# 配置提交前钩子
pnpm add -D husky lint-staged
```

---

## 性能优化建议

### 1. 构建优化

**当前状态**: 使用 Vite 构建，速度较快

**建议**:
- [ ] 配置代码分割
- [ ] 优化 chunk 大小
- [ ] 使用 SWC 替代 Babel（可选）

### 2. 开发服务器优化

**建议**:
- [ ] 配置 HMR 排除规则
- [ ] 优化 watch 模式
- [ ] 使用 esbuild 进行依赖预构建

---

## 技术债务

### 1. 循环依赖

**状态**: ✅ 已解决（sdkwork-react-trade 模块）

**设计原则**:
- 页面组件完全独立
- 不依赖外部布局组件
- 零循环依赖

### 2. 类型定义分散

**问题**: 类型定义分散在多个包中

**建议**:
- 统一类型定义到 `sdkwork-react-types` 或 `sdkwork-react-commons`
- 使用类型导入路径别名

### 3. 测试覆盖率

**当前状态**: ❌ 无测试框架

**建议添加**:
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**配置示例**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

---

## 监控和日志

### 建议添加

1. **错误监控**: Sentry 或类似服务
2. **性能监控**: Web Vitals
3. **用户行为分析**: Google Analytics 或自建方案

---

## 下一步行动

### 短期 (1-2 周)
- [ ] 修复所有 TypeScript 类型错误
- [ ] 配置 ESLint 和 Prettier
- [ ] 添加基础单元测试

### 中期 (1 个月)
- [ ] 优化构建性能
- [ ] 添加 E2E 测试
- [ ] 完善文档

### 长期 (3 个月)
- [ ] 实现组件文档站点 (Storybook)
- [ ] 建立 CI/CD 流程
- [ ] 性能基准测试和优化

---

## 相关文档

- [架构文档](docs/architect-react+tauri.md)
- [包路由系统](docs/package-routing-system.md)
- [技术栈版本](docs/00-technology-stack-versions.md)
- [开发指南](AGENTS.md)
- [快速开始](README.md)

---

**最后更新**: 2026-02-22  
**维护者**: SDKWork Team
