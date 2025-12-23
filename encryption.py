from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from argon2 import PasswordHasher
import os
import base64

class EncryptionService:
    def __init__(self):
        self.vault_key = None
        self.ph = PasswordHasher()
    
    def derive_master_key(self, master_password: str, salt: bytes) -> bytes:
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return base64.urlsafe_b64encode(kdf.derive(master_password.encode()))
    
    def hash_master_password(self, master_password: str) -> str:
        return self.ph.hash(master_password)
    
    def verify_master_password(self, hash: str, master_password: str) -> bool:
        try:
            self.ph.verify(hash, master_password)
            return True
        except Exception:
            return False
    
    def generate_vault_key(self) -> bytes:
        return Fernet.generate_key()
    
    def encrypt_vault_key(self, vault_key: bytes, master_key: bytes) -> bytes:
        f = Fernet(master_key)
        return f.encrypt(vault_key)
    
    def decrypt_vault_key(self, encrypted_vault_key: bytes, master_key: bytes) -> bytes:
        f = Fernet(master_key)
        return f.decrypt(encrypted_vault_key)
    
    def set_vault_key(self, vault_key: bytes):
        self.vault_key = vault_key
    
    def encrypt_data(self, data: str) -> bytes:
        if not self.vault_key:
            raise ValueError("Vault key not set")
        if not data:
            return b''
        f = Fernet(self.vault_key)
        return f.encrypt(data.encode())
    
    def decrypt_data(self, encrypted_data: bytes) -> str:
        if not self.vault_key:
            raise ValueError("Vault key not set")
        if not encrypted_data:
            return ''
        f = Fernet(self.vault_key)
        return f.decrypt(encrypted_data).decode()
    
    def clear_vault_key(self):
        self.vault_key = None

encryption_service = EncryptionService()
