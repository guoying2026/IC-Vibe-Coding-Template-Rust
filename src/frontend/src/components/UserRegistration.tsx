// 用户注册组件
// 处理新用户的注册流程

import React, { useState } from 'react'; // 导入React和useState
import { useLanguage } from '../hooks/useLanguage'; // 导入多语言Hook

// 组件属性接口
interface UserRegistrationProps {
  onRegister: (username: string) => Promise<void>; // 注册回调函数
  onCancel: () => void; // 取消回调函数
  isLoading?: boolean; // 加载状态
}

// 用户注册组件
export const UserRegistration: React.FC<UserRegistrationProps> = ({
  onRegister,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useLanguage(); // 多语言Hook
  const [username, setUsername] = useState(''); // 用户名状态
  const [error, setError] = useState(''); // 错误信息状态

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 阻止默认表单提交
    
    // 验证用户名
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    
    if (username.length < 3) {
      setError('用户名至少需要3个字符');
      return;
    }
    
    try {
      setError(''); // 清除错误信息
      await onRegister(username.trim()); // 调用注册函数
    } catch (error) {
      setError(error instanceof Error ? error.message : '注册失败');
    }
  };

  // 处理用户名输入变化
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value); // 更新用户名
    if (error) {
      setError(''); // 清除错误信息
    }
  };

  return (
    // 注册表单容器
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-md w-full">
        {/* 标题 */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          {t('register_user')}
        </h2>
        
        {/* 描述 */}
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          {t('register_description')}
        </p>
        
        {/* 注册表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 用户名输入框 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('username')}
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder={t('enter_username')}
              autoFocus
            />
          </div>
          
          {/* 错误信息显示 */}
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          {/* 按钮组 */}
          <div className="flex space-x-3 pt-4">
            {/* 取消按钮 */}
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            
            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('registering')}
                </div>
              ) : (
                t('register')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
