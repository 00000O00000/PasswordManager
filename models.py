from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Config(db.Model):
    __tablename__ = 'config'
    
    id = db.Column(db.Integer, primary_key=True)
    master_password_hash = db.Column(db.String(256), nullable=False)
    encrypted_vault_key = db.Column(db.LargeBinary, nullable=False)
    salt = db.Column(db.LargeBinary, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Category(db.Model):
    __tablename__ = 'category'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    icon = db.Column(db.String(50), default='folder')
    color = db.Column(db.String(7), default='#6366f1')
    entries = db.relationship('Entry', backref='category', lazy=True, cascade='all, delete-orphan')

class Tag(db.Model):
    __tablename__ = 'tag'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)

entry_tags = db.Table('entry_tags',
    db.Column('entry_id', db.Integer, db.ForeignKey('entry.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

class Entry(db.Model):
    __tablename__ = 'entry'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    username = db.Column(db.String(200))
    password = db.Column(db.LargeBinary, nullable=False)
    url = db.Column(db.String(500))
    notes = db.Column(db.LargeBinary)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    is_favorite = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tags = db.relationship('Tag', secondary=entry_tags, lazy='subquery',
                          backref=db.backref('entries', lazy=True))
