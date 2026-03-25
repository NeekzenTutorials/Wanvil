from flask import Blueprint, request, jsonify
from ..database import db
from ..models import ProjectMember

members_bp = Blueprint('members', __name__, url_prefix='/api/projects/<project_id>/members')


@members_bp.route('', methods=['GET'])
def list_members(project_id):
    members = ProjectMember.query.filter_by(project_id=project_id).order_by(ProjectMember.created_at).all()
    return jsonify([m.to_dict() for m in members]), 200


@members_bp.route('', methods=['POST'])
def create_member(project_id):
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Member name is required'}), 400
    m = ProjectMember(
        project_id=project_id,
        name=name,
        role=data.get('role', '').strip() or None,
        color=data.get('color', '#6366f1'),
    )
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201


@members_bp.route('/<member_id>', methods=['PUT'])
def update_member(project_id, member_id):
    m = ProjectMember.query.filter_by(id=member_id, project_id=project_id).first_or_404()
    data = request.get_json() or {}
    if 'name' in data:
        name = data['name'].strip()
        if not name:
            return jsonify({'error': 'Member name cannot be empty'}), 400
        m.name = name
    if 'role' in data:
        m.role = data['role'].strip() or None
    if 'color' in data:
        m.color = data['color']
    db.session.commit()
    return jsonify(m.to_dict()), 200


@members_bp.route('/<member_id>', methods=['DELETE'])
def delete_member(project_id, member_id):
    m = ProjectMember.query.filter_by(id=member_id, project_id=project_id).first_or_404()
    db.session.delete(m)
    db.session.commit()
    return '', 204
