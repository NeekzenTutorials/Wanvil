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
    game_design_components = db.relationship('GameDesignComponentModel', back_populates='project', cascade='all, delete-orphan')
    members = db.relationship('ProjectMember', back_populates='project', cascade='all, delete-orphan')
    ticket_board = db.relationship('TicketBoard', back_populates='project', uselist=False, cascade='all, delete-orphan')

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
    characters = db.relationship('Character', back_populates='collection', cascade='all, delete-orphan')
    character_templates = db.relationship('CharacterTemplate', back_populates='collection', cascade='all, delete-orphan')
    places = db.relationship('Place', back_populates='collection', cascade='all, delete-orphan')
    items = db.relationship('Item', back_populates='collection', cascade='all, delete-orphan')
    events = db.relationship('Event', back_populates='collection', cascade='all, delete-orphan')
    timeline = db.relationship('CollectionTimeline', back_populates='collection', uselist=False, cascade='all, delete-orphan')

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
    notes = db.Column(db.Text, default="")
    annotations = db.Column(db.JSON, nullable=True, default=dict)

    tome = db.relationship('Tome', back_populates='chapters')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'tomeId': self.tome_id,
            'position': self.position,
            "notes": self.notes or "",
            'annotations': self.annotations or {},
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

class Tag(db.Model):
    __tablename__ = 'tags'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    collection_id = db.Column(db.String, db.ForeignKey('collections.id'), nullable=False)
    name  = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(32), nullable=True)
    note  = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    scope = db.Column(db.String(32), nullable=False, default='character')

    characters = db.relationship('Character', secondary='character_tags', back_populates='tags')
    places = db.relationship('Place', secondary='place_tags', back_populates='tags')
    items = db.relationship('Item', secondary='item_tags', back_populates='tags')
    events = db.relationship('Event', secondary='event_tags', back_populates='tags')

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'color': self.color, 'note': self.note,
                'collectionId': self.collection_id, 'scope': self.scope}

class CharacterTag(db.Model):
    __tablename__ = 'character_tags'
    character_id = db.Column(db.String, db.ForeignKey('characters.id'), primary_key=True)
    tag_id       = db.Column(db.String, db.ForeignKey('tags.id'), primary_key=True)

