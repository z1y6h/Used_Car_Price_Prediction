// 登录页面Vue实例
if (document.querySelector('#app') && window.location.pathname.endsWith('index.html')) {
    new Vue({
        el: '#app',
        data: {
            username: '',
            password: '',
            selectedRole: 'buyer', // 默认选择买家角色
            isLoading: false,
            errorMessage: ''
        },
        methods: {
            selectRole(role) {
                this.selectedRole = role;
                console.log(`选择角色: ${role}`);
            },
            async login() {
                // 使用后端API进行登录验证
                if (!this.username || !this.password) {
                    alert('请输入用户名和密码');
                    return;
                }

                this.isLoading = true;
                this.errorMessage = '';

                try {
                    console.log(`开始登录处理，用户名: ${this.username}, 角色: ${this.selectedRole}`);
                    
                    // 调用登录API
                    const result = await UserAPI.login(this.username, this.password);
                    
                    // 获取用户信息
                    const user = result.user;
                    console.log('登录成功，用户信息:', user);
                    
                    // 检查用户角色是否与所选角色匹配
                    console.log(`比较角色: 选择=${this.selectedRole}, 实际=${user.role}`);
                    
                    if (user.role !== this.selectedRole) {
                        alert(`您选择的角色是${this.getRoleName(this.selectedRole)}，但您的实际角色是${this.getRoleName(user.role)}，请选择正确的角色后再登录。`);
                        this.isLoading = false;
                        return;
                    }
                    
                    // 存储用户信息到sessionStorage
                    sessionStorage.setItem('currentUser', JSON.stringify({
                        id: user.id,
                        username: user.name,
                        role: user.role
                    }));
                    
                    console.log(`用户角色: ${user.role}，准备跳转页面`);
                    
                    // 根据角色跳转到相应页面
                    switch(user.role) {
                        case 'buyer':
                            window.location.href = 'pages/search.html';
                            break;
                        case 'seller':
                            window.location.href = 'pages/prediction.html';
                            break;
                        case 'admin':
                            window.location.href = 'pages/user.html';
                            break;
                        default:
                            console.log(`未知角色 [${user.role}]，默认跳转到搜索页面`);
                            window.location.href = 'pages/search.html';
                    }
                } catch (error) {
                    console.error('登录失败:', error);
                    alert('登录失败: ' + error.message);
                } finally {
                    this.isLoading = false;
                }
            },
            
            getRoleName(role) {
                switch(role) {
                    case 'admin': return '管理员';
                    case 'buyer': return '买家';
                    case 'seller': return '卖家';
                    default: return '未知';
                }
            }
        }
    });
}

// 导航栏组件
Vue.component('site-navbar', {
    template: `
        <div class="navbar">
            <div class="navbar-container">
                <div class="navbar-logo">
                    <i class="bi bi-car-front"></i> 二手车价格系统
                </div>
                <div class="navbar-menu">
                    <div 
                        v-for="(item, index) in navItems" 
                        :key="index"
                        class="navbar-item"
                        :class="{active: isActive(item.link)}"
                        @click="navigate(item.link)"
                    >
                        <i :class="'bi ' + item.icon"></i> {{ item.text }}
                    </div>
                    <div class="navbar-user">
                        <i class="bi bi-person-circle"></i>
                        <span class="username">{{ currentUser ? currentUser.username : '未登录' }}</span>
                    </div>
                    <div class="navbar-item" @click="logout">
                        <i class="bi bi-box-arrow-right"></i> 退出登录
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            currentUser: null,
            navItems: []
        };
    },
    created() {
        // 获取当前用户信息
        const userJson = sessionStorage.getItem('currentUser');
        if (userJson) {
            this.currentUser = JSON.parse(userJson);
            
            // 根据用户角色设置导航菜单
            this.setNavItems();
        } else {
            // 未登录则跳转到登录页
            window.location.href = '../index.html';
        }
    },
    methods: {
        setNavItems() {
            // 通用导航项
            const commonItems = [
                { text: '数据可视化', link: 'visualization.html', icon: 'bi-graph-up' }
            ];
            
            // 根据角色添加特定导航项
            switch(this.currentUser.role) {
                case 'buyer':
                    this.navItems = [
                        { text: '车辆查询', link: 'search.html', icon: 'bi-search' },
                        ...commonItems
                    ];
                    break;
                case 'seller':
                    this.navItems = [
                        { text: '价格预测', link: 'prediction.html', icon: 'bi-calculator' },
                        ...commonItems
                    ];
                    break;
                case 'admin':
                    this.navItems = [
                        { text: '车辆查询', link: 'search.html', icon: 'bi-search' },
                        { text: '价格预测', link: 'prediction.html', icon: 'bi-calculator' },
                        ...commonItems,
                        { text: '用户管理', link: 'user.html', icon: 'bi-people' }
                    ];
                    break;
            }
        },
        isActive(link) {
            return window.location.pathname.endsWith(link);
        },
        navigate(link) {
            window.location.href = link;
        },
        logout() {
            // 清除会话数据并返回登录页
            sessionStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        }
    }
});

// 检查页面中是否有导航栏元素
if (document.querySelector('#navbar')) {
    new Vue({
        el: '#navbar'
    });
}

// 模拟数据
const mockData = {
    // 车辆数据
    cars: [
        { id: 1, make: '丰田', model: '卡罗拉', year: 2018, price: 118000, mileage: 35000, fuel_type: '汽油', transmission: '自动', body: '轿车', location: '北京' },
        { id: 2, make: '本田', model: '雅阁', year: 2019, price: 168000, mileage: 28000, fuel_type: '汽油', transmission: '自动', body: '轿车', location: '上海' },
        { id: 3, make: '大众', model: '途观', year: 2017, price: 158000, mileage: 45000, fuel_type: '汽油', transmission: '自动', body: 'SUV', location: '广州' },
        { id: 4, make: '宝马', model: '3系', year: 2018, price: 268000, mileage: 32000, fuel_type: '汽油', transmission: '自动', body: '轿车', location: '深圳' },
        { id: 5, make: '奔驰', model: 'C级', year: 2019, price: 298000, mileage: 25000, fuel_type: '汽油', transmission: '自动', body: '轿车', location: '北京' },
        { id: 6, make: '奥迪', model: 'A4L', year: 2018, price: 278000, mileage: 30000, fuel_type: '汽油', transmission: '自动', body: '轿车', location: '上海' },
        { id: 7, make: '现代', model: '途胜', year: 2017, price: 126000, mileage: 42000, fuel_type: '汽油', transmission: '自动', body: 'SUV', location: '广州' },
        { id: 8, make: '福特', model: '福克斯', year: 2018, price: 96000, mileage: 38000, fuel_type: '汽油', transmission: '自动', body: '轿车', location: '深圳' },
        { id: 9, make: '日产', model: '轩逸', year: 2019, price: 108000, mileage: 26000, fuel_type: '汽油', transmission: '自动', body: '轿车', location: '北京' },
        { id: 10, make: '马自达', model: '阿特兹', year: 2018, price: 156000, mileage: 32000, fuel_type: '汽油', transmission: '自动', body: '轿车', location: '上海' }
    ],
    
    // 用户数据
    users: [
        { id: 1, name: 'buyer1', password: '123456', role: 'buyer' },
        { id: 2, name: 'seller1', password: '123456', role: 'seller' },
        { id: 3, name: 'admin1', password: '123456', role: 'admin' }
    ]
}; 