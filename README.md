# 游乐园票务与会员管理平台

一个功能完善的游乐园票务与会员管理系统，采用前后端分离架构。

## 功能特性

### 1. 票务管理系统
- **四种门票类型**：单日票、两日票、午后票（限下午2点后入园）、夜场票
- **淡旺季差异化定价**：支持配置季节规则，自动识别旺季/淡季价格
- **早鸟票折扣**：提前7天及以上购票享9折优惠，系统自动计算

### 2. 年卡管理系统
- **三种年卡类型**：单人年卡、亲子年卡（1成人1儿童）、家庭年卡（2成人1儿童）
- **年卡权益**：
  - 全年无限次入园
  - 园区内购物及餐饮9折优惠
  - 生日月免费携带1位同行人员
  - 专属快速通道入园特权
- **有效期管理**：精确记录激活日期与到期日期
- **身份证绑定**：入园时身份证信息比对，防止一卡多用

### 3. 消费管理系统
- **多场景消费**：商店购物、餐饮消费、付费游乐项目
- **多种支付方式**：刷手环支付、扫码支付、现金、年卡扣款
- **结算方式**：普通游客离园前统一结算，年卡会员可直接扣款

### 4. 会员服务系统
- **年卡到期提醒**：到期前30天显示续费提醒
- **续费优惠管理**：可配置不同的续费套餐及折扣方案

### 5. 客流管理系统
- **实时客流监控**：实时显示在园人数
- **客流预警机制**：
  - 达到最大承载量80%时启动限流
  - 达到最大承载量100%时停止售票

### 6. 系统特性
- 完整的用户角色权限管理（管理员/操作员/收银员/会员）
- 丰富的数据统计分析功能
- 交易数据安全可靠

## 技术栈

### 后端
- Node.js + Express
- PostgreSQL + Sequelize ORM
- JWT 认证
- bcryptjs 密码加密

### 前端
- Vue 3 + Composition API
- Ant Design Vue 组件库
- Pinia 状态管理
- Vue Router 路由
- ECharts 图表
- Vite 构建工具

## 项目结构

```
amusement-park-management/
├── server/                    # 后端服务
│   ├── src/
│   │   ├── controllers/       # 控制器
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由
│   │   ├── middlewares/       # 中间件
│   │   ├── utils/             # 工具函数
│   │   ├── database/          # 数据库配置
│   │   └── app.js             # 应用入口
│   ├── .env                   # 环境配置
│   └── package.json
├── client/                    # 前端应用
│   ├── src/
│   │   ├── api/               # API 接口
│   │   ├── views/             # 页面组件
│   │   ├── layouts/           # 布局组件
│   │   ├── components/        # 公共组件
│   │   ├── stores/            # 状态管理
│   │   ├── router/            # 路由配置
│   │   ├── utils/             # 工具函数
│   │   └── styles/            # 全局样式
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── package.json               # 根项目配置
```

## 快速开始

### 环境要求
- Node.js >= 16.x
- PostgreSQL >= 12.x
- npm 或 yarn

### 安装步骤

#### 1. 克隆项目
```bash
git clone <repository-url>
cd amusement-park-management
```

#### 2. 配置数据库
创建 PostgreSQL 数据库：
```sql
CREATE DATABASE amusement_park;
```

修改 `server/.env` 文件中的数据库配置：
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=amusement_park
DB_USER=postgres
DB_PASSWORD=your_password
```

#### 3. 安装依赖
```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

或者使用一键安装：
```bash
npm run install:all
```

#### 4. 初始化数据库
```bash
cd server
npm run init:db
```

该命令会创建数据库表并初始化默认数据：
- 管理员账户：admin / admin123
- 操作员账户：operator / operator123
- 收银员账户：cashier / cashier123
- 4 种门票类型
- 3 种年卡类型
- 季节规则
- 续费套餐

#### 5. 启动服务

**方式一：同时启动前后端**
```bash
npm run dev
```

**方式二：分别启动**

启动后端服务（端口 3000）：
```bash
cd server
npm run dev
```

启动前端服务（端口 5173）：
```bash
cd client
npm run dev
```

#### 6. 访问系统
- 前端地址：http://localhost:5173
- 后端 API：http://localhost:3000/api
- 健康检查：http://localhost:3000/api/health

## 默认账户

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 拥有所有权限 |
| 操作员 | operator | operator123 | 票务/年卡/客流/消费操作 |
| 收银员 | cashier | cashier123 | 消费管理权限 |

## API 接口

### 认证接口
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新个人信息
- `PUT /api/auth/password` - 修改密码

### 票务接口
- `GET /api/tickets/types` - 获取门票类型列表
- `POST /api/tickets/calculate` - 计算票价
- `POST /api/tickets/orders` - 创建门票订单
- `GET /api/tickets/orders` - 获取订单列表
- `GET /api/tickets/orders/:id` - 获取订单详情
- `POST /api/tickets/verify` - 验票
- `POST /api/tickets/orders/:id/refund` - 退款

### 年卡接口
- `GET /api/annual-cards/types` - 获取年卡类型
- `POST /api/annual-cards/purchase` - 购买年卡
- `GET /api/annual-cards` - 获取年卡列表
- `GET /api/annual-cards/:id` - 获取年卡详情
- `POST /api/annual-cards/verify` - 验证年卡
- `POST /api/annual-cards/:id/recharge` - 充值
- `POST /api/annual-cards/:id/renewal` - 续费

### 消费接口
- `POST /api/consumptions` - 创建消费记录
- `GET /api/consumptions` - 获取消费记录
- `POST /api/consumptions/:id/settle` - 结算
- `POST /api/consumptions/settle/wristband` - 手环结算
- `POST /api/consumptions/:id/refund` - 退款

### 客流接口
- `GET /api/visitors/current` - 获取当前客流
- `GET /api/visitors/records` - 获取客流记录
- `GET /api/visitors/today` - 今日统计
- `GET /api/visitors/hourly-trend` - 小时趋势
- `POST /api/visitors/:id/exit` - 出园登记

### 统计接口
- `GET /api/statistics/dashboard` - 仪表盘数据
- `GET /api/statistics/sales` - 销售统计
- `GET /api/statistics/ticket-types` - 票种统计
- `GET /api/statistics/card-types` - 年卡统计
- `GET /api/statistics/consumption-categories` - 消费分类统计
- `GET /api/statistics/expiring-cards` - 到期年卡

## 系统配置

可在 `server/.env` 中配置以下参数：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| PARK_MAX_CAPACITY | 10000 | 园区最大承载量 |
| EARLY_BIRD_DAYS | 7 | 早鸟票提前天数 |
| EARLY_BIRD_DISCOUNT | 0.9 | 早鸟票折扣率 |
| MEMBER_DISCOUNT | 0.9 | 会员消费折扣率 |
| RENEWAL_REMIND_DAYS | 30 | 续费提醒天数 |

## 开发说明

### 后端开发
- 使用 Sequelize ORM 操作数据库
- 控制器处理业务逻辑
- 中间件处理认证和权限
- 统一响应格式：`{ success: boolean, message: string, data: any }`

### 前端开发
- 使用 Vue 3 Composition API
- Pinia 管理用户状态
- axios 封装请求，自动处理 token
- 路由级权限控制

## 安全说明

- 密码使用 bcryptjs 加密存储
- JWT Token 认证机制
- 接口级别的角色权限控制
- SQL 注入防护（Sequelize 参数化查询）
- XSS 防护（Vue 模板自动转义）

## License

MIT
