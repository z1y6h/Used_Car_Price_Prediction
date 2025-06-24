// 图表功能模块
const charts = {
    chartInstances: {},
    chartData: {}, // 存储API返回的图表数据
    errorCallbacks: [], // 错误回调函数集合
    loadingCallbacks: [], // 加载状态回调函数集合

    // 初始化所有图表
    initAllCharts() {
        // 显示加载中的状态
        this.showLoadingForAllCharts();
        this._triggerLoadingCallbacks(true);
        
        // 从API获取所有图表数据
        VisualizationAPI.getAllChartData().then(results => {
            // 记录是否有错误发生
            let hasErrors = false;
            let errorMessages = [];
            
            // 存储获取到的数据
            results.forEach(result => {
                if (!result.error) {
                    this.chartData[result.chartType] = result.data;
                } else {
                    hasErrors = true;
                    errorMessages.push(`获取 ${result.chartType} 图表数据失败: ${result.error}`);
                }
            });
            
            // 初始化各图表
            this.initPriceRangeChart();
            this.initBrandPriceChart();
            this.initPriceTrendChart();
            this.initAgePriceChart();
            this.initYearDistributionChart();
            this.initBodyTypeChart();
            this.initMileageDistributionChart();
            this.initLocationDistributionChart();
            
            // 调整所有图表大小以确保正确显示
            setTimeout(() => {
                this.resizeAllCharts();
                this._triggerLoadingCallbacks(false);
                
                // 如果有错误，触发错误回调
                if (hasErrors) {
                    this._triggerErrorCallbacks(errorMessages.join('\n'));
                }
            }, 300);
        }).catch(error => {
            console.error('获取图表数据失败:', error);
            this._triggerLoadingCallbacks(false);
            this._triggerErrorCallbacks(`获取图表数据失败: ${error.message || '未知错误'}`);
            
            // 显示错误状态给用户
            this.showErrorForAllCharts(error.message || '未知错误，请检查后端服务是否正常运行');
        });
    },

    // 调整所有图表大小
    resizeAllCharts() {
        Object.values(this.chartInstances).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    },

    // 为所有图表显示加载中状态
    showLoadingForAllCharts() {
        const chartIds = [
            'price-range-chart',
            'brand-price-chart',
            'price-trend-chart',
            'age-price-chart',
            'year-distribution-chart',
            'body-type-chart',
            'mileage-distribution-chart',
            'location-distribution-chart'
        ];
        
        chartIds.forEach(chartId => {
            const chartDom = document.getElementById(chartId);
            if (chartDom) {
                const chart = echarts.init(chartDom);
                chart.showLoading({
                    text: '数据加载中...',
                    color: '#4361ee',
                    textColor: '#333',
                    maskColor: 'rgba(255, 255, 255, 0.8)'
                });
                this.chartInstances[chartId] = chart;
            }
        });
    },
    
    // 为所有图表显示错误状态
    showErrorForAllCharts(errorMessage) {
        Object.values(this.chartInstances).forEach(chart => {
            if (chart && typeof chart.hideLoading === 'function') {
                chart.hideLoading();
                chart.setOption({
                    title: {
                        text: '加载失败',
                        subtext: errorMessage,
                        left: 'center',
                        top: 'center',
                        textStyle: {
                            fontSize: 16,
                            color: '#f43f5e'
                        },
                        subtextStyle: {
                            fontSize: 14,
                            color: '#64748b'
                        }
                    },
                    series: []
                });
            }
        });
    },

    // 设置通用图表配置
    getCommonChartOptions() {
        return {
            color: ['#4361ee', '#3a0ca3', '#4cc9f0', '#4895ef', '#560bad', '#f72585'],
            textStyle: {
                fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
                color: '#333'
            },
            title: {
                show: false, // 隐藏标题
                textStyle: {
                    fontSize: 16,
                    fontWeight: 500
                },
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: '#eee',
                borderWidth: 1,
                textStyle: {
                    color: '#333'
                },
                confine: true,
                extraCssText: 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); border-radius: 4px;'
            },
            grid: {
                top: '50px',
                right: '20px',
                bottom: '60px',
                left: '40px',
                containLabel: true
            },
            legend: {
                type: 'scroll',
                bottom: 10,
                textStyle: {
                    color: '#666'
                },
                itemWidth: 12,
                itemHeight: 12,
                icon: 'roundRect'
            }
        };
    },

    // 创建图表实例
    createChart(chartId, options) {
        if (this.chartInstances[chartId]) {
            this.chartInstances[chartId].hideLoading();
        } else {
            const chartDom = document.getElementById(chartId);
            if (!chartDom) {
                console.error(`Chart element with id ${chartId} not found`);
                return null;
            }
            
            this.chartInstances[chartId] = echarts.init(chartDom);
        }

        const chart = this.chartInstances[chartId];
        
        // 合并通用配置
        const mergedOptions = Object.assign({}, this.getCommonChartOptions(), options);
        chart.setOption(mergedOptions, true); // 使用true参数完全重置options
        
        // 添加下载按钮点击事件
        const chartDom = document.getElementById(chartId);
        const downloadBtn = chartDom.parentNode.querySelector('.chart-actions .bi-download');
        if (downloadBtn) {
            downloadBtn.removeEventListener('click', this.downloadHandler);
            this.downloadHandler = () => this.downloadChart(chartId);
            downloadBtn.addEventListener('click', this.downloadHandler);
        }
        
        // 添加窗口大小变化事件处理
        window.addEventListener('resize', () => {
            if (chart) {
                chart.resize();
            }
        });
        
        return chart;
    },

    // 下载图表为图片
    downloadChart(chartId) {
        const chart = this.chartInstances[chartId];
        if (!chart) return;
        
        const imgData = chart.getDataURL({
            pixelRatio: 2,
            backgroundColor: '#fff'
        });
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `${chartId}-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = imgData;
        link.click();
    },

    // 价格区间分布图表
    initPriceRangeChart() {
        const data = this.chartData['price_distribution'];
        if (!data) {
            console.error('价格分布数据不可用');
            return;
        }
        
        const xData = data.data.map(item => item.range);
        const yData = data.data.map(item => item.count);
        
        const options = {
            grid: {
                top: 30,
                right: 20,
                bottom: 60,
                left: 50,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: xData,
                axisLabel: {
                    interval: 0,
                    rotate: 30,
                    fontSize: 11
                }
            },
            yAxis: {
                type: 'value',
                name: '车辆数量',
                nameTextStyle: {
                    fontSize: 12
                },
                axisLabel: {
                    fontSize: 11
                }
            },
            series: [{
                name: '价格区间分布',
                type: 'bar',
                data: yData,
                barWidth: '50%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#4361ee' },
                        { offset: 1, color: '#4895ef' }
                    ])
                },
                emphasis: {
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#3a0ca3' },
                            { offset: 1, color: '#4361ee' }
                        ])
                    }
                }
            }],
            tooltip: {
                trigger: 'axis',
                formatter: '{b}: {c}辆'
            }
        };
        
        this.createChart('price-range-chart', options);
    },

    // 热门品牌均价对比图表
    initBrandPriceChart() {
        const data = this.chartData['manufacturer_distribution'];
        if (!data) {
            console.error('制造商分布数据不可用');
            return;
        }
        
        // 限制显示的品牌数量为前10个
        const limitedData = data.data.slice(0, 10);
        const xData = limitedData.map(item => item.Make);
        const yData = limitedData.map(item => item.count);
        
        const options = {
            grid: {
                top: 30,
                right: 20,
                bottom: 60,
                left: 50,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: xData,
                axisLabel: {
                    interval: 0,
                    rotate: 30
                }
            },
            yAxis: {
                type: 'value',
                name: '车辆数量',
                nameTextStyle: {
                    fontSize: 12
                },
                axisLabel: {
                    fontSize: 11
                }
            },
            series: [{
                name: '品牌分布',
                type: 'bar',
                data: yData,
                barWidth: '50%',
                itemStyle: {
                    color: function(params) {
                        const colorList = ['#4361ee', '#3a0ca3', '#4cc9f0', '#4895ef', '#560bad', '#f72585'];
                        return colorList[params.dataIndex % colorList.length];
                    }
                }
            }],
            tooltip: {
                trigger: 'axis',
                formatter: '{b}: {c}辆'
            }
        };
        
        this.createChart('brand-price-chart', options);
    },

    // 价格趋势分析图表 - 使用里程数与价格的关系
    initPriceTrendChart() {
        const data = this.chartData['mileage_price_relation'];
        if (!data) {
            console.error('里程数与价格关系数据不可用');
            return;
        }
        
        // 限制数据点数量以提高性能
        const limitedData = data.data.slice(0, 500);
        const scatterData = limitedData.map(item => [item.Mileage, item.Price]);
        
        const options = {
            grid: {
                top: 30,
                right: 20,
                bottom: 40,
                left: 60,
                containLabel: true
            },
            xAxis: {
                type: 'value',
                name: data.xAxis.title
            },
            yAxis: {
                type: 'value',
                name: data.yAxis.title
            },
            series: [{
                name: '里程数与价格关系',
                type: 'scatter',
                data: scatterData,
                symbolSize: 8,
                itemStyle: {
                    color: '#4cc9f0',
                    opacity: 0.7
                }
            }],
            tooltip: {
                formatter: function(params) {
                    return `里程数: ${params.data[0]} km<br/>价格: ${params.data[1]} 元`;
                }
            }
        };
        
        this.createChart('price-trend-chart', options);
    },

    // 车龄与价格关系图表
    initAgePriceChart() {
        const data = this.chartData['year_price_relation'];
        if (!data) {
            console.error('年份价格关系数据不可用');
            return;
        }
        
        // 限制数据点数量以提高性能
        const limitedData = data.data.slice(0, 500);
        const currentYear = new Date().getFullYear();
        const scatterData = limitedData.map(item => {
            const age = currentYear - item.Year;
            return [item.Year, item.Price];
        });
        
        // 计算年份数据的范围
        let minYear = Math.min(...scatterData.map(item => item[0]));
        let maxYear = Math.max(...scatterData.map(item => item[0]));
        // 为了更好的视觉效果，稍微扩大范围
        minYear = Math.floor(minYear / 5) * 5; // 向下取整到最近的5的倍数
        maxYear = Math.ceil(maxYear / 5) * 5;  // 向上取整到最近的5的倍数
        
        const options = {
            grid: {
                top: 30,
                right: 20,
                bottom: 40,
                left: 60,
                containLabel: true
            },
            xAxis: {
                type: 'value',
                name: data.xAxis.title,
                min: minYear,
                max: maxYear,
                splitNumber: 10
            },
            yAxis: {
                type: 'value',
                name: data.yAxis.title
            },
            series: [{
                name: '年份与价格关系',
                type: 'scatter',
                data: scatterData,
                symbolSize: 8,
                itemStyle: {
                    color: function(params) {
                        // 根据价格设置不同的颜色
                        const price = params.data[1];
                        if (price >= 500000) return '#4361ee';
                        if (price >= 300000) return '#4895ef';
                        if (price >= 100000) return '#4cc9f0';
                        return '#f72585';
                    },
                    opacity: 0.7
                }
            }],
            tooltip: {
                formatter: function(params) {
                    return `年份: ${params.data[0]}<br/>价格: ${params.data[1]} 元`;
                }
            }
        };
        
        this.createChart('age-price-chart', options);
    },

    // 交易车辆生产年份分布图表
    initYearDistributionChart() {
        const data = this.chartData['manufacturing_year_distribution'];
        if (!data) {
            console.error('生产年份分布数据不可用');
            return;
        }
        
        const xData = data.data.map(item => item.Year);
        const yData = data.data.map(item => item.count);

        const options = {
            grid: {
                top: 30,
                right: 20,
                bottom: 60,
                left: 50,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: xData
            },
            yAxis: {
                type: 'value',
                name: '车辆数量',
                nameTextStyle: {
                    fontSize: 12
                },
                axisLabel: {
                    fontSize: 11
                }
            },
            series: [{
                name: '生产年份分布',
                type: 'bar',
                data: yData,
                barWidth: '50%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#4cc9f0' },
                        { offset: 1, color: '#4895ef' }
                    ])
                }
            }],
            tooltip: {
                trigger: 'axis',
                formatter: '{b}年: {c}辆'
            }
        };
        
        this.createChart('year-distribution-chart', options);
    },

    // 车型分布图表
    initBodyTypeChart() {
        const data = this.chartData['body_type_distribution'];
        if (!data) {
            console.error('车型分布数据不可用');
            return;
        }
        
        const chartData = data.data.map(item => {
            return {
                value: item.count, 
                name: item.Body_Type || '未知'
            };
        });

        const options = {
            series: [{
                name: '车型分布',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: chartData
            }],
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}辆 ({d}%)'
            },
            legend: {
                orient: 'horizontal',
                type: 'scroll',
                bottom: 10,
                left: 'center',
                itemWidth: 10,
                itemHeight: 10,
                textStyle: {
                    fontSize: 11
                }
            }
        };
        
        this.createChart('body-type-chart', options);
    },

    // 里程数分布图表
    initMileageDistributionChart() {
        const data = this.chartData['mileage_distribution'];
        if (!data) {
            console.error('里程数分布数据不可用');
            return;
        }
        
        const xData = data.data.map(item => item.range);
        const yData = data.data.map(item => item.count);

        const options = {
            grid: {
                top: 30,
                right: 20,
                bottom: 60,
                left: 50,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: xData,
                axisLabel: {
                    interval: 0,
                    rotate: 30
                }
            },
            yAxis: {
                type: 'value',
                name: '车辆数量',
                nameTextStyle: {
                    fontSize: 12
                },
                axisLabel: {
                    fontSize: 11
                }
            },
            series: [{
                name: '里程数分布',
                type: 'bar',
                data: yData,
                barWidth: '50%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#560bad' },
                        { offset: 1, color: '#3a0ca3' }
                    ])
                }
            }],
            tooltip: {
                trigger: 'axis',
                formatter: '{b}: {c}辆'
            }
        };
        
        this.createChart('mileage-distribution-chart', options);
    },

    // 交易地点分布图表
    initLocationDistributionChart() {
        const data = this.chartData['location_distribution'];
        if (!data) {
            console.error('交易地点分布数据不可用');
            return;
        }
        
        const chartData = data.data.map(item => {
            return {
                value: item.count, 
                name: item.Location || '未知'
            };
        });

        const options = {
            series: [{
                name: '交易地点分布',
                type: 'pie',
                radius: '65%',
                center: ['50%', '45%'],
                data: chartData,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }],
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}辆 ({d}%)'
            },
            legend: {
                orient: 'horizontal',
                type: 'scroll',
                bottom: 10,
                left: 'center',
                itemWidth: 10,
                itemHeight: 10,
                textStyle: {
                    fontSize: 11
                }
            }
        };
        
        this.createChart('location-distribution-chart', options);
    },

    // 注册错误回调
    onError(callback) {
        if (typeof callback === 'function') {
            this.errorCallbacks.push(callback);
        }
    },
    
    // 注册加载状态回调
    onLoadingChange(callback) {
        if (typeof callback === 'function') {
            this.loadingCallbacks.push(callback);
        }
    },
    
    // 触发错误回调
    _triggerErrorCallbacks(errorMessage) {
        this.errorCallbacks.forEach(callback => {
            try {
                callback(errorMessage);
            } catch (e) {
                console.error('错误回调执行失败:', e);
            }
        });
    },
    
    // 触发加载状态回调
    _triggerLoadingCallbacks(isLoading) {
        this.loadingCallbacks.forEach(callback => {
            try {
                callback(isLoading);
            } catch (e) {
                console.error('加载状态回调执行失败:', e);
            }
        });
    }
};

// 添加全局样式以支持图表全屏功能
const style = document.createElement('style');
style.textContent = `
.chart-item.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    padding: 20px;
    box-sizing: border-box;
}

.chart-item.fullscreen .chart {
    flex-grow: 1;
    height: auto !important;
}

body.modal-open {
    overflow: hidden;
}
`;
document.head.appendChild(style);

// 添加窗口大小改变时的事件监听
window.addEventListener('resize', function() {
    charts.resizeAllCharts();
}); 