import requests
import json

BASE_URL = "http://localhost:5000/api/v1"

def test_get_cars():
    """测试获取车辆列表API"""
    print("测试获取车辆列表API...")
    
    # 基本请求
    response = requests.get(f"{BASE_URL}/cars")
    if response.status_code == 200:
        data = response.json()
        print(f"成功获取车辆列表，共 {data['data']['total']} 条数据")
        print(f"当前页： {data['data']['page']}/{data['data']['total_pages']}")
        print(f"每页显示： {data['data']['limit']} 条")
        print("第一条车辆数据示例：")
        if data['data']['cars']:
            print(json.dumps(data['data']['cars'][0], indent=4, ensure_ascii=False))
    else:
        print(f"请求失败，状态码: {response.status_code}")
        print(response.text)
    
    print("-" * 50)
    
    # 测试分页
    response = requests.get(f"{BASE_URL}/cars?page=2&limit=5")
    if response.status_code == 200:
        data = response.json()
        print(f"测试分页 - 第2页，每页5条")
        print(f"成功获取车辆列表，共 {data['data']['total']} 条数据")
        print(f"当前页： {data['data']['page']}/{data['data']['total_pages']}")
        print(f"每页显示： {data['data']['limit']} 条")
    else:
        print(f"请求失败，状态码: {response.status_code}")
    
    print("-" * 50)
    
    # 测试过滤条件
    response = requests.get(f"{BASE_URL}/cars?make=mercedes&year_min=2015&price_max=200000")
    if response.status_code == 200:
        data = response.json()
        print(f"测试过滤条件 - 品牌:mercedes, 最小年份:2015, 最大价格:200000")
        print(f"成功获取车辆列表，共 {data['data']['total']} 条数据")
        if data['data']['cars']:
            print(f"第一条结果: {data['data']['cars'][0]['Make']} {data['data']['cars'][0]['Model']} {data['data']['cars'][0]['Year']} - ${data['data']['cars'][0]['Price']}")
    else:
        print(f"请求失败，状态码: {response.status_code}")
    
    print("-" * 50)

def test_get_car_detail():
    """测试获取车辆详情API"""
    print("测试获取车辆详情API...")
    
    # 获取第一个车辆的ID
    response = requests.get(f"{BASE_URL}/cars?limit=1")
    if response.status_code == 200:
        data = response.json()
        if data['data']['cars']:
            car_id = data['data']['cars'][0]['id']
            
            # 测试获取车辆详情
            detail_response = requests.get(f"{BASE_URL}/cars/{car_id}")
            if detail_response.status_code == 200:
                detail_data = detail_response.json()
                print(f"成功获取ID为 {car_id} 的车辆详情:")
                print(json.dumps(detail_data['data']['car'], indent=4, ensure_ascii=False))
            else:
                print(f"请求失败，状态码: {detail_response.status_code}")
        else:
            print("未找到可用于测试的车辆")
    else:
        print(f"请求失败，状态码: {response.status_code}")
    
    print("-" * 50)
    
    # 测试不存在的ID
    invalid_id = 99999
    response = requests.get(f"{BASE_URL}/cars/{invalid_id}")
    if response.status_code == 404:
        print(f"测试不存在ID ({invalid_id}) - 预期404状态码 - 成功!")
    else:
        print(f"测试不存在ID - 失败，状态码: {response.status_code}")
    
    print("-" * 50)

if __name__ == "__main__":
    print("开始测试二手车价格系统API...\n")
    test_get_cars()
    test_get_car_detail()
    print("测试完成!") 