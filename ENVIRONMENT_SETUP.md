# 环境配置说明

## 问题描述

当前遇到的问题是：使用主网 Internet Identity 登录后，尝试连接到本地后端时出现签名验证错误。

这是因为主网 II 的身份签名无法在本地环境中验证。

## 解决方案

### 方案1：主网 II + 主网后端（推荐）

**优点：**

- 使用稳定的主网 Internet Identity
- 无需本地 dfx 运行
- 签名验证正常

**配置：**

```bash
# 在 src/frontend/.env 文件中设置：
VITE_DFX_NETWORK=ic
# VITE_USE_LOCAL_BACKEND=false  # 注释掉或删除此行
VITE_CANISTER_ID_BACKEND=你的主网后端canister_id
```

**步骤：**

1. 将后端 canister 部署到主网
2. 获取主网 canister ID
3. 更新环境变量
4. 重启前端服务

### 方案2：本地 II + 本地后端

**优点：**

- 完全本地开发环境
- 无需主网部署

**配置：**

```bash
# 在 src/frontend/.env 文件中设置：
VITE_DFX_NETWORK=local
VITE_USE_LOCAL_BACKEND=true
VITE_CANISTER_ID_BACKEND=u6s2n-gx777-77774-qaaba-cai
```

**步骤：**

1. 确保 dfx 正在运行：`dfx start --background`
2. 部署本地 II：`dfx deploy internet_identity`
3. 部署本地后端：`dfx deploy backend`
4. 更新环境变量
5. 重启前端服务

## 当前问题

从日志可以看出，你当前使用的是：

- `VITE_DFX_NETWORK=ic`（主网 II）
- `VITE_USE_LOCAL_BACKEND=true`（本地后端）

这种组合会导致签名验证失败。

## 建议

推荐使用方案1（主网 II + 主网后端），因为：

1. 主网 II 更稳定可靠
2. 避免本地环境配置复杂性
3. 更接近生产环境

如果你选择方案1，需要：

1. 将后端部署到主网
2. 修改环境变量配置
3. 重启前端服务
