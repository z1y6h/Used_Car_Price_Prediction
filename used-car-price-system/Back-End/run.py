#!/usr/bin/env python3
"""
二手车价格系统后端启动脚本
"""

from app import app
from config import app_config

if __name__ == '__main__':
    print(f"启动二手车价格系统后端服务...")
    print(f"服务运行在: http://{app_config.DB_HOST}:{app_config.PORT}")
    print(f"调试模式: {app_config.DEBUG}")
    print(f"数据库: {app_config.DB_NAME}")
    print("使用 Ctrl+C 停止服务")
    
    app.run(
        host="0.0.0.0",
        port=app_config.PORT,
        debug=app_config.DEBUG
    ) 