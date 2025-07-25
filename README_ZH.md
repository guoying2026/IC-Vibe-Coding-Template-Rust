# 🏦 SatoshiPool

基于互联网计算机（ICP）平台构建的去中心化借贷协议，具有供应、借贷、还款和提取功能，前端和后端之间实现实时数据集成。

## 🚀 功能特性

### 核心借贷协议

- **供应（Supply）**: 用户可以将资产存入借贷池作为抵押品
- **借贷（Borrow）**: 用户可以以其抵押品为担保借入资产
- **还款（Repay）**: 用户可以偿还其借入的金额
- **提取（Withdraw）**: 用户可以提取其供应的资产
- **清算（Liquidation）**: 对抵押不足的头寸进行自动清算

### 技术特性

- **实时数据**: 所有前端列表直接从后端罐子获取数据
- **类型安全**: 与后端 Candid 接口的完整 TypeScript 集成
- **身份认证**: Internet Identity 集成，确保安全的用户认证
- **价格预言机**: 集成 Pyth Network 获取实时价格数据
- **响应式界面**: 现代化的 React + Tailwind CSS 界面

### 架构设计

- **后端**: 具有全面借贷逻辑的 Rust 罐子
- **前端**: 具有实时后端集成的 React + TypeScript
- **身份认证**: Internet Identity 用于安全的用户管理
- **数据流**: 罐子到前端的直接数据获取

## 📋 前置要求

- Node.js (v18 或更高版本)
- DFX (v0.28.0 或更高版本)
- Rust (最新稳定版)
- 用于罐子部署的互联网连接

## 🛠️ 安装与设置

### 1. 克隆仓库

```bash
git clone <repository-url>
cd icp_1
```

### 2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd src/frontend
npm install
cd ../..
```

### 3. 启动本地环境

```bash
# 启动 DFX 副本
dfx start --clean --background

# 在新终端中，部署所有罐子
dfx deploy
```

### 4. 启动开发服务器

```bash
# 启动前端开发服务器
npm start
```

## 🏗️ 项目结构

```
icp_1/
├── src/
│   ├── backend/                    # Rust 后端罐子
│   │   ├── src/
│   │   │   ├── lib.rs             # 主要借贷协议逻辑
│   │   │   └── types.rs           # 数据结构和类型
│   │   ├── Cargo.toml             # Rust 依赖
│   │   └── backend.did            # 自动生成的 Candid 接口
│   ├── frontend/                   # React 前端应用
│   │   ├── src/
│   │   │   ├── components/        # 可重用 UI 组件
│   │   │   │   ├── Borrow/        # 借贷相关组件
│   │   │   │   ├── Earn/          # 收益相关组件
│   │   │   │   └── Layout/        # 布局组件
│   │   │   ├── services/          # 后端服务层
│   │   │   ├── views/             # 页面组件
│   │   │   ├── types/             # TypeScript 类型定义
│   │   │   └── hooks/             # 自定义 React hooks
│   │   ├── package.json           # 前端依赖
│   │   └── vite.config.ts         # 构建配置
│   └── declarations/              # 自动生成的罐子接口
├── dfx.json                       # DFX 配置
├── Cargo.toml                     # 根 Rust 工作空间
└── package.json                   # 根依赖
```

## 🔧 配置

### 环境变量

在根目录创建 `.env` 文件：

```env
# DFX 网络配置
DFX_NETWORK=local

# 罐子 ID（部署后自动生成）
CANISTER_ID_BACKEND=your_backend_canister_id
CANISTER_ID_FRONTEND=your_frontend_canister_id
CANISTER_ID_INTERNET_IDENTITY=your_ii_canister_id

# 开发设置
VITE_DFX_NETWORK=local
VITE_CANISTER_ID_BACKEND=your_backend_canister_id
VITE_II_CANISTER_ID=your_ii_canister_id
```

## 🚀 部署

### 本地开发

```bash
# 启动本地副本
dfx start --clean --background

# 部署所有罐子
dfx deploy

# 启动前端开发服务器
npm start
```

### 主网部署

```bash
# 设置网络为主网
dfx config --network ic

# 部署到主网
dfx deploy --network ic
```

## 📊 后端 API

### 核心借贷功能

#### 供应资产

```rust
#[update]
async fn supply(token_id: String, amount: NumTokens) -> Result<u64, String>
```

#### 借贷资产

```rust
#[update]
async fn borrow(token_id: String, amount: NumTokens) -> Result<u64, String>
```

#### 偿还借入资产

```rust
#[update]
async fn repay(token_id: String, amount: NumTokens) -> Result<u64, String>
```

#### 提取供应资产

```rust
#[update]
async fn withdraw(token_id: String, amount: NumTokens) -> Result<u64, String>
```

### 查询功能

#### 获取所有池子

```rust
#[query]
fn get_all_pools() -> Vec<Pool>
```

#### 获取用户供应

```rust
#[query]
fn get_user_supplies(user: Principal) -> Vec<(Principal, NumTokens)>
```

#### 获取用户借贷

```rust
#[query]
fn get_user_borrows(user: Principal) -> Vec<(Principal, NumTokens)>
```

#### 获取用户健康因子

```rust
#[query]
fn get_user_health_factor(user: Principal) -> f64
```

### 身份认证功能

#### 检查认证状态

```rust
#[query]
fn is_authenticated() -> bool
```

#### 获取用户信息

```rust
#[query]
fn get_user_info() -> Result<UserInfo, String>
```

#### 注册用户

```rust
#[update]
fn register_user(username: String) -> Result<UserInfo, String>
```

## 🎨 前端功能

### 页面

#### 仪表板

- 用户投资组合概览
- 总供应和借贷金额
- 健康因子监控
- 最近活动动态

#### 收益页面

- 可用金库列表
- APY 利率和 TVL 信息
- 用户存款跟踪
- 筛选和搜索功能

#### 借贷页面

- 可用借贷市场
- 抵押品要求
- 利率和费用
- 市场统计

#### 市场详情页面

- 详细市场信息
- 供应和借贷操作
- 市场统计和图表
- 风险指标

#### 金库详情页面

- 金库特定信息
- 性能指标
- 存款和提取操作
- 历史数据

### 组件

#### UserInfoDisplay

- 用户认证状态
- 余额信息
- 健康因子显示
- 最近活动

#### MarketListItem

- 市场概览卡片
- 关键指标显示
- 交互式选择
- 实时数据更新

#### VaultListItem

- 金库信息卡片
- APY 和 TVL 显示
- 用户头寸跟踪
- 操作按钮

## 🔐 身份认证

应用程序使用 Internet Identity 进行安全认证：

1. **本地开发**: 使用本地 Internet Identity 罐子
2. **主网**: 使用生产环境 Internet Identity
3. **自动注册**: 新用户自动注册
4. **会话管理**: 持久化认证状态

### 认证流程

```typescript
// 初始化认证
await internetIdentityService.initialize();

