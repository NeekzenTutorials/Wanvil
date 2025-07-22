from flask import Blueprint, request, jsonify
from ..models import Saga, Tome
from ..database import db

tomes_bp = Blueprint('tomes', __name__, url_prefix='/api')

@tomes_bp.post('/sagas/<saga_id>/tomes')
def create_tome(saga_id):
    name = (request.json or {}).get('name', '').strip()
    if not name:
        return {'error': 'Name required'}, 400
    sg = Saga.query.get_or_404(saga_id)
    t = Tome(name=name, saga=sg)
    db.session.add(t)
    db.session.commit()
    return t.to_dict(), 201

@tomes_bp.get('/tomes/<cid>')
def get_tome(cid):
    tome = Tome.query.get_or_404(cid)
    return jsonify(tome.to_dict()), 200

@tomes_bp.get('/tomes/<tomes_id>/chapters')
def get_tomes_chapters(tomes_id):
    tomes = Tome.query.filter_by(saga_id=tomes_id).all()
    return jsonify([t.to_dict() for t in tomes]), 200

@tomes_bp.put('/tomes/<cid>')
def update_tome(cid):
    tome = Tome.query.get_or_404(cid)
    name = (request.json or {}).get('name', '').strip()
    if not name:
        return {'error': 'Name required'}, 400
    tome.name = name
    db.session.commit()
    return tome.to_dict(), 200

@tomes_bp.delete('/tomes/<cid>')
def delete_tome(cid):
    tome = Tome.query.get_or_404(cid)
    db.session.delete(tome)
    db.session.commit()
    return '', 204