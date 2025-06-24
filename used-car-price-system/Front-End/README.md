# 二手车价格系统

这是一个使用Vue框架基于HTML/CSS/JavaScript开发的二手车价格系统前端框架，用于展示二手车信息、数据可视化、用户管理和价格预测等功能。

## 功能模块

### 0. 用户登录

- 访问首页前，先选择用户身份（买家、卖家、管理员）
- 每个角色的功能如下：
	特有功能：
		买家可以根据输入的车辆信息，模糊匹配查询数据库中的车辆，并展示在前端页面
		卖家可以输入具体的车辆信息，通过训练好的模型，进行价格预测，并展示在前端页面
		管理员拥有买家和卖家的使用功能，并增加用户管理功能，可以对用户进行增删改查
	共有功能：
		数据可视化


### 1. 车辆查询

- 多条件筛选（品牌、价格区间、车龄、里程等）
- 结果排序（价格、年份、里程等）
- 分页显示

### 2. 数据可视化



### 3. 价格预测

- 基于车辆参数的价格预测（品牌、车型、年份、里程、燃油类型等）
- 预测结果展示

### 4. 用户管理

- 增删改查用户数据





## 技术栈
- 使用Vue前端框架
- HTML5
- CSS3（响应式设计）
- JavaScript（原生）
- ECharts（数据可视化）

## 文件结构

```
Front-End/
├── index.html (主页面)
├── css/ (样式文件夹)
│   └── style.css
├── js/ (JavaScript文件夹)
│   ├── main.js (主要脚本)
│   ├── charts.js (图表相关脚本)
│   └── prediction.js (价格预测相关脚本)
└── pages/ (子页面)
    ├── search.html (车辆查询页面)
    ├── visualization.html (数据可视化页面)
    ├── prediction.html (价格预测页面)
    └── user.html (用户管理页面)
```


## 数据库结构

### 车辆信息表 (car_info)
- id (int, 主键, 自增)
- Make (text)
- Model (text)
- Year (bigint)
- Price (bigint)
- Mileage (bigint)
- Body_Type (varchar(50))
- Cylinders (bigint)
- Transmission (text)
- Fuel_Type (varchar(50))
- Color (text)
- Location (text)
- Date (text)
- Description (text)
- Make_encoded (bigint)
- Body_Type_encoded (varchar(50))
- Transmission_encoded (bigint)
- Fuel_Type_encoded (varchar(50))
- Color_encoded (bigint)
- Location_encoded (bigint)
- Model_encoded (bigint)

### 用户信息表 (user_info)
- id (int, 主键, 自增)
- name (varchar(50))
- password (varchar(50))
- role (varchar(50))


## 使用说明

1. 直接打开 `index.html` 即可访问系统主页
2. 无需安装额外依赖，所有必要的库通过CDN引入
3. 目前为前端框架，无实际后端功能，数据均为模拟数据

## 开发计划

- [ ] 对接后端API，实现真实数据交互
- [ ] 添加更多数据可视化图表
- [ ] 使用已经训练好的模型进行价格预测
- [ ] 增加更多筛选条件和排序选项