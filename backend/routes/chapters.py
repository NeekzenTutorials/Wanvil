# backend/routes/chapters_extra.py (ex.)
from flask import Blueprint, jsonify
from ..models import Chapter, Tome, Saga, Collection

chapters_extra_bp = Blueprint("chapters_extra", __name__, url_prefix="/api")

@chapters_extra_bp.get("/chapters/<chapter_id>/collection")
def chapter_collection(chapter_id):
    ch = Chapter.query.get_or_404(chapter_id)
    # récupérer la collection en remontant les FK
    tome = Tome.query.get(ch.tome_id)
    saga = tome and tome.saga
    coll = saga and saga.collection
    if not coll:
      return {"error": "collection not found"}, 404
    return jsonify({ "collectionId": coll.id }), 200
