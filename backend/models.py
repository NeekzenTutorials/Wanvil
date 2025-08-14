import uuid
from datetime import datetime
from .database import db
from sqlalchemy.dialects.postgresql import JSONB

class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    collections = db.relationship('Collection', back_populates='project', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
    
class Collection(db.Model):
    __tablename__ = 'collections'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    project_id = db.Column(db.String, db.ForeignKey('projects.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    project = db.relationship('Project', back_populates='collections')
    sagas = db.relationship('Saga', back_populates='collection', cascade='all, delete-orphan')
    characters = db.relationship(
        'Character',
        back_populates='collection',
        cascade='all, delete-orphan'
    )

    character_templates = db.relationship(
        'CharacterTemplate',
        back_populates='collection',
        cascade='all, delete-orphan'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'projectId': self.project_id,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
    
class Saga(db.Model):
    __tablename__ = 'sagas'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    collection_id = db.Column(db.String, db.ForeignKey('collections.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    collection = db.relationship('Collection', back_populates='sagas')
    tomes = db.relationship('Tome', back_populates='saga', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'collectionId': self.collection_id,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
    
class Tome(db.Model):
    __tablename__ = 'tomes'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    saga_id = db.Column(db.String, db.ForeignKey('sagas.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    summary = db.Column(db.Text, nullable=True)


    saga = db.relationship('Saga', back_populates='tomes')
    chapters = db.relationship('Chapter', back_populates='tome', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'sagaId': self.saga_id,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
    
class Chapter(db.Model):
    __tablename__ = 'chapters'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    tome_id = db.Column(db.String, db.ForeignKey('tomes.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    position = db.Column(db.Integer, nullable=True)
    

    tome = db.relationship('Tome', back_populates='chapters')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'tomeId': self.tome_id,
            'position': self.position,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
    
class Character(db.Model):
    __tablename__ = 'characters'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    firstname = db.Column(db.String(200), nullable=False)
    lastname  = db.Column(db.String(200), nullable=False)
    age       = db.Column(db.Integer, nullable=True)
    birthdate = db.Column(db.Date, nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)  # facultatif
    content   = db.Column(db.JSON, nullable=True)          # <— au lieu de JSONB
    collection_id = db.Column(db.String, db.ForeignKey('collections.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    collection = db.relationship('Collection', back_populates='characters')
    tags = db.relationship('Tag', secondary='character_tags', back_populates='characters')

    def to_dict(self):
        return {
            'id': self.id,
            'firstname': self.firstname,
            'lastname': self.lastname,
            'age': self.age,
            'birthdate': self.birthdate.isoformat() if self.birthdate else None,
            'avatarUrl': self.avatar_url,
            'collectionId': self.collection_id,
            'content': self.content or {},
            'tags': [t.to_dict() for t in self.tags],
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

class CharacterTemplate(db.Model):
    __tablename__ = 'character_templates'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    collection_id = db.Column(db.String, db.ForeignKey('collections.id'), nullable=False)
    character_template = db.Column(db.JSON, nullable=False, default=dict)  # <— JSON portable
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    collection = db.relationship('Collection', back_populates='character_templates')

    def to_dict(self):
        return {
            'id': self.id,
            'collectionId': self.collection_id,
            'characterTemplate': self.character_template or {},
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

# Tags (facultatif mais recommandé)
class Tag(db.Model):
    __tablename__ = 'tags'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    collection_id = db.Column(db.String, db.ForeignKey('collections.id'), nullable=False)
    name  = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(32), nullable=True)   # ex: #E11D48
    note  = db.Column(db.Text, nullable=True)         # ← NEW
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    characters = db.relationship('Character', secondary='character_tags', back_populates='tags')

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'color': self.color,
            'note': self.note, 'collectionId': self.collection_id
        }

class CharacterTag(db.Model):
    __tablename__ = 'character_tags'
    character_id = db.Column(db.String, db.ForeignKey('characters.id'), primary_key=True)
    tag_id       = db.Column(db.String, db.ForeignKey('tags.id'), primary_key=True)