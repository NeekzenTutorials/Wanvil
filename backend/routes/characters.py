from flask import Blueprint, request, jsonify, abort
from sqlalchemy import and_, or_, func
from ..database import db
from ..models import Character, CharacterTemplate, Collection, Tag, CharacterTag

characters_bp = Blueprint("characters", __name__, url_prefix="/api")

# ---------- Helpers ---------------------------------------------------------

def _parse_iso_date(s: str):
    if not s:
        return None
    try:
        from datetime import date
        return date.fromisoformat(s)
    except Exception:
        return None

def _default_template():
    # Renvoyé si aucun template n'est encore enregistré
    return {
        "version": 1,
        "fields": [
            {"id": "firstname", "type": "text",     "label": "Prénom",     "builtin": True, "required": True},
            {"id": "lastname",  "type": "text",     "label": "Nom",        "builtin": True, "required": True},
            {"id": "age",       "type": "number",   "label": "Âge",        "builtin": True},
            {"id": "birthdate", "type": "date",     "label": "Naissance",  "builtin": True},
            {"id": "avatarUrl", "type": "text",     "label": "Photo (URL)","builtin": True},
            # champs custom libres
            {"id": "bio",       "type": "richtext", "label": "Biographie"},
        ]
    }

def _validate_template(payload):
    if not isinstance(payload, dict) or "fields" not in payload or not isinstance(payload["fields"], list):
        abort(400, description="Invalid template format: expected { fields: [...] }")
    # Validation minimale
    for f in payload["fields"]:
        if not isinstance(f, dict) or "id" not in f or "type" not in f or "label" not in f:
            abort(400, description="Each field must have id, type, label")

# ---------- Templates -------------------------------------------------------

@characters_bp.get("/collections/<collection_id>/characters/template")
def get_character_template(collection_id):
    Collection.query.get_or_404(collection_id)
    tpl = CharacterTemplate.query.filter_by(collection_id=collection_id).first()
    if tpl:
        return jsonify({"characterTemplate": tpl.character_template}), 200
    # pas d'écriture DB ici : on renvoie un défaut "virtuel"
    return jsonify({"characterTemplate": _default_template()}), 200

@characters_bp.put("/collections/<collection_id>/characters/template")
def put_character_template(collection_id):
    Collection.query.get_or_404(collection_id)
    body = request.get_json() or {}
    template = body.get("characterTemplate")
    _validate_template(template)

    tpl = CharacterTemplate.query.filter_by(collection_id=collection_id).first()
    if not tpl:
        tpl = CharacterTemplate(collection_id=collection_id, character_template=template)
        db.session.add(tpl)
    else:
        tpl.character_template = template
    db.session.commit()
    return jsonify(tpl.to_dict()), 200

# ---------- Tags ------------------------------------------------------------

@characters_bp.get("/collections/<collection_id>/tags")
def list_tags(collection_id):
    Collection.query.get_or_404(collection_id)
    scope = (request.args.get("scope") or "").strip()
    q = Tag.query.filter_by(collection_id=collection_id)
    if scope in ("character", "place", "item", "event"):
        q = q.filter(Tag.scope == scope)
    tags = q.order_by(Tag.name.asc()).all()
    return jsonify([t.to_dict() for t in tags]), 200

@characters_bp.post("/collections/<collection_id>/tags")
def create_tag(collection_id):
    Collection.query.get_or_404(collection_id)
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    color = (data.get("color") or "").strip() or None
    scope = (data.get("scope") or "").strip()
    if not name:
        return {"error": "name required"}, 400
    if scope not in ("character", "place", "item", "event"):
        return {"error": "scope 'character' or 'place' required"}, 400
    t = Tag(name=name, color=color, collection_id=collection_id, scope=scope)
    if "note" in data:
        t.note = (data["note"] or None)
    db.session.add(t)
    db.session.commit()
    return jsonify(t.to_dict()), 201

@characters_bp.put("/tags/<tag_id>")
def update_tag(tag_id):
    t = Tag.query.get_or_404(tag_id)
    data = request.get_json() or {}
    if "name" in data:
        n = (data["name"] or "").strip()
        if not n:
            return {"error": "name required"}, 400
        t.name = n
    if "color" in data:
        c = (data["color"] or "").strip() or None
        t.color = c
    if "note" in data:
        t.note = (data["note"] or None)
    if "scope" in data:
        s = (data["scope"] or "").strip()
        if s not in ("character", "place", "item", "event"):
            return {"error": "invalid scope"}, 400
        t.scope = s
    db.session.commit()
    return jsonify(t.to_dict()), 200

