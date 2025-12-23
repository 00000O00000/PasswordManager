from flask_login import LoginManager, UserMixin
from models import db, Config as ConfigModel
from encryption import encryption_service
import os

login_manager = LoginManager()

class User(UserMixin):
    def __init__(self, id):
        self.id = id

@login_manager.user_loader
def load_user(user_id):
    if user_id == '1':
        return User('1')
    return None

def is_setup_complete():
    config = ConfigModel.query.first()
    return config is not None

def setup_master_password(master_password: str):
    if is_setup_complete():
        raise ValueError("Setup already completed")
    
    salt = os.urandom(16)
    master_key = encryption_service.derive_master_key(master_password, salt)
    vault_key = encryption_service.generate_vault_key()
    encrypted_vault_key = encryption_service.encrypt_vault_key(vault_key, master_key)
    password_hash = encryption_service.hash_master_password(master_password)
    
    config = ConfigModel(
        master_password_hash=password_hash,
        encrypted_vault_key=encrypted_vault_key,
        salt=salt
    )
    db.session.add(config)
    db.session.commit()
    
    encryption_service.set_vault_key(vault_key)
    
    return True

def verify_and_unlock(master_password: str):
    config = ConfigModel.query.first()
    if not config:
        return False
    
    if not encryption_service.verify_master_password(config.master_password_hash, master_password):
        return False
    
    try:
        master_key = encryption_service.derive_master_key(master_password, config.salt)
        vault_key = encryption_service.decrypt_vault_key(config.encrypted_vault_key, master_key)
        encryption_service.set_vault_key(vault_key)
        return True
    except Exception:
        return False

def lock_vault():
    encryption_service.clear_vault_key()
