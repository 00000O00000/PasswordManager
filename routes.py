from flask import Blueprint, request, jsonify, render_template, session
from flask_login import login_user, logout_user, login_required, current_user
from models import db, Entry, Category, Tag, Config as ConfigModel
from encryption import encryption_service
from password_generator import password_generator
from auth import User, is_setup_complete, setup_master_password, verify_and_unlock, lock_vault
import json

main_bp = Blueprint('main', __name__)
api_bp = Blueprint('api', __name__, url_prefix='/api')

@main_bp.route('/')
def index():
    if not is_setup_complete():
        return render_template('setup.html')
    if current_user.is_authenticated:
        return render_template('vault.html')
    return render_template('login.html')

@main_bp.route('/favicon.ico')
def favicon():
    import os
    import sys
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
    
    favicon_path = os.path.join(base_path, 'favicon.ico')
    if os.path.exists(favicon_path):
        from flask import send_file
        return send_file(favicon_path, mimetype='image/x-icon')
    else:
        from flask import abort
        abort(404)

@main_bp.route('/vault')
@login_required
def vault():
    return render_template('vault.html')

@api_bp.route('/setup', methods=['POST'])
def api_setup():
    if is_setup_complete():
        return jsonify({'error': 'Setup already completed'}), 400
    
    data = request.get_json()
    master_password = data.get('master_password')
    
    if not master_password:
        return jsonify({'error': 'Master password required'}), 400
    
    try:
        setup_master_password(master_password)
        
        default_categories = [
            {'name': '社交媒体', 'icon': 'social', 'color': '#3b82f6'},
            {'name': '银行', 'icon': 'bank', 'color': '#10b981'},
            {'name': '邮箱', 'icon': 'email', 'color': '#f59e0b'},
            {'name': '工作', 'icon': 'work', 'color': '#8b5cf6'},
            {'name': '其他', 'icon': 'other', 'color': '#6366f1'}
        ]
        
        for cat_data in default_categories:
            category = Category(**cat_data)
            db.session.add(category)
        db.session.commit()
        
        user = User('1')
        login_user(user, remember=True)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/login', methods=['POST'])
def api_login():
    data = request.get_json()
    master_password = data.get('master_password')
    
    if not master_password:
        return jsonify({'error': 'Master password required'}), 400
    
    if verify_and_unlock(master_password):
        user = User('1')
        login_user(user, remember=True)
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Invalid master password'}), 401

@api_bp.route('/logout', methods=['POST'])
@login_required
def api_logout():
    lock_vault()
    logout_user()
    return jsonify({'success': True})

@api_bp.route('/lock', methods=['POST'])
@login_required
def api_lock():
    lock_vault()
    logout_user()
    return jsonify({'success': True})

@api_bp.route('/entries', methods=['GET'])
@login_required
def get_entries():
    entries = Entry.query.all()
    result = []
    
    for entry in entries:
        try:
            decrypted_password = encryption_service.decrypt_data(entry.password)
            decrypted_notes = encryption_service.decrypt_data(entry.notes) if entry.notes else ''
            
            result.append({
                'id': entry.id,
                'title': entry.title,
                'username': entry.username,
                'password': decrypted_password,
                'url': entry.url,
                'notes': decrypted_notes,
                'category_id': entry.category_id,
                'is_favorite': entry.is_favorite,
                'created_at': entry.created_at.isoformat(),
                'updated_at': entry.updated_at.isoformat(),
                'tags': [{'id': tag.id, 'name': tag.name} for tag in entry.tags]
            })
        except Exception as e:
            continue
    
    return jsonify(result)