class Place(db.Model):
    __tablename__ = 'places'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(300), nullable=True)          # ex: "Paris", "Forêt de Lyr", coords libres
    description = db.Column(db.Text, nullable=True)               # richtext HTML depuis TinyMCE
    images = db.Column(db.JSON, nullable=True, default=list)      # [urls]
    content = db.Column(db.JSON, nullable=True, default=dict)     # champs custom *propres au lieu*

    collection_id = db.Column(db.String, db.ForeignKey('collections.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    collection = db.relationship('Collection', back_populates='places')
    tags = db.relationship('Tag', secondary='place_tags', back_populates='places')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'description': self.description,
            'images': self.images or [],
            'collectionId': self.collection_id,
            'content': self.content or {},
            'tags': [t.to_dict() for t in self.tags],
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }

class PlaceTag(db.Model):
    __tablename__ = 'place_tags'
    place_id = db.Column(db.String, db.ForeignKey('places.id'), primary_key=True)
    tag_id   = db.Column(db.String, db.ForeignKey('tags.id'), primary_key=True)

class Item(db.Model):
    __tablename__ = 'items'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(150), nullable=True)
    description = db.Column(db.Text, nullable=True)
    images = db.Column(db.JSON, nullable=True, default=list)
    content = db.Column(db.JSON, nullable=True, default=dict)

    collection_id = db.Column(db.String, db.ForeignKey('collections.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    collection = db.relationship('Collection', back_populates='items')
    tags = db.relationship('Tag', secondary='item_tags', back_populates='items')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'images': self.images or [],
            'collectionId': self.collection_id,
            'content': self.content or {},
            'tags': [t.to_dict() for t in self.tags],
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


class ItemTag(db.Model):
    __tablename__ = 'item_tags'
    item_id = db.Column(db.String, db.ForeignKey('items.id'), primary_key=True)
    tag_id  = db.Column(db.String, db.ForeignKey('tags.id'), primary_key=True)

class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date   = db.Column(db.Date, nullable=True)

    description = db.Column(db.Text, nullable=True)          # richtext HTML
    images      = db.Column(db.JSON, nullable=True, default=list)
    content     = db.Column(db.JSON, nullable=True, default=dict)  # champs custom typés (comme items/places)

    collection_id = db.Column(db.String, db.ForeignKey('collections.id'), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, onupdate=datetime.utcnow)

    collection = db.relationship('Collection', back_populates='events')
    tags = db.relationship('Tag', secondary='event_tags', back_populates='events')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'startDate': self.start_date.isoformat(),
            'endDate': self.end_date.isoformat() if self.end_date else None,
            'description': self.description,
            'images': self.images or [],
            'collectionId': self.collection_id,
            'content': self.content or {},
            'tags': [t.to_dict() for t in self.tags],
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }

class EventTag(db.Model):
    __tablename__ = 'event_tags'
    event_id = db.Column(db.String, db.ForeignKey('events.id'), primary_key=True)
    tag_id   = db.Column(db.String, db.ForeignKey('tags.id'), primary_key=True)


class CollectionTimeline(db.Model):
    __tablename__ = 'collection_timelines'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    collection_id = db.Column(db.String, db.ForeignKey('collections.id'), nullable=False, unique=True)
    data = db.Column(db.JSON, nullable=True, default=dict)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    collection = db.relationship('Collection', back_populates='timeline')

    def to_dict(self):
        return {
            'id': self.id,
            'collectionId': self.collection_id,
            'data': self.data or {},
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


class GameDesignComponentModel(db.Model):
    __tablename__ = 'game_design_components'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String, db.ForeignKey('projects.id'), nullable=False)
    component_type = db.Column(db.String(100), nullable=False)  # e.g. 'map-editor'
    data = db.Column(db.JSON, nullable=True, default=dict)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    project = db.relationship('Project', back_populates='game_design_components')

    __table_args__ = (
        db.UniqueConstraint('project_id', 'component_type', name='uq_project_component'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'projectId': self.project_id,
            'componentType': self.component_type,
            'data': self.data or {},
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


# ─── Project Members ───

class ProjectMember(db.Model):
    __tablename__ = 'project_members'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String, db.ForeignKey('projects.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(100), nullable=True)
    color = db.Column(db.String(32), nullable=True)  # avatar color
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', back_populates='members')
    assignments = db.relationship('TicketAssignee', back_populates='member', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'projectId': self.project_id,
            'name': self.name,
            'role': self.role,
            'color': self.color,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


# ─── Ticket Board ───

class TicketBoard(db.Model):
    """One board per project (created when the task-board GD component is added)."""
    __tablename__ = 'ticket_boards'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String, db.ForeignKey('projects.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', back_populates='ticket_board')
    columns = db.relationship('TicketColumn', back_populates='board', cascade='all, delete-orphan',
                              order_by='TicketColumn.position')

    def to_dict(self):
        return {
            'id': self.id,
            'projectId': self.project_id,
            'columns': [c.to_dict() for c in self.columns],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class TicketColumn(db.Model):
    """A column / status lane on the board (e.g. To Do, In Progress, Done)."""
    __tablename__ = 'ticket_columns'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    board_id = db.Column(db.String, db.ForeignKey('ticket_boards.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(32), nullable=False, default='#6366f1')  # column accent color
    position = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    board = db.relationship('TicketBoard', back_populates='columns')
    tickets = db.relationship('Ticket', back_populates='column', cascade='all, delete-orphan',
                              order_by='Ticket.position')

    def to_dict(self):
        return {
            'id': self.id,
            'boardId': self.board_id,
            'name': self.name,
            'color': self.color,
            'position': self.position,
            'tickets': [t.to_dict() for t in self.tickets],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Ticket(db.Model):
    __tablename__ = 'tickets'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    column_id = db.Column(db.String, db.ForeignKey('ticket_columns.id'), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True, default='')
    priority = db.Column(db.String(20), nullable=False, default='medium')  # low, medium, high, critical
    position = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    column = db.relationship('TicketColumn', back_populates='tickets')
    tags = db.relationship('TicketTag', back_populates='ticket', cascade='all, delete-orphan')
    checklist = db.relationship('TicketChecklistItem', back_populates='ticket', cascade='all, delete-orphan',
                                order_by='TicketChecklistItem.position')
    assignees = db.relationship('TicketAssignee', back_populates='ticket', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'columnId': self.column_id,
            'title': self.title,
            'description': self.description or '',
            'priority': self.priority,
            'position': self.position,
            'tags': [t.to_dict() for t in self.tags],
            'checklist': [c.to_dict() for c in self.checklist],
            'assignees': [a.to_dict() for a in self.assignees],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


class TicketTag(db.Model):
    __tablename__ = 'ticket_tags'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = db.Column(db.String, db.ForeignKey('tickets.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(32), nullable=False, default='#6366f1')

    ticket = db.relationship('Ticket', back_populates='tags')

    def to_dict(self):
        return {'id': self.id, 'ticketId': self.ticket_id, 'name': self.name, 'color': self.color}


class TicketChecklistItem(db.Model):
    __tablename__ = 'ticket_checklist_items'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = db.Column(db.String, db.ForeignKey('tickets.id'), nullable=False)
    text = db.Column(db.String(500), nullable=False)
    done = db.Column(db.Boolean, nullable=False, default=False)
    position = db.Column(db.Integer, nullable=False, default=0)

    ticket = db.relationship('Ticket', back_populates='checklist')

    def to_dict(self):
        return {'id': self.id, 'ticketId': self.ticket_id, 'text': self.text, 'done': self.done, 'position': self.position}


class TicketAssignee(db.Model):
    __tablename__ = 'ticket_assignees'
    ticket_id = db.Column(db.String, db.ForeignKey('tickets.id'), primary_key=True)
    member_id = db.Column(db.String, db.ForeignKey('project_members.id'), primary_key=True)

    ticket = db.relationship('Ticket', back_populates='assignees')
    member = db.relationship('ProjectMember', back_populates='assignments')

    def to_dict(self):
        return {'ticketId': self.ticket_id, 'memberId': self.member_id, 'memberName': self.member.name, 'memberColor': self.member.color}