/**
 * 用户管理API模块
 * 负责与后端用户管理API交互
 */
const UserAPI = {
    // API基础URL - 确保与后端服务器URL一致
    baseUrl: 'http://127.0.0.1:5000/api/v1',
    
    /**
     * 获取用户列表
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.limit - 每页数量
     * @param {string} params.name - 用户名过滤条件
     * @returns {Promise<Object>} 用户列表数据
     */
    async getUsers(params = {}) {
        try {
            // 构建查询字符串
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.name) queryParams.append('name', params.name);
            
            const queryString = queryParams.toString();
            const url = `${this.baseUrl}/users${queryString ? '?' + queryString : ''}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`获取用户列表失败: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message || '获取用户列表失败');
            }
        } catch (error) {
            console.error('获取用户列表出错:', error);
            throw error;
        }
    },
    
    /**
     * 获取用户详情
     * @param {number} userId - 用户ID
     * @returns {Promise<Object>} 用户详情
     */
    async getUserDetail(userId) {
        try {
            const response = await fetch(`${this.baseUrl}/users/${userId}`);
            if (!response.ok) {
                throw new Error(`获取用户详情失败: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === 'success') {
                return result.data.user;
            } else {
                throw new Error(result.message || '获取用户详情失败');
            }
        } catch (error) {
            console.error(`获取用户[${userId}]详情出错:`, error);
            throw error;
        }
    },
    
    /**
     * 创建新用户
     * @param {Object} userData - 用户数据
     * @param {string} userData.name - 用户名
     * @param {string} userData.password - 密码
     * @param {string} userData.role - 角色
     * @returns {Promise<Object>} 创建的用户信息
     */
    async createUser(userData) {
        try {
            // 将前端角色名称转换为后端角色代码
            if (userData.role) {
                userData.role = this.convertRoleToCode(userData.role);
            }
            
            const response = await fetch(`${this.baseUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                throw new Error(`创建用户失败: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === 'success') {
                // 将后端角色代码转换为前端角色名称
                if (result.data.user && result.data.user.role) {
                    result.data.user.role = this.convertCodeToRole(result.data.user.role);
                }
                return result.data;
            } else {
                throw new Error(result.message || '创建用户失败');
            }
        } catch (error) {
            console.error('创建用户出错:', error);
            throw error;
        }
    },
    
    /**
     * 更新用户信息
     * @param {number} userId - 用户ID
     * @param {Object} userData - 用户数据
     * @returns {Promise<Object>} 更新后的用户信息
     */
    async updateUser(userId, userData) {
        try {
            // 将前端角色名称转换为后端角色代码
            if (userData.role) {
                userData.role = this.convertRoleToCode(userData.role);
            }
            
            const response = await fetch(`${this.baseUrl}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                throw new Error(`更新用户失败: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === 'success') {
                // 将后端角色代码转换为前端角色名称
                if (result.data.user && result.data.user.role) {
                    result.data.user.role = this.convertCodeToRole(result.data.user.role);
                }
                return result.data;
            } else {
                throw new Error(result.message || '更新用户失败');
            }
        } catch (error) {
            console.error(`更新用户[${userId}]出错:`, error);
            throw error;
        }
    },
    
    /**
     * 删除用户
     * @param {number} userId - 用户ID
     * @returns {Promise<Object>} 删除结果
     */
    async deleteUser(userId) {
        try {
            const response = await fetch(`${this.baseUrl}/users/${userId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`删除用户失败: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message || '删除用户失败');
            }
        } catch (error) {
            console.error(`删除用户[${userId}]出错:`, error);
            throw error;
        }
    },
    
    /**
     * 用户登录
     * @param {string} name - 用户名
     * @param {string} password - 密码
     * @returns {Promise<Object>} 登录结果
     */
    async login(name, password) {
        try {
            console.log(`尝试登录用户: ${name}`);
            
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, password })
            });
            
            if (!response.ok) {
                throw new Error(`登录失败: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('登录响应:', result);
            
            if (result.status === 'success') {
                // 将后端角色代码转换为前端角色名称
                if (result.data.user && result.data.user.role) {
                    console.log(`原始角色代码: ${result.data.user.role}`);
                    result.data.user.role = this.convertCodeToRole(result.data.user.role);
                    console.log(`转换后角色: ${result.data.user.role}`);
                }
                return result.data;
            } else {
                throw new Error(result.message || '登录失败');
            }
        } catch (error) {
            console.error('登录出错:', error);
            throw error;
        }
    },
    
    /**
     * 将角色代码转换为角色名称
     * @param {string} code - 角色代码
     * @returns {string} 角色名称
     */
    convertCodeToRole(code) {
        console.log(`转换角色代码: ${code}, 类型: ${typeof code}`);
        
        // 确保进行严格类型比较
        switch(String(code)) {
            case '0': return 'admin';
            case '1': return 'buyer';
            case '2': return 'seller';
            default: 
                console.log(`未知角色代码 [${code}]，默认为买家`);
                return 'buyer';
        }
    },
    
    /**
     * 将角色名称转换为角色代码
     * @param {string} role - 角色名称
     * @returns {string} 角色代码
     */
    convertRoleToCode(role) {
        console.log(`转换角色名称: ${role}`);
        
        switch(role) {
            case 'admin': return '0';
            case 'buyer': return '1';
            case 'seller': return '2';
            default: 
                console.log(`未知角色名称 [${role}]，默认为买家代码`);
                return '1';
        }
    }
};

// 确保全局API可访问
window.UserAPI = UserAPI; 