"""
车辆数据可视化API模块

提供各种数据统计和可视化所需的数据接口
"""
import mysql.connector
from config import app_config
import pandas as pd
import numpy as np

# 数据库配置
db_config = {
    'host': app_config.DB_HOST,
    'user': app_config.DB_USER,
    'password': app_config.DB_PASSWORD,
    'database': app_config.DB_NAME
}

def get_db_connection():
    """获取数据库连接"""
    return mysql.connector.connect(**db_config)

def fetch_car_data():
    """获取所有车辆数据作为pandas DataFrame"""
    conn = get_db_connection()
    query = "SELECT * FROM car_info"
    df = pd.read_sql(query, conn)
    conn.close()
    return df

def mileage_price_relation():
    """里程数与价格的关系（散点图）"""
    conn = get_db_connection()
    query = "SELECT Mileage, Price FROM car_info"
    df = pd.read_sql(query, conn)
    conn.close()
    
    # 数据处理，去除离群点（可选）
    df = df[(df['Price'] <= df['Price'].quantile(0.99)) & 
           (df['Mileage'] <= df['Mileage'].quantile(0.99))]
    
    data = df.to_dict('records')
    return {
        'chart_type': 'scatter',
        'title': '里程数与价格的关系',
        'xAxis': {
            'title': '里程数 (km)',
            'type': 'linear'
        },
        'yAxis': {
            'title': '价格 (¥)',
            'type': 'linear'
        },
        'data': data
    }

def year_price_relation():
    """生产年份与价格的关系（散点图）"""
    conn = get_db_connection()
    query = "SELECT Year, Price FROM car_info"
    df = pd.read_sql(query, conn)
    conn.close()
    
    # 数据处理，去除离群点（可选）
    df = df[(df['Price'] <= df['Price'].quantile(0.99))]
    
    data = df.to_dict('records')
    return {
        'chart_type': 'scatter',
        'title': '生产年份与价格的关系',
        'xAxis': {
            'title': '生产年份',
            'type': 'linear'
        },
        'yAxis': {
            'title': '价格 (¥)',
            'type': 'linear'
        },
        'data': data
    }

def manufacturer_distribution():
    """制造商分布"""
    conn = get_db_connection()
    query = """
    SELECT Make, COUNT(*) as count 
    FROM car_info 
    GROUP BY Make 
    ORDER BY count DESC 
    LIMIT 20
    """
    df = pd.read_sql(query, conn)
    conn.close()
    
    data = df.to_dict('records')
    return {
        'chart_type': 'bar',
        'title': '制造商分布',
        'xAxis': {
            'title': '制造商',
            'type': 'category'
        },
        'yAxis': {
            'title': '车辆数量',
            'type': 'linear'
        },
        'data': data
    }

def transaction_time_distribution():
    """交易时间分布（柱状图）"""
    conn = get_db_connection()
    query = """
    SELECT 
        SUBSTRING(Date, 1, 7) as month, 
        COUNT(*) as count 
    FROM car_info 
    GROUP BY month 
    ORDER BY month
    """
    df = pd.read_sql(query, conn)
    conn.close()
    
    data = df.to_dict('records')
    return {
        'chart_type': 'bar',
        'title': '交易时间分布',
        'xAxis': {
            'title': '月份',
            'type': 'category'
        },
        'yAxis': {
            'title': '交易数量',
            'type': 'linear'
        },
        'data': data
    }

def manufacturing_year_distribution():
    """交易车辆生产年份分布（柱状图）"""
    conn = get_db_connection()
    query = """
    SELECT 
        Year, 
        COUNT(*) as count 
    FROM car_info 
    GROUP BY Year 
    ORDER BY Year
    """
    df = pd.read_sql(query, conn)
    conn.close()
    
    data = df.to_dict('records')
    return {
        'chart_type': 'bar',
        'title': '车辆生产年份分布',
        'xAxis': {
            'title': '生产年份',
            'type': 'category'
        },
        'yAxis': {
            'title': '车辆数量',
            'type': 'linear'
        },
        'data': data
    }

def price_distribution():
    """价格分布（柱状图）"""
    conn = get_db_connection()
    query = "SELECT Price FROM car_info"
    df = pd.read_sql(query, conn)
    conn.close()
    
    # 去除极端值
    df = df[df['Price'] <= df['Price'].quantile(0.99)]
    
    # 创建价格区间
    bins = 10
    price_ranges = pd.cut(df['Price'], bins=bins)
    price_dist = price_ranges.value_counts().sort_index()
    
    # 格式化区间边界为更易读的格式
    labels = [f"{int(interval.left)}-{int(interval.right)}" for interval in price_dist.index]
    
    data = [{'range': labels[i], 'count': int(price_dist.iloc[i])} for i in range(len(labels))]
    return {
        'chart_type': 'bar',
        'title': '价格分布',
        'xAxis': {
            'title': '价格区间 (¥)',
            'type': 'category'
        },
        'yAxis': {
            'title': '车辆数量',
            'type': 'linear'
        },
        'data': data
    }

