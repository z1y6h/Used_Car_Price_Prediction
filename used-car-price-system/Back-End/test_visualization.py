import requests
import json
import sys

BASE_URL = "http://localhost:5000/api/v1"

def test_get_chart_types():
    """测试获取所有图表类型API"""
    print("测试获取所有图表类型API...")
    
    response = requests.get(f"{BASE_URL}/visualization/charts")
    if response.status_code == 200:
        data = response.json()
        print("可视化图表类型列表:")
        for idx, chart_type in enumerate(data['data']['chart_types'], 1):
            print(f"{idx}. {chart_type}")
    else:
        print(f"请求失败，状态码: {response.status_code}")
        print(response.text)
    
    print("-" * 50)

def test_get_specific_chart(chart_type):
    """测试获取特定图表数据API"""
    print(f"测试获取图表 {chart_type} 的数据...")
    
    response = requests.get(f"{BASE_URL}/visualization/{chart_type}")
    if response.status_code == 200:
        data = response.json()
        print(f"图表类型: {data['data']['chart_type']}")
        print(f"标题: {data['data']['title']}")
        
        if data['data']['chart_type'] in ['scatter', 'bar']:
            print(f"X轴: {data['data']['xAxis']['title']}")
            print(f"Y轴: {data['data']['yAxis']['title']}")
        
        print(f"数据示例 (前3条):")
        for item in data['data']['data'][:3]:
            print(f"  {item}")
        
        print(f"数据条数: {len(data['data']['data'])}")
    else:
        print(f"请求失败，状态码: {response.status_code}")
        print(response.text)
    
    print("-" * 50)

def test_all_charts():
    """测试所有图表类型"""
    # 先获取所有图表类型
    response = requests.get(f"{BASE_URL}/visualization/charts")
    if response.status_code == 200:
        chart_types = response.json()['data']['chart_types']
        
        # 测试每一种图表
        for chart_type in chart_types:
            test_get_specific_chart(chart_type)
    else:
        print(f"获取图表类型失败，状态码: {response.status_code}")

if __name__ == "__main__":
    print("开始测试可视化API...\n")
    
    test_get_chart_types()
    
    # 如果命令行提供了特定的图表类型，则只测试那一个
    if len(sys.argv) > 1:
        test_get_specific_chart(sys.argv[1])
    else:
        # 否则测试所有图表类型
        test_all_charts()
    
    print("测试完成!") 