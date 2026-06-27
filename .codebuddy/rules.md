# 项目代码规范

## 通用规范
- 使用 TypeScript，所有文件包含类型定义
- 组件使用函数式组件 + Hooks
- 变量命名使用 camelCase，组件名使用 PascalCase
- 文件命名使用 kebab-case（如 file-upload.tsx）
- 所有注释和提示信息使用中文

## React 规范
- 优先使用 Server Components，需要交互时加 'use client'
- 状态管理优先使用 useState + useReducer，复杂场景用 Zustand
- 表单使用 react-hook-form + zod 验证
- 样式使用 Tailwind CSS，不写自定义 CSS

## API 规范
- API 路由使用 Next.js Route Handlers
- 所有 API 返回统一格式：{ code: number, data: T, message: string }
- 错误处理使用 try-catch，返回对应 HTTP 状态码
- 敏感操作需要验证用户身份

## 数据库规范
- 使用 Supabase 客户端操作数据库
- 查询使用 Supabase 的 query builder，不写原生 SQL（除非必要）
- 所有表启用 RLS（Row Level Security）
- 时间字段使用 timestamptz 类型