@characters_bp.delete("/tags/<tag_id>")
def delete_tag(tag_id):
    t = Tag.query.get_or_404(tag_id)
    # retire les associations
    CharacterTag.query.filter_by(tag_id=tag_id).delete()
    db.session.delete(t)
    db.session.commit()
    return "", 204

# ---------- Characters ------------------------------------------------------

@characters_bp.get("/collections/<collection_id>/characters")
def list_characters(collection_id):
    """Liste (cartes) avec filtres ?tags=...&query=...&match=all|any"""
    Collection.query.get_or_404(collection_id)
    q = Character.query.filter(Character.collection_id == collection_id)

    search = (request.args.get("query") or "").strip()
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Character.firstname.ilike(like), Character.lastname.ilike(like)))

    tag_ids = [t for t in (request.args.get("tags") or "").split(",") if t]
    match = (request.args.get("match") or "any").lower()  # any (OR) par défaut

    if tag_ids:
        if match == "all":
            # chaque tag doit être présent
            for tid in tag_ids:
                q = q.filter(Character.tags.any(Tag.id == tid))
        else:
            # au moins un tag (OR)
            q = q.filter(Character.tags.any(Tag.id.in_(tag_ids)))

    q = q.order_by(Character.lastname.asc(), Character.firstname.asc())

    # on renvoie un payload "carte"
    res = []
    for c in q.all():
        res.append({
            "id": c.id,
            "firstname": c.firstname,
            "lastname": c.lastname,
            "avatarUrl": c.avatar_url,
            "tags": [t.to_dict() for t in c.tags],
        })
    return jsonify(res), 200

@characters_bp.post("/collections/<collection_id>/characters")
def create_character(collection_id):
    Collection.query.get_or_404(collection_id)
    data = request.get_json() or {}

    firstname = (data.get("firstname") or "").strip()
    lastname  = (data.get("lastname") or "").strip()
    if not firstname or not lastname:
        return {"error": "firstname & lastname required"}, 400

    c = Character(
        firstname=firstname,
        lastname=lastname,
        age=data.get("age"),
        birthdate=_parse_iso_date(data.get("birthdate")),
        avatar_url=(data.get("avatarUrl") or "").strip() or None,
        content=data.get("content") or {},
        collection_id=collection_id,
    )
    db.session.add(c)

    # tags
    tag_ids = data.get("tagIds") or []
    if tag_ids:
        tags = Tag.query.filter(Tag.collection_id == collection_id, Tag.id.in_(tag_ids)).all()
        c.tags = tags

    db.session.commit()
    return jsonify(c.to_dict()), 201

@characters_bp.get("/characters/<character_id>")
def get_character(character_id):
    c = Character.query.get_or_404(character_id)
    return jsonify(c.to_dict()), 200

@characters_bp.put("/characters/<character_id>")
def update_character(character_id):
    c = Character.query.get_or_404(character_id)
    data = request.get_json() or {}

    if "firstname" in data:
        v = (data["firstname"] or "").strip()
        if not v:
            return {"error": "firstname required"}, 400
        c.firstname = v
    if "lastname" in data:
        v = (data["lastname"] or "").strip()
        if not v:
            return {"error": "lastname required"}, 400
        c.lastname = v

    if "age" in data:
        c.age = data["age"]
    if "birthdate" in data:
        c.birthdate = _parse_iso_date(data["birthdate"])
    if "avatarUrl" in data:
        c.avatar_url = (data["avatarUrl"] or "").strip() or None
    if "content" in data:
        c.content = data["content"] or {}

    # set complet des tags si fourni
    if "tagIds" in data and isinstance(data["tagIds"], list):
        # on sécurise par collection
        tags = Tag.query.filter(Tag.collection_id == c.collection_id,
                    Tag.scope == 'character',
                    Tag.id.in_(data["tagIds"])).all()
        c.tags = tags

    db.session.commit()
    return jsonify(c.to_dict()), 200

@characters_bp.put("/characters/<character_id>/tags")
def set_character_tags(character_id):
    c = Character.query.get_or_404(character_id)
    data = request.get_json() or {}
    tag_ids = data.get("tagIds")
    if not isinstance(tag_ids, list):
        return {"error": "tagIds list required"}, 400
    tags = Tag.query.filter(Tag.collection_id == c.collection_id,
                    Tag.scope == 'character',
                    Tag.id.in_(data["tagIds"])).all()
    c.tags = tags
    db.session.commit()
    return jsonify({"id": c.id, "tagIds": [t.id for t in c.tags]}), 200

@characters_bp.delete("/characters/<character_id>")
def delete_character(character_id):
    c = Character.query.get_or_404(character_id)
    db.session.delete(c)
    db.session.commit()
    return "", 204
