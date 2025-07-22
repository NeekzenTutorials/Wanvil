from flask import Blueprint, request, jsonify
from ..models import Collection, Saga, Tome
from ..database import db

sagas_bp = Blueprint('sagas', __name__, url_prefix='/api')

@sagas_bp.post('/collections/<collection_id>/sagas')
def create_saga(collection_id):
    name = (request.json or {}).get('name', '').strip()
    if not name:
        return {'error': 'Name required'}, 400
    col = Collection.query.get_or_404(collection_id)
    s = Saga(name=name, collection=col)
    db.session.add(s)
    db.session.commit()
    return s.to_dict(), 201

@sagas_bp.get('/sagas/<saga_id>')
def get_saga(saga_id):
    saga = Saga.query.get_or_404(saga_id)
    payload = saga.to_dict()
    payload['tomes'] = [t.to_dict() for t in saga.tomes]   # toujours un tableau
    return jsonify(payload), 200

@sagas_bp.get('/sagas/<saga_id>/tomes')
def list_saga_tomes(saga_id):
    tomes = Tome.query.filter_by(saga_id=saga_id).order_by(Tome.created_at).all()
    return jsonify([t.to_dict() for t in tomes]), 200

@sagas_bp.put('/sagas/<cid>')
def update_saga(cid):
    saga = Saga.query.get_or_404(cid)
    name = (request.json or {}).get('name', '').strip()
    if not name:
        return {'error': 'Name required'}, 400
    saga.name = name
    db.session.commit()
    return saga.to_dict(), 200

@sagas_bp.delete('/sagas/<cid>')
def delete_saga(cid):
    saga = Saga.query.get_or_404(cid)
    db.session.delete(saga)
    db.session.commit()
    return '', 204