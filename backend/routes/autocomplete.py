# backend/routes/autocomplete.py
from flask import Blueprint, jsonify, request
from sqlalchemy import or_
from ..models import Collection, Character, Place, Item
from ..database import db

autocomplete_bp = Blueprint("autocomplete", __name__, url_prefix="/api")

def _like(s: str) -> str:
    return f"%{s}%"

@autocomplete_bp.get("/collections/<collection_id>/autocomplete")
def autocomplete(collection_id):
    Collection.query.get_or_404(collection_id)
    q = (request.args.get("q") or "").strip()
    if len(q) < 3:
        return jsonify([]), 200

    limit = min(int(request.args.get("limit", 10)), 50)

    # Characters
    chars = (
        db.session.query(Character)
        .filter(Character.collection_id == collection_id)
        .filter(or_(Character.firstname.ilike(_like(q)), Character.lastname.ilike(_like(q))))
        .order_by(Character.lastname.asc(), Character.firstname.asc())
        .limit(limit)
        .all()
    )
    char_rows = [{
        "id": c.id,
        "type": "character",
        "label": f"{c.firstname} {c.lastname}".strip(),
        "hint": None
    } for c in chars]

    # Places
    places = (
        db.session.query(Place)
        .filter(Place.collection_id == collection_id)
        .filter(or_(Place.name.ilike(_like(q)), Place.location.ilike(_like(q))))
        .order_by(Place.name.asc())
        .limit(limit)
        .all()
    )
    place_rows = [{
        "id": p.id,
        "type": "place",
        "label": p.name,
        "hint": p.location
    } for p in places]

    # Items
    items = (
        db.session.query(Item)
        .filter(Item.collection_id == collection_id)
        .filter(or_(Item.name.ilike(_like(q)), Item.category.ilike(_like(q))))
        .order_by(Item.name.asc())
        .limit(limit)
        .all()
    )
    item_rows = [{
        "id": it.id,
        "type": "item",
        "label": it.name,
        "hint": it.category
    } for it in items]

    # Fusion simple + tri par label
    rows = char_rows + place_rows + item_rows
    rows.sort(key=lambda r: r["label"].lower())

    # coupe au total si nécessaire
    return jsonify(rows[:limit]), 200
