from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from ..database import db
from ..models import GameDesignComponentModel

game_design_bp = Blueprint('game_design', __name__, url_prefix='/api/projects/<project_id>/game-design')

VALID_TYPES = {'map-editor'}


@game_design_bp.route('', methods=['GET'])
def list_components(project_id):
    """List all game-design components enabled for this project."""
    comps = GameDesignComponentModel.query.filter_by(project_id=project_id).order_by(GameDesignComponentModel.created_at).all()
    return jsonify([c.to_dict() for c in comps]), 200


@game_design_bp.route('', methods=['POST'])
def add_component(project_id):
    """Enable a game-design component for this project."""
    data = request.get_json() or {}
    ctype = data.get('componentType', '').strip()
    if ctype not in VALID_TYPES:
        return jsonify({'error': f'Unknown component type: {ctype}'}), 400

    comp = GameDesignComponentModel(project_id=project_id, component_type=ctype, data={})
    db.session.add(comp)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Component already exists for this project'}), 409
    return jsonify(comp.to_dict()), 201


@game_design_bp.route('/<comp_id>', methods=['GET'])
def get_component(project_id, comp_id):
    """Get a single component (with its data)."""
    comp = GameDesignComponentModel.query.filter_by(id=comp_id, project_id=project_id).first_or_404()
    return jsonify(comp.to_dict()), 200


@game_design_bp.route('/<comp_id>', methods=['PUT'])
def update_component(project_id, comp_id):
    """Update the component data (e.g. save map state)."""
    comp = GameDesignComponentModel.query.filter_by(id=comp_id, project_id=project_id).first_or_404()
    body = request.get_json() or {}
    if 'data' in body:
        comp.data = body['data']
    db.session.commit()
    return jsonify(comp.to_dict()), 200


@game_design_bp.route('/<comp_id>', methods=['DELETE'])
def delete_component(project_id, comp_id):
    """Remove a game-design component and all its data."""
    comp = GameDesignComponentModel.query.filter_by(id=comp_id, project_id=project_id).first_or_404()
    db.session.delete(comp)
    db.session.commit()
    return '', 204