def body_type_distribution():
    """车型分布（柱状图）"""
    conn = get_db_connection()
    query = """
    SELECT 
        Body_Type, 
        COUNT(*) as count 
    FROM car_info 
    GROUP BY Body_Type
    ORDER BY count DESC
    """
    df = pd.read_sql(query, conn)
    conn.close()
    
    data = df.to_dict('records')
    return {
        'chart_type': 'bar',
        'title': '车型分布',
        'xAxis': {
            'title': '车型',
            'type': 'category'
        },
        'yAxis': {
            'title': '车辆数量',
            'type': 'linear'
        },
        'data': data
    }

def cylinders_distribution():
    """气缸数量分布（饼图）- 替代车门数量，因为数据库中没有车门数量字段"""
    conn = get_db_connection()
    query = """
    SELECT 
        Cylinders,
        COUNT(*) as count 
    FROM car_info 
    WHERE Cylinders IS NOT NULL
    GROUP BY Cylinders
    ORDER BY Cylinders
    """
    df = pd.read_sql(query, conn)
    conn.close()
    
    data = df.to_dict('records')
    return {
        'chart_type': 'pie',
        'title': '气缸数量分布',
        'data': data,
        'label_field': 'Cylinders',
        'value_field': 'count'
    }

def transmission_distribution():
    """手动/自动变速箱分布（饼图）"""
    conn = get_db_connection()
    query = """
    SELECT 
        Transmission, 
        COUNT(*) as count 
    FROM car_info
    WHERE Transmission IS NOT NULL
    GROUP BY Transmission
    ORDER BY count DESC
    """
    df = pd.read_sql(query, conn)
    conn.close()
    
    data = df.to_dict('records')
    return {
        'chart_type': 'pie',
        'title': '变速箱类型分布',
        'data': data,
        'label_field': 'Transmission',
        'value_field': 'count'
    }

def color_distribution():
    """颜色分布（饼图）"""
    conn = get_db_connection()
    query = """
    SELECT 
        Color, 
        COUNT(*) as count 
    FROM car_info
    WHERE Color IS NOT NULL
    GROUP BY Color
    ORDER BY count DESC
    LIMIT 10
    """
    df = pd.read_sql(query, conn)
    conn.close()
    
    data = df.to_dict('records')
    return {
        'chart_type': 'pie',
        'title': '颜色分布',
        'data': data,
        'label_field': 'Color',
        'value_field': 'count'
    }

def fuel_type_distribution():
    """燃油类型分布（饼图）"""
    conn = get_db_connection()
    query = """
    SELECT 
        Fuel_Type, 
        COUNT(*) as count 
    FROM car_info
    WHERE Fuel_Type IS NOT NULL
    GROUP BY Fuel_Type
    ORDER BY count DESC
    """
    df = pd.read_sql(query, conn)
    conn.close()
    
    data = df.to_dict('records')
    return {
        'chart_type': 'pie',
        'title': '燃油类型分布',
        'data': data,
        'label_field': 'Fuel_Type',
        'value_field': 'count'
    }

def mileage_distribution():
    """里程数分布（柱状图）"""
    conn = get_db_connection()
    query = "SELECT Mileage FROM car_info"
    df = pd.read_sql(query, conn)
    conn.close()
    
    # 去除极端值
    df = df[df['Mileage'] <= df['Mileage'].quantile(0.99)]
    
    # 创建里程区间
    bins = 10
    mileage_ranges = pd.cut(df['Mileage'], bins=bins)
    mileage_dist = mileage_ranges.value_counts().sort_index()
    
    # 格式化区间边界为更易读的格式
    labels = [f"{int(interval.left)}-{int(interval.right)}" for interval in mileage_dist.index]
    
    data = [{'range': labels[i], 'count': int(mileage_dist.iloc[i])} for i in range(len(labels))]
    return {
        'chart_type': 'bar',
        'title': '里程数分布',
        'xAxis': {
            'title': '里程区间 (km)',
            'type': 'category'
        },
        'yAxis': {
            'title': '车辆数量',
            'type': 'linear'
        },
        'data': data
    }

def location_distribution():
    """交易地点分布（饼图）"""
    conn = get_db_connection()
    query = """
    SELECT 
        Location, 
        COUNT(*) as count 
    FROM car_info
    WHERE Location IS NOT NULL
    GROUP BY Location
    ORDER BY count DESC
    LIMIT 15
    """
    df = pd.read_sql(query, conn)
    conn.close()
    
    data = df.to_dict('records')
    return {
        'chart_type': 'pie',
        'title': '交易地点分布',
        'data': data,
        'label_field': 'Location',
        'value_field': 'count'
    }

# 所有统计函数的映射
visualization_functions = {
    'mileage_price_relation': mileage_price_relation,
    'year_price_relation': year_price_relation,
    'manufacturer_distribution': manufacturer_distribution,
    'transaction_time_distribution': transaction_time_distribution,
    'manufacturing_year_distribution': manufacturing_year_distribution,
    'price_distribution': price_distribution,
    'body_type_distribution': body_type_distribution,
    'cylinders_distribution': cylinders_distribution,  # 替代车门数量分布
    'transmission_distribution': transmission_distribution,
    'color_distribution': color_distribution,
    'fuel_type_distribution': fuel_type_distribution,
    'mileage_distribution': mileage_distribution,
    'location_distribution': location_distribution
} 