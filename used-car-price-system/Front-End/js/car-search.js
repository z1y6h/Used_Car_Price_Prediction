/**
 * 车辆查询相关API调用
 */

// API基础URL
const API_BASE_URL = 'http://127.0.0.1:5000/api/v1';

// 车辆查询API
const CarAPI = {
    /**
     * 获取车辆列表
     * @param {Object} params - 查询参数对象
     * @returns {Promise} - 返回Promise对象
     */
    getCars(params = {}) {
        // 构建查询字符串
        const queryParams = new URLSearchParams();
        
        // 添加分页参数
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        
        // 添加品牌和型号
        if (params.make) queryParams.append('make', params.make);
        if (params.model) queryParams.append('model', params.model);
        
        // 添加年份范围
        if (params.year_min) queryParams.append('year_min', params.year_min);
        if (params.year_max) queryParams.append('year_max', params.year_max);
        
        // 添加价格范围
        if (params.price_min) queryParams.append('price_min', params.price_min);
        if (params.price_max) queryParams.append('price_max', params.price_max);
        
        // 添加里程范围
        if (params.mileage_min) queryParams.append('mileage_min', params.mileage_min);
        if (params.mileage_max) queryParams.append('mileage_max', params.mileage_max);
        
        // 添加其他筛选条件
        if (params.body_type) queryParams.append('body_type', params.body_type);
        if (params.fuel_type) queryParams.append('fuel_type', params.fuel_type);
        if (params.transmission) queryParams.append('transmission', params.transmission);
        if (params.color) queryParams.append('color', params.color);
        if (params.location) queryParams.append('location', params.location);
        
        // 发起请求
        const url = `${API_BASE_URL}/cars?${queryParams.toString()}`;
        
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API错误: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    return data.data;
                } else {
                    throw new Error(data.message || '获取车辆数据失败');
                }
            });
    },
    
    /**
     * 获取车辆详情
     * @param {number} carId - 车辆ID
     * @returns {Promise} - 返回Promise对象
     */
    getCarDetail(carId) {
        return fetch(`${API_BASE_URL}/cars/${carId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API错误: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    return data.data.car;
                } else {
                    throw new Error(data.message || '获取车辆详情失败');
                }
            });
    },

    /**
     * 获取所有筛选选项
     * @returns {Promise} - 返回Promise对象，包含所有筛选选项数据
     */
    getFilterOptions() {
        return fetch(`${API_BASE_URL}/prediction/options`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API错误: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    return data.data;
                } else {
                    throw new Error(data.message || '获取筛选选项失败');
                }
            });
    }
};

// 导出API对象
window.CarAPI = CarAPI; 