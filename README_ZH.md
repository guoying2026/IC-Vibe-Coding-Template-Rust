# ⚡️BLend — 让你的比特币真正“动”起来

> 别再让你的 BTC 安静躺着吃灰了。

**BLend** 是个部署在 Internet Computer（ICP）上的真正去中心化比特币借贷协议。

不包裹资产、不跨链桥接、不妥协安全。

- 🚀 用 BTC、ETH 或稳定币赚利息  
- 🔐 以 BTC 抵押借出资金，风险可控  
- 💥 清算不良债务，获取协议奖励  
- 🧠 一键登录（支持 Internet Identity），再也不用记助记词

### 为什么选择 BLend？

因为你的比特币值得更高效的利用。  
BLend 让它全天候、安全、原生地为你“打工”。

> **ETH 可以质押，Meme 可以耕种，是时候让 BTC 也开始挣钱了。**



## 项目目录

👩🏻‍🔬 [技术文档（英文）](https://github.com/guoying2026/IC-Vibe-Coding-Template-Rust/tree/main)

📚 [EN 详细的协议介绍 xD](https://github.com/guoying2026/IC-Vibe-Coding-Template-Rust/blob/main/Docs_EN.md)

📖 [CN 详细文档](https://github.com/guoying2026/IC-Vibe-Coding-Template-Rust/blob/main/Docs_CN.md)

📚 [EN Mechanism Docs ](https://github.com/guoying2026/IC-Vibe-Coding-Template-Rust/blob/main/Docs_CN.md)

📖 [CN 技术文档 ](https://github.com/guoying2026/IC-Vibe-Coding-Template-Rust/blob/main/Docs_CN.md)

📚 [EN User Guide ](https://github.com/guoying2026/IC-Vibe-Coding-Template-Rust/blob/main/Docs_CN.md)

📖 [CN 用户指南 ](https://github.com/guoying2026/IC-Vibe-Coding-Template-Rust/blob/main/Docs_CN.md)

以及以下这里就是超技术的Readme文档

### 技术特性

- **类型安全**: 与后端Candid接口的完整TypeScript集成
- **响应式界面**: 基于React + Tailwind CSS的现代化UI
- **状态管理**: 完整的用户状态和认证状态管理
- **错误处理**: 优雅的错误处理和用户反馈
- **可访问性**: 支持键盘导航和屏幕阅读器

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
# 启动DFX副本
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
│   ├── backend/                    # Rust后端罐子
│   │   ├── src/
│   │   │   ├── lib.rs             # 主要借贷协议逻辑
│   │   │   └── types.rs           # 数据结构和类型
│   │   ├── Cargo.toml             # Rust依赖
│   │   └── backend.did            # 自动生成的Candid接口
│   ├── frontend/                   # React前端应用
│   │   ├── src/
│   │   │   ├── components/        # 可重用UI组件
│   │   │   │   ├── Layout/        # 布局组件（Header等）
│   │   │   │   ├── UserInfoDisplay.tsx # 用户信息显示
│   │   │   │   ├── TokenBalanceDisplay.tsx # 代币余额显示
│   │   │   │   ├── LiquidityProvider.tsx # 流动性提供者
│   │   │   │   └── MarketDetail.tsx # 市场详情
│   │   │   ├── services/          # 后端服务层
│   │   │   │   ├── InternetIdentityService.ts # II认证服务
│   │   │   │   └── TokenBalanceService.ts # 代币余额服务
│   │   │   ├── views/             # 页面组件
│   │   │   │   ├── DashboardPage.tsx # 仪表板页面
│   │   │   │   └── EarnView.tsx   # 收益页面
│   │   │   ├── types/             # TypeScript类型定义
│   │   │   ├── hooks/             # 自定义React hooks
│   │   │   │   └── useLanguage.tsx # 多语言支持
│   │   │   └── assets/            # 静态资源
│   │   │       ├── btc.png        # 比特币图标
│   │   │       └── btc1.png       # BLend徽标
│   │   ├── package.json           # 前端依赖
│   │   └── vite.config.ts         # 构建配置
│   └── declarations/              # 自动生成的罐子接口
├── dfx.json                       # DFX配置
├── Cargo.toml                     # 根Rust工作空间
└── package.json                   # 根依赖
```

## 🔧 配置

### 环境变量

在根目录创建 `.env` 文件：

```env
# DFX网络配置
DFX_NETWORK=local

# 罐子ID（部署后自动生成）
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

## 🎨 前端功能

### 页面组件

#### 仪表板页面 (DashboardPage)

- **用户信息显示**: 显示用户认证状态、Principal ID和Account ID
- **统计卡片**: 总收益、总借贷、平均APY等关键指标
- **代币余额**: 实时显示用户持有的各种代币余额
- **响应式设计**: 适配桌面和移动设备

#### 收益页面 (EarnView)

- **资产池列表**: 显示可用的借贷资产池
- **市场详情**: 点击查看详细的市场信息和操作界面
- **流动性管理**: 供应和提取资产的模态框界面
- **交易历史**: 显示用户的交易记录

### 核心组件

#### UserInfoDisplay

- **身份信息**: 显示Principal ID和Account ID
- **交互功能**: 点击眼睛图标切换显示/隐藏，复制按钮
- **充值说明**: 美元符号按钮显示充值说明
- **现代化设计**: 渐变背景、卡片式布局

#### TokenBalanceDisplay

- **余额查询**: 支持ICP、ckBTC等代币余额查询
- **自定义代币**: 允许用户添加自定义代币
- **实时更新**: 自动刷新余额数据
- **错误处理**: 优雅的错误提示

#### MarketDetail

- **市场统计**: 总供应量、总借贷量、可用流动性等
- **操作界面**: 供应、借贷、还款、提取四个操作标签
- **实时计算**: 动态计算最大可用金额和收益
- **交易预览**: 显示交易详情和预期收益

### 多语言支持

应用程序支持完整的中英文双语界面：

```typescript
// 语言切换
const { t, language, toggleLanguage } = useLanguage();

// 使用翻译
<h1>{t("dashboard_title")}</h1>
<button>{t("connect_wallet")}</button>
```

支持的语言键包括：

- 用户界面文本
- 错误消息
- 操作提示
- 充值说明

## 🔐 身份认证

### Internet Identity集成

应用程序使用Internet Identity进行安全认证：

1. **本地开发**: 使用本地Internet Identity罐子
2. **主网**: 使用生产环境Internet Identity
3. **自动注册**: 新用户自动注册
4. **会话管理**: 持久化认证状态

### 认证流程

```typescript
// 初始化认证
await internetIdentityService.initialize();

// 使用Internet Identity登录
await internetIdentityService.login();

// 检查认证状态
const authState = internetIdentityService.getAuthState();

// 获取用户信息
const userInfo = await internetIdentityService.getUserInfo();
```

### Principal ID和Account ID

- **Principal ID**: 用户的唯一身份标识符
- **Account ID**: 基于Principal生成的账户地址，用于接收代币
- **安全显示**: 默认隐藏部分内容，支持显示/隐藏切换
- **复制功能**: 一键复制到剪贴板

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

### 代币余额查询

支持查询各种ICRC-1标准代币的余额：

```typescript
// 查询ICP余额
const icpBalance = await tokenBalanceService.queryICPBalance(principal);

// 查询ckBTC余额
const ckbtcBalance = await tokenBalanceService.queryCkbtcBalance(principal);

// 查询自定义代币余额
const customBalance = await tokenBalanceService.queryTokenBalance(
  tokenCanisterId,
  accountId,
);
```

### 类型安全

前端类型与后端Candid接口对齐：

```typescript
// 后端对齐的接口
interface Asset {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  price: number;
  balance: number;
  apy: number;
  tvl: number;
  supplied: number;
  borrowed: number;
  collateralFactor: number;
  liquidationThreshold: number;
  borrowRate: number;
  utilization: number;
}

interface UserInfo {
  username: string;
  ckbtc_balance: number;
  total_earned: number;
  total_borrowed: number;
  created_at: bigint;
  recent_activities: any[];
}
```

## 🎨 UI/UX特性

### 现代化设计

- **渐变背景**: 使用蓝色到紫色的渐变背景
- **卡片式布局**: 信息以卡片形式组织，层次清晰
- **阴影效果**: 适当的阴影增强视觉层次
- **圆角设计**: 现代化的圆角元素

### 交互体验

- **点击外部关闭**: 所有模态框支持点击外部区域关闭
- **复制反馈**: 复制操作提供即时视觉反馈
- **加载状态**: 异步操作显示加载动画
- **错误处理**: 友好的错误提示和恢复建议

### 响应式设计

- **移动端适配**: 完整的移动端界面优化
- **断点设计**: 使用Tailwind CSS的响应式断点
- **触摸友好**: 按钮和交互元素适合触摸操作

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
- 多语言功能测试

## 🔧 开发

### 添加新功能

1. **后端更改**:

   - 在`src/backend/src/lib.rs`中添加新函数
   - 更新Candid接口
   - 添加测试

2. **前端更改**:
   - 在`src/frontend/src/components/`中添加新组件
   - 在`src/frontend/src/types/`中更新类型
   - 在`src/frontend/src/services/`中添加服务方法
   - 在`src/frontend/src/hooks/useLanguage.tsx`中添加多语言支持

### 代码质量

- **Rust**: 遵循Clippy和Rust FMT指南
- **TypeScript**: ESLint和Prettier配置
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

   - 设置生产罐子ID
   - 配置Internet Identity
   - 更新价格预言机端点

4. **验证部署**:
   - 测试所有功能
   - 验证身份认证
   - 检查数据集成
   - 测试多语言功能

### 安全考虑

- **访问控制**: 池子管理的管理员专用功能
- **输入验证**: 全面的参数验证
- **错误处理**: 整个系统的优雅错误处理
- **速率限制**: 为关键功能实施速率限制
- **身份验证**: 安全的Internet Identity集成

## 📚 API文档

### Candid接口

完整的Candid接口可在`src/backend/backend.did`中找到：

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

1. Fork仓库
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
- 添加多语言支持

## 📄 许可证

本项目采用MIT许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 🆘 支持

如需支持和问题：

- 在仓库中创建问题
- 查看文档
- 查看代码示例
- 使用提供的设置进行测试

## 🔄 更新日志

### 最新更新

- ✅ 添加多语言支持（中英文）
- ✅ 现代化UI设计，采用渐变背景和卡片式布局
- ✅ 完整的Internet Identity集成
- ✅ Principal ID和Account ID显示与管理
- ✅ 代币余额查询功能
- ✅ 响应式设计优化
- ✅ 交互式组件（模态框、复制功能等）
- ✅ 错误处理和用户反馈改进

查看[CHANGELOG.md](CHANGELOG.md)了解详细的更改和更新历史。

---

**为互联网计算机生态系统而构建 ❤️**
