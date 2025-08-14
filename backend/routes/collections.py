from flask import Blueprint, request, jsonify
from ..models import Project, Collection, Saga
from ..database import db

collections_bp = Blueprint('collections', __name__, url_prefix='/api')

@collections_bp.post('/projects/<project_id>/collections')
def create_collection(project_id):
    name = (request.json or {}).get('name', '').strip()
    if not name:
        return {'error': 'Name required'}, 400
    proj = Project.query.get_or_404(project_id)
    c = Collection(name=name, project=proj)
    db.session.add(c)
    db.session.commit()
    return c.to_dict(), 201

@collections_bp.get('/collections/<cid>')
def get_collection(cid):
    col = Collection.query.get_or_404(cid)
    payload = col.to_dict()
    payload["sagas"] = [s.to_dict() for s in col.sagas]
    return jsonify(payload), 200

@collections_bp.get('/collections/<project_id>/sagas')
def get_collections_sagas(project_id):
    sagas = Saga.query.filter_by(collection_id=project_id).all()
    return jsonify([s.to_dict() for s in sagas]), 200

@collections_bp.put('/collections/<cid>')
def update_collection(cid):
    col = Collection.query.get_or_404(cid)
    name = (request.json or {}).get('name', '').strip()
    if not name:
        return {'error': 'Name required'}, 400
    col.name = name
    db.session.commit()
    return col.to_dict(), 200

@collections_bp.delete('/collections/<cid>')
def delete_collection(cid):
    col = Collection.query.get_or_404(cid)
    db.session.delete(col)
    db.session.commit()
    return '', 204

@collections_bp.get('/projects/<project_id>/collections')
def list_collections_for_project(project_id):
    cols = Collection.query.filter_by(project_id=project_id).order_by(Collection.created_at.asc()).all()
    return jsonify([c.to_dict() for c in cols]), 200