@api_bp.route('/entries', methods=['POST'])
@login_required
def create_entry():
    data = request.get_json()
    
    try:
        encrypted_password = encryption_service.encrypt_data(data['password'])
        encrypted_notes = encryption_service.encrypt_data(data.get('notes', ''))
        
        entry = Entry(
            title=data['title'],
            username=data.get('username', ''),
            password=encrypted_password,
            url=data.get('url', ''),
            notes=encrypted_notes,
            category_id=data.get('category_id'),
            is_favorite=data.get('is_favorite', False)
        )
        
        if 'tags' in data:
            for tag_name in data['tags']:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                entry.tags.append(tag)
        
        db.session.add(entry)
        db.session.commit()
        
        return jsonify({
            'id': entry.id,
            'title': entry.title,
            'username': entry.username,
            'password': data['password'],
            'url': entry.url,
            'notes': data.get('notes', ''),
            'category_id': entry.category_id,
            'is_favorite': entry.is_favorite,
            'created_at': entry.created_at.isoformat(),
            'updated_at': entry.updated_at.isoformat(),
            'tags': [{'id': tag.id, 'name': tag.name} for tag in entry.tags]
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/entries/<int:entry_id>', methods=['GET'])
@login_required
def get_entry(entry_id):
    entry = Entry.query.get_or_404(entry_id)
    
    try:
        decrypted_password = encryption_service.decrypt_data(entry.password)
        decrypted_notes = encryption_service.decrypt_data(entry.notes) if entry.notes else ''
        
        return jsonify({
            'id': entry.id,
            'title': entry.title,
            'username': entry.username,
            'password': decrypted_password,
            'url': entry.url,
            'notes': decrypted_notes,
            'category_id': entry.category_id,
            'is_favorite': entry.is_favorite,
            'created_at': entry.created_at.isoformat(),
            'updated_at': entry.updated_at.isoformat(),
            'tags': [{'id': tag.id, 'name': tag.name} for tag in entry.tags]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/entries/<int:entry_id>', methods=['PUT'])
@login_required
def update_entry(entry_id):
    entry = Entry.query.get_or_404(entry_id)
    data = request.get_json()
    
    try:
        if 'title' in data:
            entry.title = data['title']
        if 'username' in data:
            entry.username = data['username']
        if 'password' in data:
            entry.password = encryption_service.encrypt_data(data['password'])
        if 'url' in data:
            entry.url = data['url']
        if 'notes' in data:
            entry.notes = encryption_service.encrypt_data(data['notes'])
        if 'category_id' in data:
            entry.category_id = data['category_id']
        if 'is_favorite' in data:
            entry.is_favorite = data['is_favorite']
        
        if 'tags' in data:
            entry.tags.clear()
            for tag_name in data['tags']:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                entry.tags.append(tag)
        
        db.session.commit()
        
        decrypted_password = encryption_service.decrypt_data(entry.password)
        decrypted_notes = encryption_service.decrypt_data(entry.notes) if entry.notes else ''
        
        return jsonify({
            'id': entry.id,
            'title': entry.title,
            'username': entry.username,
            'password': decrypted_password,
            'url': entry.url,
            'notes': decrypted_notes,
            'category_id': entry.category_id,
            'is_favorite': entry.is_favorite,
            'created_at': entry.created_at.isoformat(),
            'updated_at': entry.updated_at.isoformat(),
            'tags': [{'id': tag.id, 'name': tag.name} for tag in entry.tags]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/entries/<int:entry_id>', methods=['DELETE'])
@login_required
def delete_entry(entry_id):
    entry = Entry.query.get_or_404(entry_id)
    
    try:
        db.session.delete(entry)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/categories', methods=['GET'])
@login_required
def get_categories():
    categories = Category.query.all()
    return jsonify([{
        'id': cat.id,
        'name': cat.name,
        'icon': cat.icon,
        'color': cat.color,
        'count': len(cat.entries)
    } for cat in categories])

@api_bp.route('/categories', methods=['POST'])
@login_required
def create_category():
    data = request.get_json()
    
    try:
        category = Category(
            name=data['name'],
            icon=data.get('icon', 'folder'),
            color=data.get('color', '#6366f1')
        )
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'id': category.id,
            'name': category.name,
            'icon': category.icon,
            'color': category.color,
            'count': 0
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/categories/<int:category_id>', methods=['PUT'])
@login_required
def update_category(category_id):
    category = Category.query.get_or_404(category_id)
    data = request.get_json()
    
    try:
        if 'name' in data:
            category.name = data['name']
        if 'icon' in data:
            category.icon = data['icon']
        if 'color' in data:
            category.color = data['color']
        
        db.session.commit()
        
        return jsonify({
            'id': category.id,
            'name': category.name,
            'icon': category.icon,
            'color': category.color,
            'count': len(category.entries)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@login_required
def delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    
    try:
        db.session.delete(category)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/tags', methods=['GET'])
@login_required
def get_tags():
    tags = Tag.query.all()
    return jsonify([{
        'id': tag.id,
        'name': tag.name,
        'count': len(tag.entries)
    } for tag in tags])

@api_bp.route('/tags', methods=['POST'])
@login_required
def create_tag():
    data = request.get_json()
    
    try:
        tag = Tag(name=data['name'])
        db.session.add(tag)
        db.session.commit()
        
        return jsonify({
            'id': tag.id,
            'name': tag.name,
            'count': 0
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/generate-password', methods=['POST'])
@login_required
def generate_password():
    data = request.get_json()
    
    length = data.get('length', 16)
    use_uppercase = data.get('use_uppercase', True)
    use_lowercase = data.get('use_lowercase', True)
    use_digits = data.get('use_digits', True)
    use_symbols = data.get('use_symbols', True)
    
    password = password_generator.generate(
        length=length,
        use_uppercase=use_uppercase,
        use_lowercase=use_lowercase,
        use_digits=use_digits,
        use_symbols=use_symbols
    )
    
    strength = password_generator.calculate_strength(password)
    
    return jsonify({
        'password': password,
        'strength': strength
    })

@api_bp.route('/search', methods=['GET'])
@login_required
def search_entries():
    query = request.args.get('q', '').lower()
    
    if not query:
        return jsonify([])
    
    entries = Entry.query.all()
    results = []
    
    for entry in entries:
        if (query in entry.title.lower() or 
            (entry.username and query in entry.username.lower()) or 
            (entry.url and query in entry.url.lower())):
            try:
                decrypted_password = encryption_service.decrypt_data(entry.password)
                decrypted_notes = encryption_service.decrypt_data(entry.notes) if entry.notes else ''
                
                results.append({
                    'id': entry.id,
                    'title': entry.title,
                    'username': entry.username,
                    'password': decrypted_password,
                    'url': entry.url,
                    'notes': decrypted_notes,
                    'category_id': entry.category_id,
                    'is_favorite': entry.is_favorite,
                    'created_at': entry.created_at.isoformat(),
                    'updated_at': entry.updated_at.isoformat(),
                    'tags': [{'id': tag.id, 'name': tag.name} for tag in entry.tags]
                })
            except Exception:
                continue
    
    return jsonify(results)

@api_bp.route('/export', methods=['GET'])
@login_required
def export_data():
    entries = Entry.query.all()
    categories = Category.query.all()
    tags = Tag.query.all()
    
    export = {
        'entries': [],
        'categories': [],
        'tags': []
    }
    
    for entry in entries:
        try:
            decrypted_password = encryption_service.decrypt_data(entry.password)
            decrypted_notes = encryption_service.decrypt_data(entry.notes) if entry.notes else ''
            
            export['entries'].append({
                'title': entry.title,
                'username': entry.username,
                'password': decrypted_password,
                'url': entry.url,
                'notes': decrypted_notes,
                'category_id': entry.category_id,
                'is_favorite': entry.is_favorite,
                'tags': [tag.name for tag in entry.tags]
            })
        except Exception:
            continue
    
    for cat in categories:
        export['categories'].append({
            'name': cat.name,
            'icon': cat.icon,
            'color': cat.color
        })
    
    for tag in tags:
        export['tags'].append({
            'name': tag.name
        })
    
    return jsonify(export)

@api_bp.route('/import', methods=['POST'])
@login_required
def import_data():
    data = request.get_json()
    
    try:
        category_map = {}
        for cat_data in data.get('categories', []):
            existing = Category.query.filter_by(name=cat_data['name']).first()
            if not existing:
                category = Category(**cat_data)
                db.session.add(category)
                db.session.flush()
                category_map[cat_data['name']] = category.id
            else:
                category_map[cat_data['name']] = existing.id
        
        tag_map = {}
        for tag_data in data.get('tags', []):
            existing = Tag.query.filter_by(name=tag_data['name']).first()
            if not existing:
                tag = Tag(**tag_data)
                db.session.add(tag)
                db.session.flush()
                tag_map[tag_data['name']] = tag
            else:
                tag_map[tag_data['name']] = existing
        
        for entry_data in data.get('entries', []):
            encrypted_password = encryption_service.encrypt_data(entry_data['password'])
            encrypted_notes = encryption_service.encrypt_data(entry_data.get('notes', ''))
            
            entry = Entry(
                title=entry_data['title'],
                username=entry_data.get('username', ''),
                password=encrypted_password,
                url=entry_data.get('url', ''),
                notes=encrypted_notes,
                category_id=entry_data.get('category_id'),
                is_favorite=entry_data.get('is_favorite', False)
            )
            
            if 'tags' in entry_data:
                for tag_name in entry_data['tags']:
                    if tag_name in tag_map:
                        entry.tags.append(tag_map[tag_name])
            
            db.session.add(entry)
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Data imported successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
