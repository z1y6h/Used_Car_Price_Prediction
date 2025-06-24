/**
 * 可视化API模块
 * 负责与后端数据可视化API交互
 */
const VisualizationAPI = {
    // API基础URL
    baseUrl: 'http://127.0.0.1:5000/api/v1',
    
    // 请求状态跟踪
    requestStatus: {
        loading: false,
        error: null,
        lastUpdated: null
    },
    
    /**
     * 创建一个带有超时和重试功能的fetch请求
     * @param {string} url - 请求的URL
     * @param {Object} options - fetch选项
     * @returns {Promise} - fetch的Promise对象
     */
    async enhancedFetch(url, options = {}) {
        this.requestStatus.loading = true;
        this.requestStatus.error = null;
        
        // 默认超时时间5秒
        const timeout = options.timeout || 5000;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        const fetchOptions = {
            ...options,
            signal: controller.signal,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json'
            }
        };
        
        // 重试逻辑
        let retries = 3;
        let lastError = null;
        
        while (retries > 0) {
            try {
                const response = await fetch(url, fetchOptions);
                clearTimeout(id);
                
                this.requestStatus.loading = false;
                this.requestStatus.lastUpdated = new Date();
                
                if (!response.ok) {
                    throw new Error(`HTTP错误: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                lastError = error;
                retries--;
                
                if (error.name === 'AbortError') {
                    throw new Error('请求超时，请稍后再试');
                }
                
                if (retries === 0) {
                    break;
                }
                
                // 重试等待时间增加
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        this.requestStatus.loading = false;
        this.requestStatus.error = lastError.message;
        throw new Error(`请求失败: ${lastError.message}`);
    },
    
    /**
     * 获取可视化图表类型列表
     * @returns {Promise<Array>} 图表类型列表
     */
    async getChartTypes() {
        try {
            const data = await this.enhancedFetch(`${this.baseUrl}/visualization/charts`);
            
            if (data.status === 'success') {
                return data.data.chart_types;
            } else {
                throw new Error(data.message || '获取图表类型失败');
            }
        } catch (error) {
            console.error('获取图表类型出错:', error);
            this.requestStatus.error = error.message;
            return [];
        }
    },
    
    /**
     * 获取指定类型的图表数据
     * @param {string} chartType - 图表类型
     * @returns {Promise<Object>} 图表数据
     */
    async getChartData(chartType) {
        try {
            const data = await this.enhancedFetch(`${this.baseUrl}/visualization/${chartType}`);
            
            if (data.status === 'success') {
                return { chartType, data: data.data, error: null };
            } else {
                throw new Error(data.message || '获取图表数据失败');
            }
        } catch (error) {
            console.error(`获取【${chartType}】图表数据出错:`, error);
            return { chartType, data: null, error: error.message };
        }
    },
    
    /**
     * 获取所有图表数据
     * @returns {Promise<Array>} 所有图表数据的数组
     */
    async getAllChartData() {
        try {
            // 首先获取所有图表类型
            const chartTypes = await this.getChartTypes();
            if (!chartTypes || chartTypes.length === 0) {
                throw new Error('未获取到图表类型');
            }
            
            // 为每种图表类型创建请求Promise
            const promises = chartTypes.map(chartType => this.getChartData(chartType));
            
            // 并行获取所有图表数据
            return await Promise.all(promises);
        } catch (error) {
            console.error('获取所有图表数据出错:', error);
            this.requestStatus.error = error.message;
            return [];
        }
    },
    
    /**
     * 下载图表数据为CSV
     * @param {string} chartType - 图表类型
     * @returns {Promise<string>} CSV数据URL
     */
    async downloadChartDataCSV(chartType) {
        try {
            const chartData = await this.getChartData(chartType);
            if (chartData.error) {
                throw new Error(chartData.error);
            }
            
            const data = chartData.data;
            let csvContent = '';
            
            // 处理不同类型的图表数据
            if (data.chart_type === 'scatter') {
                // 散点图数据
                const headers = Object.keys(data.data[0]).join(',');
                const rows = data.data.map(item => Object.values(item).join(',')).join('\n');
                csvContent = `${headers}\n${rows}`;
            } else if (data.chart_type === 'bar') {
                // 柱状图数据
                const headers = Object.keys(data.data[0]).join(',');
                const rows = data.data.map(item => Object.values(item).join(',')).join('\n');
                csvContent = `${headers}\n${rows}`;
            } else if (data.chart_type === 'pie') {
                // 饼图数据
                const headers = `${data.label_field},${data.value_field}`;
                const rows = data.data.map(item => `${item[data.label_field]},${item[data.value_field]}`).join('\n');
                csvContent = `${headers}\n${rows}`;
            }
            
            // 创建下载链接
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error(`下载【${chartType}】图表数据出错:`, error);
            this.requestStatus.error = error.message;
            throw error;
        }
    },
    
    /**
     * 获取请求状态
     * @returns {Object} 当前请求状态
     */
    getRequestStatus() {
        return { ...this.requestStatus };
    },
    
    /**
     * 重置错误状态
     */
    clearError() {
        this.requestStatus.error = null;
    }
};

// 确保全局API可访问
window.VisualizationAPI = VisualizationAPI; 