// 使用 Internet Identity 登录
await internetIdentityService.login();

// 检查认证状态
const authState = internetIdentityService.getAuthState();

// 获取用户信息
const userInfo = await internetIdentityService.getUserInfo();
```

## 📈 数据集成

### 实时数据流

所有前端数据都直接从后端罐子获取：

```typescript
// 获取池子数据
const pools = await internetIdentityService.getAllPools();

// 获取用户供应
const supplies = await internetIdentityService.getUserSupplies(principal);

// 获取用户借贷
const borrows = await internetIdentityService.getUserBorrows(principal);

// 获取用户健康因子
const healthFactor =
  await internetIdentityService.getUserHealthFactor(principal);
```

### 类型安全

前端类型与后端 Candid 接口对齐：

```typescript
// 后端对齐的接口
interface Pool {
  name: string;
  token_id: Principal;
  pool_account: AssetConfig;
  collateral: AssetConfig[];
  amount: bigint;
  used_amount: bigint;
  maximum_token: bigint;
}

interface AssetConfig {
  name: string;
  token_id: Principal;
  account: Account;
  price_id: string;
  asset_type: AssetTypes;
  decimals: number;
  collateral_factor: number;
  interest_rate: number;
}
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test tests/src/backend.test.ts

# 运行前端测试
cd src/frontend
npm test
```

### 测试覆盖

- 后端罐子逻辑测试
- 前端组件测试
- 集成测试
- 认证流程测试

## 🔧 开发

### 添加新功能

1. **后端更改**:

   - 在 `src/backend/src/lib.rs` 中添加新函数
   - 更新 Candid 接口
   - 添加测试

2. **前端更改**:
   - 在 `src/frontend/src/components/` 中添加新组件
   - 在 `src/frontend/src/types/` 中更新类型
   - 在 `src/frontend/src/services/` 中添加服务方法

### 代码质量

- **Rust**: 遵循 Clippy 和 Rust FMT 指南
- **TypeScript**: ESLint 和 Prettier 配置
- **测试**: 全面的测试覆盖
- **文档**: 内联代码文档

## 🚀 生产部署

### 主网部署步骤

1. **准备环境**:

   ```bash
   dfx config --network ic
   ```

2. **部署罐子**:

   ```bash
   dfx deploy --network ic
   ```

3. **更新环境变量**:

   - 设置生产罐子 ID
   - 配置 Internet Identity
   - 更新价格预言机端点

4. **验证部署**:
   - 测试所有功能
   - 验证身份认证
   - 检查数据集成

### 安全考虑

- **访问控制**: 池子管理的管理员专用功能
- **输入验证**: 全面的参数验证
- **错误处理**: 整个系统的优雅错误处理
- **速率限制**: 为关键功能实施速率限制

## 📚 API 文档

### Candid 接口

完整的 Candid 接口可在 `src/backend/backend.did` 中找到：

```candid
service : () -> {
  // 核心借贷功能
  supply : (text, nat) -> (Result);
  borrow : (text, nat) -> (Result);
  repay : (text, nat) -> (Result);
  withdraw : (text, nat) -> (Result);

  // 查询功能
  get_all_pools : () -> (vec Pool) query;
  get_user_supplies : (principal) -> (vec record { principal; nat }) query;
  get_user_borrows : (principal) -> (vec record { principal; nat }) query;

  // 身份认证功能
  is_authenticated : () -> (bool) query;
  get_user_info : () -> (Result_4) query;
  register_user : (text) -> (Result_4);
}
```

## 🤝 贡献

1. Fork 仓库
2. 创建功能分支
3. 进行更改
4. 为新功能添加测试
5. 提交拉取请求

### 开发指南

- 遵循现有代码风格
- 添加全面的测试
- 更新文档
- 确保类型安全
- 在本地和主网上测试

## 📄 许可证

本项目采用 MIT 许可证 - 详情请参阅 LICENSE 文件。

## 🆘 支持

如需支持和问题：

- 在仓库中创建问题
- 查看文档
- 查看代码示例
- 使用提供的设置进行测试

## 🔄 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解详细的更改和更新历史。

---

**为互联网计算机生态系统而构建 ❤️**
