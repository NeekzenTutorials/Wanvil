from flask import Blueprint, request, jsonify, abort
from sqlalchemy import or_
from ..database import db
from ..models import Item, Collection, Tag

items_bp = Blueprint("items", __name__, url_prefix="/api")

# ----------- LISTE (cartes) -------------------------------------------------
@items_bp.get("/collections/<collection_id>/items")
def list_items(collection_id):
    Collection.query.get_or_404(collection_id)
    q = Item.query.filter(Item.collection_id == collection_id)

    search = (request.args.get("query") or "").strip()
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Item.name.ilike(like), Item.description.ilike(like)))

    tag_ids = [t for t in (request.args.get("tags") or "").split(",") if t]
    match = (request.args.get("match") or "any").lower()

    if tag_ids:
        if match == "all":
            for tid in tag_ids:
                q = q.filter(Item.tags.any(Tag.id == tid))
        else:
            q = q.filter(Item.tags.any(Tag.id.in_(tag_ids)))

    q = q.order_by(Item.name.asc())

    res = []
    for it in q.all():
        res.append({
            "id": it.id,
            "name": it.name,
            "coverUrl": (it.images or [None])[0],
            "tags": [t.to_dict() for t in it.tags],
        })
    return jsonify(res), 200

# ----------- CREATE ---------------------------------------------------------
@items_bp.post("/collections/<collection_id>/items")
def create_item(collection_id):
    Collection.query.get_or_404(collection_id)
    data = request.get_json() or {}
    name = (data.get("name") or "").strip() or "Nouvel objet"

    it = Item(
        name=name,
        description=data.get("description") or "",
        images=data.get("images") or [],
        content=data.get("content") or {},
        collection_id=collection_id,
    )
    db.session.add(it)

    tag_ids = data.get("tagIds") or []
    if tag_ids:
        tags = Tag.query.filter(
            Tag.collection_id == collection_id,
            Tag.scope == "item",
            Tag.id.in_(tag_ids)
        ).all()
        it.tags = tags

    db.session.commit()
    return jsonify(it.to_dict()), 201

# ----------- READ -----------------------------------------------------------
@items_bp.get("/items/<item_id>")
def get_item(item_id):
    it = Item.query.get_or_404(item_id)
    return jsonify(it.to_dict()), 200

# ----------- UPDATE ---------------------------------------------------------
@items_bp.put("/items/<item_id>")
def update_item(item_id):
    it = Item.query.get_or_404(item_id)
    data = request.get_json() or {}

    if "name" in data:
        v = (data["name"] or "").strip()
        if not v:
            return {"error": "name required"}, 400
        it.name = v
    if "description" in data:
        it.description = data["description"] or ""
    if "images" in data:
        it.images = data["images"] or []
    if "content" in data:
        it.content = data["content"] or {}

    if "tagIds" in data and isinstance(data["tagIds"], list):
        tags = Tag.query.filter(
            Tag.collection_id == it.collection_id,
            Tag.scope == "item",
            Tag.id.in_(data["tagIds"])
        ).all()
        it.tags = tags

    db.session.commit()
    return jsonify(it.to_dict()), 200

# ----------- SET TAGS -------------------------------------------------------
@items_bp.put("/items/<item_id>/tags")
def set_item_tags(item_id):
    it = Item.query.get_or_404(item_id)
    data = request.get_json() or {}
    tag_ids = data.get("tagIds")
    if not isinstance(tag_ids, list):
        return {"error": "tagIds list required"}, 400
    tags = Tag.query.filter(
        Tag.collection_id == it.collection_id,
        Tag.scope == "item",
        Tag.id.in_(tag_ids)
    ).all()
    it.tags = tags
    db.session.commit()
    return jsonify({"id": it.id, "tagIds": [t.id for t in it.tags]}), 200

# ----------- DELETE ---------------------------------------------------------
@items_bp.delete("/items/<item_id>")
def delete_item(item_id):
    it = Item.query.get_or_404(item_id)
    db.session.delete(it)
    db.session.commit()
    return "", 204
