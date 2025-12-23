from flask import Flask
from config import Config
from models import db
from auth import login_manager
from routes import main_bp, api_bp
import os
import webbrowser
import threading
import time

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'main.index'
    
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp)
    
    with app.app_context():
        db.create_all()
    
    return app

def open_browser():
    time.sleep(1.5)
    webbrowser.open('http://127.0.0.1:5000')

if __name__ == '__main__':
    app = create_app()
    
    print("=" * 60)
    print("密码管理器正在启动...")
    print("=" * 60)
    print()
    print("  访问地址: http://127.0.0.1:5000")
    print(f"  数据库位置: {app.config['DB_PATH']}")
    print()
    print("  ⚠️  重要提示:")
    print("  • 请勿关闭此窗口，否则密码管理器将停止运行")
    print("  • 浏览器将自动打开，如未打开请手动访问上述地址")
    print("  • 按 Ctrl+C 可安全退出程序")
    print()
    print("=" * 60)
    print()
    
    threading.Thread(target=open_browser, daemon=True).start()
    
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
