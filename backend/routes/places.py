# api/places.py
from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from ..database import db
from ..models import Collection, Place, Tag, PlaceTag

places_bp = Blueprint("places", __name__, url_prefix="/api")

# ---------- List (cartes) ---------------------------------------------------
@places_bp.get("/collections/<collection_id>/places")
def list_places(collection_id):
    Collection.query.get_or_404(collection_id)
    q = Place.query.filter(Place.collection_id == collection_id)

    search = (request.args.get("query") or "").strip()
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Place.name.ilike(like), Place.location.ilike(like)))

    tag_ids = [t for t in (request.args.get("tags") or "").split(",") if t]
    match = (request.args.get("match") or "any").lower()

    if tag_ids:
        if match == "all":
            for tid in tag_ids:
                q = q.filter(Place.tags.any(Tag.id == tid))
        else:
            q = q.filter(Place.tags.any(Tag.id.in_(tag_ids)))

    q = q.order_by(Place.name.asc())

    res = []
    for p in q.all():
        cover = (p.images or [None])[0]
        res.append({
            "id": p.id,
            "name": p.name,
            "location": p.location,
            "coverUrl": cover,
            "tags": [t.to_dict() for t in p.tags],
        })
    return jsonify(res), 200

# ---------- Create ----------------------------------------------------------
@places_bp.post("/collections/<collection_id>/places")
def create_place(collection_id):
    Collection.query.get_or_404(collection_id)
    data = request.get_json() or {}

    name = (data.get("name") or "").strip()
    if not name:
        return {"error": "name required"}, 400

    p = Place(
        name=name,
        location=(data.get("location") or "").strip() or None,
        description=data.get("description") or None,
        images=data.get("images") or [],
        content=data.get("content") or {},
        collection_id=collection_id,
    )
    db.session.add(p)

    tag_ids = data.get("tagIds") or []
    if tag_ids:
        tags = Tag.query.filter(Tag.collection_id == collection_id, Tag.id.in_(tag_ids)).all()
        p.tags = tags

    db.session.commit()
    return jsonify(p.to_dict()), 201

# ---------- Read ------------------------------------------------------------
@places_bp.get("/places/<place_id>")
def get_place(place_id):
    p = Place.query.get_or_404(place_id)
    return jsonify(p.to_dict()), 200

# ---------- Update ----------------------------------------------------------
@places_bp.put("/places/<place_id>")
def update_place(place_id):
    p = Place.query.get_or_404(place_id)
    data = request.get_json() or {}

    if "name" in data:
        v = (data["name"] or "").strip()
        if not v:
            return {"error": "name required"}, 400
        p.name = v
    if "location" in data:
        p.location = (data["location"] or "").strip() or None
    if "description" in data:
        p.description = data["description"] or None
    if "images" in data:
        imgs = data["images"] or []
        if not isinstance(imgs, list):
            return {"error": "images must be list"}, 400
        p.images = imgs
    if "content" in data:
        p.content = data["content"] or {}

    if "tagIds" in data and isinstance(data["tagIds"], list):
        tags = Tag.query.filter(Tag.collection_id == p.collection_id,
                Tag.scope == 'place',
                Tag.id.in_(data["tagIds"]))
        p.tags = tags.all()

    db.session.commit()
    return jsonify(p.to_dict()), 200

# ---------- Set tags only ---------------------------------------------------
@places_bp.put("/places/<place_id>/tags")
def set_place_tags(place_id):
    p = Place.query.get_or_404(place_id)
    data = request.get_json() or {}
    tag_ids = data.get("tagIds")
    if not isinstance(tag_ids, list):
        return {"error": "tagIds list required"}, 400
    tags = Tag.query.filter(Tag.collection_id == p.collection_id,
                Tag.scope == 'place',
                Tag.id.in_(data["tagIds"]))
    p.tags = tags
    db.session.commit()
    return jsonify({"id": p.id, "tagIds": [t.id for t in p.tags]}), 200

# ---------- Delete ----------------------------------------------------------
@places_bp.delete("/places/<place_id>")
def delete_place(place_id):
    p = Place.query.get_or_404(place_id)
    db.session.delete(p)
    db.session.commit()
    return "", 204