import os
from dotenv import load_dotenv

# 尝试加载.env文件（如果存在）
load_dotenv(verbose=True)

# 数据库配置
class Config:
    # 数据库配置
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '123456')
    DB_NAME = os.getenv('DB_NAME', 'cleaned_used_cars_data_encoded')
    
    # 应用配置
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_secret_key')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')
    PORT = int(os.getenv('FLASK_PORT', 5000))
    
    # 跨域配置
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')
    
    # 分页默认值
    DEFAULT_PAGE_SIZE = 10
    MAX_PAGE_SIZE = 100

# 开发环境配置
class DevelopmentConfig(Config):
    DEBUG = True

# 生产环境配置
class ProductionConfig(Config):
    DEBUG = False

# 测试环境配置
class TestingConfig(Config):
    TESTING = True
    DB_NAME = os.getenv('DB_NAME', 'test_cleaned_used_cars_data_encoded')

# 根据环境变量选择配置
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}

# 默认使用开发环境配置
app_config = config_by_name[os.getenv('FLASK_ENV', 'development')] 