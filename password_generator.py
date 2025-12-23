import secrets
import string

class PasswordGenerator:
    @staticmethod
    def generate(length=16, use_uppercase=True, use_lowercase=True, 
                 use_digits=True, use_symbols=True):
        characters = ''
        
        if use_lowercase:
            characters += string.ascii_lowercase
        if use_uppercase:
            characters += string.ascii_uppercase
        if use_digits:
            characters += string.digits
        if use_symbols:
            characters += '!@#$%^&*()_+-=[]{}|;:,.<>?'
        
        if not characters:
            characters = string.ascii_letters + string.digits
        
        password = ''.join(secrets.choice(characters) for _ in range(length))
        
        return password
    
    @staticmethod
    def calculate_strength(password):
        if not password:
            return 0
        
        score = 0
        length = len(password)
        
        if length >= 8:
            score += 1
        if length >= 12:
            score += 1
        if length >= 16:
            score += 1
        
        if any(c.islower() for c in password):
            score += 1
        if any(c.isupper() for c in password):
            score += 1
        if any(c.isdigit() for c in password):
            score += 1
        if any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
            score += 1
        
        return min(score, 5)

password_generator = PasswordGenerator()
