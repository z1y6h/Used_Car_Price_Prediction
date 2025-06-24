// 价格预测功能模块
const prediction = {
    // API基础URL
    baseUrl: 'http://127.0.0.1:5000/api/v1',
    
    // 存储编码映射关系
    encodingMaps: {
        makes: {},
        models: {},
        bodyTypes: {},
        transmissions: {},
        fuelTypes: {},
        colors: {},
        locations: {}
    },
    
    // 获取所有预测选项数据
    async loadAllOptions() {
        try {
            const response = await fetch(`${this.baseUrl}/prediction/options`);
            if (!response.ok) {
                throw new Error(`获取选项数据失败: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === 'success') {
                const data = result.data;
                
                // 创建编码映射并返回选项列表
                const makes = data.makes.map(item => {
                    this.encodingMaps.makes[item.Make] = item.Make_encoded;
                    return item.Make;
                });
                
                const bodyTypes = data.body_types.map(item => {
                    this.encodingMaps.bodyTypes[item.Body_Type] = item.Body_Type_encoded;
                    return item.Body_Type;
                });
                
                const transmissions = data.transmissions.map(item => {
                    this.encodingMaps.transmissions[item.Transmission] = item.Transmission_encoded;
                    return item.Transmission;
                });
                
                const fuelTypes = data.fuel_types.map(item => {
                    this.encodingMaps.fuelTypes[item.Fuel_Type] = item.Fuel_Type_encoded;
                    return item.Fuel_Type;
                });
                
                const colors = data.colors.map(item => {
                    this.encodingMaps.colors[item.Color] = item.Color_encoded;
                    return item.Color;
                });
                
                return {
                    makes,
                    bodyTypes,
                    transmissions,
                    fuelTypes,
                    colors
                };
            } else {
                throw new Error(result.message || '获取选项数据失败');
            }
        } catch (error) {
            console.error('获取预测选项数据出错:', error);
            // 返回空数组，避免前端报错
            return {
                makes: [],
                bodyTypes: [],
                transmissions: [],
                fuelTypes: [],
                colors: []
            };
        }
    },
    
    // 根据品牌获取型号列表
    async getModelsByMake(make) {
        if (!make) return [];
        
        try {
            const response = await fetch(`${this.baseUrl}/prediction/models?make=${encodeURIComponent(make)}`);
            if (!response.ok) {
                throw new Error(`获取型号数据失败: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === 'success') {
                const modelsList = result.data.models.map(item => {
                    // 保存编码映射
                    this.encodingMaps.models[item.Model] = item.Model_encoded;
                    return item.Model;
                });
                
                return modelsList;
            } else {
                throw new Error(result.message || '获取型号数据失败');
            }
        } catch (error) {
            console.error(`获取品牌[${make}]的型号数据出错:`, error);
            return [];
        }
    },
    
    // 获取同型号车辆信息
    async getSimilarModels(make, model) {
        if (!make || !model) return null;
        
        console.log(`开始获取同型号车辆信息: 品牌=${make}, 型号=${model}`);
        
        try {
            const url = `${this.baseUrl}/cars/similar-models?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
            console.log(`请求URL: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`获取同型号车辆失败: ${response.status}`, errorText);
                throw new Error(`获取同型号车辆失败: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('获取同型号车辆响应:', result);
            
            if (result.status === 'success') {
                // 检查是否真的有数据
                if (result.data.similar_cars && result.data.similar_cars.length > 0) {
                    console.log(`成功获取到 ${result.data.similar_cars.length} 辆同型号车辆`);
                    // 打印第一条数据作为示例
                    console.log('示例数据:', result.data.similar_cars[0]);
                    
                    // 初始化分页相关数据
                    const data = result.data;
                    const paginatedData = this.paginateSimilarCars(data.similar_cars, 1, 10); // 第1页，每页10条
                    
                    return {
                        ...data,
                        pagination: {
                            currentPage: 1,
                            pageSize: 10,
                            totalPages: Math.ceil(data.similar_cars.length / 10)
                        }
                    };
                } else {
                    console.warn('API返回成功但没有车辆数据');
                    return {
                        similar_cars: [],
                        stats: {
                            avg_price: 0,
                            min_price: 0,
                            max_price: 0,
                            count: 0
                        },
                        price_by_year: [],
                        pagination: {
                            currentPage: 1,
                            pageSize: 10,
                            totalPages: 0
                        }
                    };
                }
            } else {
                console.error('API返回错误:', result.message);
                throw new Error(result.message || '获取同型号车辆数据失败');
            }
        } catch (error) {
            console.error('获取同型号车辆出错:', error);
            return null;
        }
    },
    
    // 分页处理同型号车辆数据
    paginateSimilarCars(cars, page, pageSize) {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return cars.slice(startIndex, endIndex);
    },
    
    // 预测车辆价格
    async predictPrice(carData) {
        try {
            // 1. 将用户选择的数据转换为编码值
            const encodedData = {
                Make_encoded: this.encodingMaps.makes[carData.make],
                Model_encoded: this.encodingMaps.models[carData.model],
                Year: carData.year,
                Mileage: carData.mileage,
                Cylinders: carData.cylinders || 4, // 使用用户选择的气缸数
                Body_Type_encoded: this.encodingMaps.bodyTypes[carData.body_type],
                Transmission_encoded: this.encodingMaps.transmissions[carData.transmission],
                Fuel_Type_encoded: this.encodingMaps.fuelTypes[carData.fuel_type],
                Color_encoded: this.encodingMaps.colors[carData.color],
                Location_encoded: 0 // 默认值设为0，因为我们移除了location选择
            };
            
            // 对编码数据进行调试输出，查看是否有undefined或null
            console.log('发送预测数据:', encodedData);
            
            // 2. 发送API请求
            const response = await fetch(`${this.baseUrl}/prediction/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(encodedData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('服务器返回错误:', errorText);
                throw new Error(`预测请求失败: ${response.status} - ${errorText}`);
            }
            
            // 3. 处理返回结果
            const result = await response.json();
            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message || '价格预测失败');
            }
        } catch (error) {
            console.error('价格预测出错:', error);
            throw error;
        }
    },
    
    // 生成按年份价格比较数据
    generatePriceComparisonData(currentPrice) {
        const yearlyDepreciation = 0.08; // 每年8%的贬值
        const data = [];
        
        // 从当前价格的-4年到+4年（共9个数据点）
        for (let i = -4; i <= 4; i++) {
            const yearOffset = i;
            const factor = Math.pow(1 - yearlyDepreciation, -yearOffset);
            
            data.push({
                year: new Date().getFullYear() + yearOffset,
                price: Math.round(currentPrice * factor)
            });
        }
        
        return data;
    },
    
    // 生成历史价格趋势数据（用于图表）
    generateHistoricalTrend(currentPrice) {
        const months = [];
        const prices = [];
        
        // 生成过去12个月的数据
        const today = new Date();
        let basePrice = currentPrice * 1.15; // 从1年前的价格开始（约高15%）
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(today.getMonth() - i);
            
            // 每个月贬值约0.7%，加上一些随机波动
            const monthlyFactor = 0.993 + (Math.random() * 0.014 - 0.007);
            basePrice *= monthlyFactor;
            
            const monthStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' }).replace('/', '-');
            months.push(monthStr);
            prices.push(Math.round(basePrice));
        }
        
        // 生成未来6个月的预测数据
        let futurePriceBase = currentPrice;
        for (let i = 1; i <= 6; i++) {
            const date = new Date();
            date.setMonth(today.getMonth() + i);
            
            // 每个月贬值约0.7%，加上一些随机波动（但波动更大，因为是预测）
            const monthlyFactor = 0.993 + (Math.random() * 0.02 - 0.01);
            futurePriceBase *= monthlyFactor;
            
            const monthStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' }).replace('/', '-');
            months.push(monthStr);
            prices.push(Math.round(futurePriceBase));
        }
        
        return { months, prices };
    }
}; 