# 🔐 Password Manager

<div align="center">

![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-Latest-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)
![Maintenance](https://img.shields.io/badge/Maintained-Yes-brightgreen.svg)
![Security](https://img.shields.io/badge/Security-AES--256-red.svg)

</div>

一个基于 Flask 开发的安全密码管理器，支持本地加密存储、密码生成、分类管理等功能。

## ✨ 主要功能

- 🔒 **安全加密**: 使用 AES-256 加密算法保护密码数据
- 👤 **用户认证**: 基于 Argon2 的密码哈希，确保账户安全
- 🎲 **密码生成**: 内置强密码生成器，支持自定义规则
- 📁 **分类管理**: 自定义分类，轻松组织管理密码
- 🌓 **主题切换**: 支持明暗两种主题模式
- 📱 **响应式设计**: 完美适配移动端和桌面端
- 🚀 **一键启动**: 自动打开浏览器，开箱即用

## 🛠️ 技术栈

- **后端**: Flask + SQLAlchemy
- **数据库**: SQLite
- **加密**: Cryptography (AES-256)
- **认证**: Flask-Login + Argon2

## 📦 安装与使用

### 环境要求

- Python 3.7+

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/yourusername/PasswordManager.git
cd PasswordManager
```

2. 安装依赖
```bash
pip install -r requirements.txt
```

3. 运行应用
```bash
python app.py
```

应用将自动在浏览器中打开 `http://127.0.0.1:5000`

## 📖 使用说明

1. **首次使用**: 创建主账户，设置强密码
2. **添加密码**: 点击"添加密码"按钮，填写网站、用户名、密码等信息
3. **分类管理**: 在设置中创建自定义分类，方便密码归档
4. **密码生成**: 使用内置密码生成器创建强密码
5. **主题切换**: 点击主题图标切换明暗模式

## 🔧 打包为可执行文件

项目包含 `build_exe.bat` 脚本，可将应用打包为独立的 exe 文件：

```bash
build_exe.bat
```

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

## ⚠️ 安全提示

- 请务必记住主密码，遗失后无法恢复
- 建议定期备份数据库文件
- 不要在公共网络环境下使用
- 数据库文件默认位置: `密码数据库.db`

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！
