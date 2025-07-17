# 本地环境配置说明

## 当前状态
✅ dfx 已重启并清理
✅ Internet Identity 已重新部署
✅ 后端已重新部署
✅ 静态资源可以正常加载

## 环境变量配置

请在 `src/frontend/.env` 文件中设置以下环境变量：

```env
VITE_DFX_NETWORK=local
VITE_USE_LOCAL_BACKEND=true
VITE_CANISTER_ID_BACKEND=uzt4z-lp777-77774-qaabq-cai
VITE_II_CANISTER_ID=uxrrr-q7777-77774-qaaaq-cai
```

## 测试步骤

1. **确保环境变量正确设置**
2. **重启前端服务**
   ```bash
   cd src/frontend
   npm run dev
   ```
3. **在浏览器中访问前端**
   ```
   http://localhost:5173
   ```
4. **点击登录按钮**
   - 应该跳转到：`http://127.0.0.1:4943/?canisterId=uxrrr-q7777-77774-qaaaq-cai`
   - 本地 II 页面应该正常加载（不再空白）

## 如果仍有问题

1. **清除浏览器缓存**
2. **检查浏览器控制台是否有错误**
3. **确认 dfx 正在运行**：`dfx ping`
4. **重新部署**：`dfx deploy`

## 登录流程

1. 点击登录 → 跳转到本地 II
2. 在本地 II 创建或选择身份
3. 登录成功 → 回到应用
4. 自动注册用户到本地后端
5. 显示用户信息

## 注意事项

- 本地 II 和本地后端都使用相同的签名验证机制
- 不会有主网 II + 本地后端的签名不匹配问题
- 所有操作都在本地环境中进行 