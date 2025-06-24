#!/usr/bin/env python3
"""
简单的路由测试
"""

import requests
import sys
import time

def test_redirect():
    """测试根路由重定向到登录页面"""
    try:
        print("测试根路由重定向...")
        response = requests.get('http://localhost:5000/')
        
        # 检查重定向
        if response.history:
            print(f"请求被重定向: {response.history[0].status_code}")
            print(f"重定向到: {response.url}")
            if response.url.endswith('index.html'):
                print("✅ 测试通过: 根路由成功重定向到登录页面")
            else:
                print("❌ 测试失败: 根路由未重定向到登录页面")
        else:
            print("❌ 测试失败: 根路由未发生重定向")
        
        # 检查页面内容
        if '二手车价格系统' in response.text:
            print("✅ 测试通过: 登录页面包含预期内容")
        else:
            print("❌ 测试失败: 登录页面未包含预期内容")
    
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        print("请确保后端服务已经启动并在端口5000上运行")
        return False
    
    return True

def test_api():
    """测试API端点"""
    try:
        print("\n测试API端点...")
        response = requests.get('http://localhost:5000/api/v1/visualization/charts')
        
        if response.status_code == 200:
            print("✅ 测试通过: API端点正常响应")
            data = response.json()
            print(f"响应数据: {data}")
        else:
            print(f"❌ 测试失败: API响应状态码 {response.status_code}")
    
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False
    
    return True

def test_static_file():
    """测试静态文件服务"""
    try:
        print("\n测试静态文件服务...")
        response = requests.get('http://localhost:5000/css/style.css')
        
        if response.status_code == 200:
            print("✅ 测试通过: 静态文件服务正常工作")
            print(f"响应头: Content-Type={response.headers.get('Content-Type')}")
        else:
            print(f"❌ 测试失败: 静态文件服务响应状态码 {response.status_code}")
    
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False
    
    return True

if __name__ == '__main__':
    print("开始测试后端路由配置...")
    
    # 给服务器一点时间启动
    if len(sys.argv) > 1 and sys.argv[1] == '--wait':
        print("等待5秒让服务器完全启动...")
        time.sleep(5)
    
    # 运行测试
    redirect_test = test_redirect()
    api_test = test_api()
    static_test = test_static_file()
    
    # 打印总结
    print("\n测试结果摘要:")
    print(f"根路由重定向: {'通过' if redirect_test else '失败'}")
    print(f"API端点测试: {'通过' if api_test else '失败'}")
    print(f"静态文件服务: {'通过' if static_test else '失败'}")
    
    if redirect_test and api_test and static_test:
        print("\n✅ 所有测试通过！后端路由配置正确。")
        sys.exit(0)
    else:
        print("\n❌ 部分测试失败，请检查后端配置。")
        sys.exit(1) 