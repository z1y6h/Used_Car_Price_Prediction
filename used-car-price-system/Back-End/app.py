from flask import Flask, request, jsonify, redirect, send_from_directory
from flask_cors import CORS
import mysql.connector
import json
import os
from config import app_config
import visualization
from joblib import load
import numpy as np

# 获取前端目录
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../Front-End'))

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # 启用跨域，允许所有源访问API

# 根路由，重定向到登录页面
@app.route('/')
def index():
    return redirect('/index.html')

# 提供前端静态文件
@app.route('/<path:path>')
def serve_frontend(path):
    return send_from_directory(FRONTEND_DIR, path)

# 数据库配置
db_config = {
    'host': app_config.DB_HOST,
    'user': app_config.DB_USER,
    'password': app_config.DB_PASSWORD,
    'database': app_config.DB_NAME
}

# 数据库连接函数
def get_db_connection():
    return mysql.connector.connect(**db_config)

@app.route('/api/v1/cars', methods=['GET'])
def get_cars():
    """
    获取车辆列表API，支持分页和多条件筛选
    参数:
        page: 页码，默认1
        limit: 每页数量，默认10
        make: 品牌
        model: 型号
        year_min: 最小年份
        year_max: 最大年份
        price_min: 最低价格
        price_max: 最高价格
        mileage_min: 最低里程
        mileage_max: 最高里程
        body_type: 车身类型
        fuel_type: 燃油类型
        transmission: 变速箱类型
        color: 颜色
        location: 地点
    返回:
        cars: 车辆列表
        total: 总数
        page: 当前页码
        total_pages: 总页数
    """
    try:
        # 获取查询参数
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', app_config.DEFAULT_PAGE_SIZE))
        
        # 确保页码和每页数量有效
        if page < 1:
            page = 1
        if limit < 1 or limit > app_config.MAX_PAGE_SIZE:
            limit = app_config.DEFAULT_PAGE_SIZE
            
        offset = (page - 1) * limit
        
        # 构建查询条件
        conditions = []
        params = []
        
        # 过滤参数
        if request.args.get('make'):
            conditions.append("Make LIKE %s")
            params.append(f"%{request.args.get('make')}%")
            
        if request.args.get('model'):
            conditions.append("Model LIKE %s")
            params.append(f"%{request.args.get('model')}%")
        
        if request.args.get('year_min'):
            conditions.append("Year >= %s")
            params.append(int(request.args.get('year_min')))
            
        if request.args.get('year_max'):
            conditions.append("Year <= %s")
            params.append(int(request.args.get('year_max')))
            
        if request.args.get('price_min'):
            conditions.append("Price >= %s")
            params.append(int(request.args.get('price_min')))
            
        if request.args.get('price_max'):
            conditions.append("Price <= %s")
            params.append(int(request.args.get('price_max')))
            
        if request.args.get('mileage_min'):
            conditions.append("Mileage >= %s")
            params.append(int(request.args.get('mileage_min')))
            
        if request.args.get('mileage_max'):
            conditions.append("Mileage <= %s")
            params.append(int(request.args.get('mileage_max')))
            
        if request.args.get('body_type'):
            conditions.append("Body_Type LIKE %s")
            params.append(f"%{request.args.get('body_type')}%")
            
        if request.args.get('fuel_type'):
            conditions.append("Fuel_Type LIKE %s")
            params.append(f"%{request.args.get('fuel_type')}%")
            
        if request.args.get('transmission'):
            conditions.append("Transmission LIKE %s")
            params.append(f"%{request.args.get('transmission')}%")
            
        if request.args.get('color'):
            conditions.append("Color LIKE %s")
            params.append(f"%{request.args.get('color')}%")
            
        if request.args.get('location'):
            conditions.append("Location LIKE %s")
            params.append(f"%{request.args.get('location')}%")
        
        # 连接数据库
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 构建基础查询
        base_query = """
            SELECT 
                id, Make, Model, Year, Price, Mileage, Body_Type, 
                Cylinders, Transmission, Fuel_Type, Color, Location, 
                Date, Description 
            FROM car_info
        """
        
        # 添加条件
        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)
        
        # 计算总数
        count_query = f"SELECT COUNT(*) as total FROM car_info"
        if conditions:
            count_query += " WHERE " + " AND ".join(conditions)
            
        cursor.execute(count_query, params)
        total = cursor.fetchone().get('total', 0)
        
        # 添加排序和分页
        base_query += " ORDER BY id DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        # 执行查询
        cursor.execute(base_query, params)
        cars = cursor.fetchall()
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        # 计算总页数
        total_pages = (total + limit - 1) // limit
        
        return jsonify({
            'status': 'success',
            'data': {
                'cars': cars,
                'total': total,
                'page': page,
                'total_pages': total_pages,
                'limit': limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/v1/cars/<int:car_id>', methods=['GET'])
def get_car_detail(car_id):
    """
    获取车辆详情API
    参数:
        car_id: 车辆ID
    返回:
        car: 车辆详情
    """
    try:
        # 连接数据库
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 查询车辆详情
        query = """
            SELECT 
                id, Make, Model, Year, Price, Mileage, Body_Type, 
                Cylinders, Transmission, Fuel_Type, Color, Location, 
                Date, Description 
            FROM car_info
            WHERE id = %s
        """
        
        cursor.execute(query, (car_id,))
        car = cursor.fetchone()
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        if car:
            return jsonify({
                'status': 'success',
                'data': {
                    'car': car
                }
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': '车辆不存在'
            }), 404
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# 可视化API路由
@app.route('/api/v1/visualization/charts', methods=['GET'])
def get_all_visualization_types():
    """获取所有可用的可视化图表类型"""
    try:
        chart_types = list(visualization.visualization_functions.keys())
        return jsonify({
            'status': 'success',
            'data': {
                'chart_types': chart_types
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/v1/visualization/<chart_type>', methods=['GET'])
def get_visualization_data(chart_type):
    """获取特定类型图表的可视化数据"""
    try:
        if chart_type not in visualization.visualization_functions:
            return jsonify({
                'status': 'error',
                'message': f'不支持的图表类型: {chart_type}'
            }), 400
            
        # 调用相应的可视化函数
        visualization_data = visualization.visualization_functions[chart_type]()
        
        return jsonify({
            'status': 'success',
            'data': visualization_data
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# 价格预测API路由
@app.route('/api/v1/prediction/options', methods=['GET'])
def get_prediction_options():
    """获取预测所需的下拉选项数据，返回各字段的可选值及其对应的编码值"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 获取品牌列表及编码
        cursor.execute("SELECT DISTINCT Make, Make_encoded FROM car_info ORDER BY Make ASC")
        makes = cursor.fetchall()
        
        # 获取所有车型及编码
        cursor.execute("SELECT DISTINCT Make, Model, Model_encoded FROM car_info ORDER BY Make, Model ASC")
        models = cursor.fetchall()
        
        # 获取车身类型列表及编码
        cursor.execute("SELECT DISTINCT Body_Type, Body_Type_encoded FROM car_info ORDER BY Body_Type ASC")
        body_types = cursor.fetchall()
        
        # 获取变速箱类型列表及编码
        cursor.execute("SELECT DISTINCT Transmission, Transmission_encoded FROM car_info ORDER BY Transmission ASC")
        transmissions = cursor.fetchall()
        
        # 获取燃油类型列表及编码
        cursor.execute("SELECT DISTINCT Fuel_Type, Fuel_Type_encoded FROM car_info ORDER BY Fuel_Type ASC")
        fuel_types = cursor.fetchall()
        
        # 获取颜色列表及编码
        cursor.execute("SELECT DISTINCT Color, Color_encoded FROM car_info ORDER BY Color ASC")
        colors = cursor.fetchall()
        
        # 获取地点列表及编码
        cursor.execute("SELECT DISTINCT Location, Location_encoded FROM car_info ORDER BY Location ASC")
        locations = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'data': {
                'makes': makes,
                'models': models,
                'body_types': body_types,
                'transmissions': transmissions,
                'fuel_types': fuel_types,
                'colors': colors,
                'locations': locations
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/v1/prediction/models', methods=['GET'])
def get_models_by_make():
    """获取指定品牌的车型列表"""
    try:
        make = request.args.get('make')
        if not make:
            return jsonify({
                'status': 'error',
                'message': 'missing required parameter: make'
            }), 400
            
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 获取指定品牌的车型列表及编码
        cursor.execute("""
            SELECT DISTINCT Model, Model_encoded 
            FROM car_info 
            WHERE Make = %s
            ORDER BY Model ASC
        """, (make,))
        models = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'data': {
                'models': models
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/v1/prediction/predict', methods=['POST'])
def predict_price():
    """根据车辆特征预测价格"""
    
    try:
        data = request.json
        if not data:
            return jsonify({
                'status': 'error',
                'message': '请求中缺少车辆数据'
            }), 400
        
        # 从请求中获取已编码的特征
        required_features = ['Make_encoded', 'Model_encoded', 'Year', 'Mileage', 
                          'Body_Type_encoded', 'Transmission_encoded', 
                          'Fuel_Type_encoded', 'Color_encoded']
        
        # 检查是否所有必要特征都在请求中
        missing_features = []
        for feature in required_features:
            if feature not in data:
                missing_features.append(feature)
        
        if missing_features:
            return jsonify({
                'status': 'error',
                'message': f'缺少必要特征: {", ".join(missing_features)}'
            }), 400
            
        # 处理可选的Location_encoded参数
        if 'Location_encoded' not in data:
            data['Location_encoded'] = 0  # 设置默认值
            
        # 处理缺失的Cylinders字段
        if 'Cylinders' not in data:
            data['Cylinders'] = 4  # 设置默认值
        
        # 确保所有编码值都是数字类型
        for key, value in data.items():
            if key.endswith('_encoded') or key in ['Year', 'Mileage', 'Cylinders']:
                try:
                    data[key] = int(value)
                except (ValueError, TypeError):
                    return jsonify({
                        'status': 'error',
                        'message': f'特征 {key} 的值必须是数字'
                    }), 400

        # 加载预训练模型 - 使用绝对路径
        import os
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'random_forest_model.joblib')
        model = load(model_path)
        
        # 构建模型输入特征数组，确保顺序与训练时一致
        # 训练时顺序: Make_encoded, Year, Mileage, Cylinders, Body Type_encoded, Transmission_encoded, 
        # Fuel Type_encoded, Color_encoded, Location_encoded, Model_encoded
        features = np.array([
            data['Make_encoded'],
            data['Year'],
            data['Mileage'],
            data['Cylinders'],
            data['Body_Type_encoded'],
            data['Transmission_encoded'],
            data['Fuel_Type_encoded'],
            data['Color_encoded'],
            data['Location_encoded'],
            data['Model_encoded']
        ]).reshape(1, -1)
        
        # 预测价格
        predicted_price = float(model.predict(features)[0])
        
        # 计算预测区间 (假设为预测价格的±10%)
        lower_bound = predicted_price * 0.9
        upper_bound = predicted_price * 1.1
        
        # 从输入特征中提取影响因素
        feature_importances = model.feature_importances_
        feature_names = ['Make', 'Year', 'Mileage', 'Cylinders', 'Body Type', 
                       'Transmission', 'Fuel Type', 'Color', 'Location', 'Model']
        
        # 将特征重要性转换为影响因素列表
        factors = []
        for i, (name, importance) in enumerate(zip(feature_names, feature_importances)):
            # 计算影响百分比
            impact_percent = importance * 100
            impact_str = f"+{impact_percent:.1f}%" if importance > 0 else f"-{abs(impact_percent):.1f}%"
            
            factors.append({
                'name': name,
                'impact': impact_str
            })
        
        # 按影响程度排序
        factors.sort(key=lambda x: abs(float(x['impact'].replace('+', '').replace('-', '').replace('%', ''))), reverse=True)
        
        return jsonify({
            'status': 'success',
            'data': {
                'price': predicted_price,
                'priceRange': {
                    'low': lower_bound,
                    'high': upper_bound
                },
                'confidence': 90,  # 假定置信度为90%
                'factors': factors
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=app_config.DEBUG, port=app_config.PORT)

# 用户管理API路由
@app.route('/api/v1/users', methods=['GET'])
def get_users():
    """获取用户列表API"""
    try:
        # 获取查询参数
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', app_config.DEFAULT_PAGE_SIZE))
        name = request.args.get('name', '')
        
        # 确保页码和每页数量有效
        if page < 1:
            page = 1
        if limit < 1 or limit > app_config.MAX_PAGE_SIZE:
            limit = app_config.DEFAULT_PAGE_SIZE
            
        offset = (page - 1) * limit
        
        # 连接数据库
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 构建查询条件
        conditions = []
        params = []
        
        if name:
            conditions.append("name LIKE %s")
            params.append(f"%{name}%")
        
        # 构建基础查询
        base_query = "SELECT id, name, role FROM user_info"
        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)
        
        # 计算总数
        count_query = "SELECT COUNT(*) as total FROM user_info"
        if conditions:
            count_query += " WHERE " + " AND ".join(conditions)
            
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        
        # 添加排序和分页
        base_query += " ORDER BY id ASC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        # 执行查询
        cursor.execute(base_query, params)
        users = cursor.fetchall()
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        # 计算总页数
        total_pages = (total + limit - 1) // limit
        
        return jsonify({
            'status': 'success',
            'data': {
                'users': users,
                'total': total,
                'page': page,
                'total_pages': total_pages,
                'limit': limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/v1/users/<int:user_id>', methods=['GET'])
def get_user_detail(user_id):
    """获取用户详情API"""
    try:
        # 连接数据库
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 查询用户详情
        query = "SELECT id, name, role FROM user_info WHERE id = %s"
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        if user:
            return jsonify({
                'status': 'success',
                'data': {
                    'user': user
                }
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': '用户不存在'
            }), 404
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/v1/users', methods=['POST'])
def create_user():
    """创建新用户API"""
    try:
        data = request.json
        if not data:
            return jsonify({
                'status': 'error',
                'message': '请求中缺少用户数据'
            }), 400
        
        # 验证必要字段
        required_fields = ['name', 'password', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'缺少必要字段: {field}'
                }), 400
        
        # 验证用户名是否已存在
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id FROM user_info WHERE name = %s", (data['name'],))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({
                'status': 'error',
                'message': '用户名已存在'
            }), 400
        
        # 创建新用户
        insert_query = """
            INSERT INTO user_info (name, password, role)
            VALUES (%s, %s, %s)
        """
        cursor.execute(insert_query, (data['name'], data['password'], data['role']))
        conn.commit()
        
        # 获取新创建的用户ID
        new_user_id = cursor.lastrowid
        
        # 查询新创建的用户
        cursor.execute("SELECT id, name, role FROM user_info WHERE id = %s", (new_user_id,))
        new_user = cursor.fetchone()
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'data': {
                'user': new_user,
                'message': '用户创建成功'
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/v1/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """更新用户信息API"""
    try:
        data = request.json
        if not data:
            return jsonify({
                'status': 'error',
                'message': '请求中缺少用户数据'
            }), 400
        
        # 连接数据库
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 检查用户是否存在
        cursor.execute("SELECT id FROM user_info WHERE id = %s", (user_id,))
        existing_user = cursor.fetchone()
        
        if not existing_user:
            cursor.close()
            conn.close()
            return jsonify({
                'status': 'error',
                'message': '用户不存在'
            }), 404
        
        # 如果更新用户名，检查新用户名是否已存在
        if 'name' in data:
            cursor.execute("SELECT id FROM user_info WHERE name = %s AND id != %s", 
                         (data['name'], user_id))
            name_exists = cursor.fetchone()
            
            if name_exists:
                cursor.close()
                conn.close()
                return jsonify({
                    'status': 'error',
                    'message': '用户名已存在'
                }), 400
        
        # 构建更新语句
        update_fields = []
        update_values = []
        
        if 'name' in data:
            update_fields.append("name = %s")
            update_values.append(data['name'])
            
        if 'password' in data:
            update_fields.append("password = %s")
            update_values.append(data['password'])
            
        if 'role' in data:
            update_fields.append("role = %s")
            update_values.append(data['role'])
        
        if not update_fields:
            cursor.close()
            conn.close()
            return jsonify({
                'status': 'error',
                'message': '未提供需要更新的字段'
            }), 400
        
        # 执行更新
        update_query = f"""
            UPDATE user_info
            SET {', '.join(update_fields)}
            WHERE id = %s
        """
        update_values.append(user_id)
        
        cursor.execute(update_query, update_values)
        conn.commit()
        
        # 查询更新后的用户
        cursor.execute("SELECT id, name, role FROM user_info WHERE id = %s", (user_id,))
        updated_user = cursor.fetchone()
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'data': {
                'user': updated_user,
                'message': '用户信息更新成功'
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/v1/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """删除用户API"""
    try:
        # 连接数据库
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 检查用户是否存在
        cursor.execute("SELECT id FROM user_info WHERE id = %s", (user_id,))
        existing_user = cursor.fetchone()
        
        if not existing_user:
            cursor.close()
            conn.close()
            return jsonify({
                'status': 'error',
                'message': '用户不存在'
            }), 404
        
        # 执行删除
        cursor.execute("DELETE FROM user_info WHERE id = %s", (user_id,))
        conn.commit()
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'data': {
                'message': '用户删除成功'
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/v1/login', methods=['POST'])
def login():
    """用户登录API"""
    try:
        data = request.json
        if not data or 'name' not in data or 'password' not in data:
            return jsonify({
                'status': 'error',
                'message': '请提供用户名和密码'
            }), 400
        
        print(f"尝试登录用户: {data['name']}")
        
        # 连接数据库
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 查询用户
        cursor.execute("""
            SELECT id, name, role FROM user_info 
            WHERE name = %s AND password = %s
        """, (data['name'], data['password']))
        
        user = cursor.fetchone()
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        if user:
            # 确保user对象的role属性存在
            if 'role' not in user or user['role'] is None:
                user['role'] = '1'  # 默认为买家角色
            
            print(f"用户 {data['name']} 登录成功，角色代码: {user['role']}")
                
            return jsonify({
                'status': 'success',
                'data': {
                    'user': user,
                    'message': '登录成功'
                }
            }), 200
        else:
            print(f"用户 {data['name']} 登录失败: 用户名或密码错误")
            return jsonify({
                'status': 'error',
                'message': '用户名或密码错误'
            }), 401
            
    except Exception as e:
        print(f"登录异常: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/v1/cars/similar-models', methods=['GET'])
def get_similar_models():
    """获取同型号车辆的价格信息"""
    try:
        # 获取查询参数
        make = request.args.get('make')
        model = request.args.get('model')
        
        print(f"查询同型号车辆: 品牌={make}, 型号={model}")
        
        if not make or not model:
            return jsonify({
                'status': 'error',
                'message': '缺少必要参数: make和model'
            }), 400
            
        # 连接数据库
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 查询同型号车辆
        query = """
            SELECT 
                id, Make, Model, Year, Price, Mileage, Body_Type, Cylinders,
                Transmission, Fuel_Type, Color, Location 
            FROM car_info
            WHERE Make = %s AND Model = %s
            ORDER BY Year DESC, Price ASC
        """
        
        cursor.execute(query, (make, model))
        similar_cars = cursor.fetchall()
        
        print(f"查询结果: 找到 {len(similar_cars)} 辆同型号车辆")
        
        # 如果没有找到数据，尝试使用模糊匹配
        if not similar_cars:
            print(f"未找到精确匹配的车辆，尝试模糊匹配...")
            fuzzy_query = """
                SELECT 
                    id, Make, Model, Year, Price, Mileage, Body_Type, Cylinders,
                    Transmission, Fuel_Type, Color, Location 
                FROM car_info
                WHERE Make LIKE %s AND Model LIKE %s
                ORDER BY Year DESC, Price ASC
            """
            cursor.execute(fuzzy_query, (f"%{make}%", f"%{model}%"))
            similar_cars = cursor.fetchall()
            print(f"模糊匹配结果: 找到 {len(similar_cars)} 辆相似车辆")
        
        # 计算平均价格和价格范围
        if similar_cars:
            prices = [car['Price'] for car in similar_cars]
            avg_price = sum(prices) / len(prices)
            min_price = min(prices)
            max_price = max(prices)
            
            # 打印第一辆车的详细信息作为调试
            print(f"第一辆车信息: {similar_cars[0]}")
            
            # 计算价格分布
            price_distribution = {}
            for car in similar_cars:
                year = car['Year']
                if year not in price_distribution:
                    price_distribution[year] = []
                price_distribution[year].append(car['Price'])
            
            price_by_year = []
            for year, prices in price_distribution.items():
                price_by_year.append({
                    'year': year,
                    'avg_price': sum(prices) / len(prices),
                    'min_price': min(prices),
                    'max_price': max(prices),
                    'count': len(prices)
                })
            
            # 排序
            price_by_year.sort(key=lambda x: x['year'], reverse=True)
        else:
            avg_price = 0
            min_price = 0
            max_price = 0
            price_by_year = []
            
            # 如果依然没有数据，记录警告
            print(f"警告: 无法在数据库中找到品牌为 {make} 型号为 {model} 的车辆")
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'data': {
                'similar_cars': similar_cars,
                'stats': {
                    'avg_price': avg_price,
                    'min_price': min_price,
                    'max_price': max_price,
                    'count': len(similar_cars)
                },
                'price_by_year': price_by_year
            }
        }), 200
            
    except Exception as e:
        print(f"获取同型号车辆异常: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500 