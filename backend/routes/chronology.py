from flask import Blueprint, request, jsonify

from ..database import db
from ..models import Collection, CollectionTimeline

chronology_bp = Blueprint('chronology', __name__, url_prefix='/api')


def _default_timeline_payload():
    return {
        "version": 1,
        "items": [],
        "options": {
            "title": "",
            "description": "",
        },
    }


@chronology_bp.get('/collections/<collection_id>/timeline')
def get_collection_timeline(collection_id):
    Collection.query.get_or_404(collection_id)

    tl = CollectionTimeline.query.filter_by(collection_id=collection_id).first()
    if not tl:
        return jsonify({
            "collectionId": collection_id,
            "data": _default_timeline_payload(),
        }), 200

    payload = tl.to_dict()
    if not payload.get('data'):
        payload['data'] = _default_timeline_payload()
    return jsonify(payload), 200


@chronology_bp.put('/collections/<collection_id>/timeline')
def put_collection_timeline(collection_id):
    Collection.query.get_or_404(collection_id)

    body = request.get_json() or {}
    data = body.get('data', body)
    if not isinstance(data, dict):
        return {"error": "timeline data must be an object"}, 400

    tl = CollectionTimeline.query.filter_by(collection_id=collection_id).first()
    if not tl:
        tl = CollectionTimeline(collection_id=collection_id, data=data)
        db.session.add(tl)
    else:
        tl.data = data

    db.session.commit()
    return jsonify(tl.to_dict()), 200
