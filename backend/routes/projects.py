from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from ..database import db
from ..models import Project

projects_bp = Blueprint('projects', __name__, url_prefix='/api/projects')

@projects_bp.route('', methods=['GET'])
def list_projects():
    """List all projects"""
    projects = Project.query.order_by(Project.created_at).all()
    return jsonify([p.to_dict() for p in projects]), 200

@projects_bp.route('', methods=['POST'])
def create_project():
    """Create a new project"""
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Project name is required'}), 400
    p = Project(name=name)
    db.session.add(p)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Could not create project'}), 500
    return jsonify(p.to_dict()), 201

@projects_bp.route('/<project_id>', methods=['GET'])
def get_project(project_id):
    """Retrieve a single project by ID"""
    p = Project.query.get_or_404(project_id)
    return jsonify(p.to_dict()), 200

@projects_bp.route('/<project_id>', methods=['PUT'])
def update_project(project_id):
    """Update project fields"""
    p = Project.query.get_or_404(project_id)
    data = request.get_json() or {}
    name = data.get('name', None)
    if name is not None:
        name = name.strip()
        if not name:
            return jsonify({'error': 'Project name cannot be empty'}), 400
        p.name = name
    db.session.commit()
    return jsonify(p.to_dict()), 200

@projects_bp.route('/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    """Delete a project and cascade related data if configured"""
    p = Project.query.get_or_404(project_id)
    db.session.delete(p)
    db.session.commit()
    return '', 204