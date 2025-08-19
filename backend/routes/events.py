# backend/routes/events.py
from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from datetime import date  # <-- import
from ..database import db
from ..models import Collection, Event, Tag

events_bp = Blueprint("events", __name__, url_prefix="/api")

def _like(s: str) -> str:
    return f"%{s}%"

def _parse_date(val):
    """
    Accepte:
      - None -> None
      - datetime.date -> as-is
      - 'YYYY-MM-DD' (ou ISO avec heure: on coupe aux 10 premiers)
    Lève ValueError si invalide.
    """
    if not val:
        return None
    if isinstance(val, date):
        return val
    s = str(val)
    # Supporte 'YYYY-MM-DD' et 'YYYY-MM-DDTHH:MM:SSZ' en gardant le prefixe
    if len(s) >= 10 and s[4] == '-' and s[7] == '-':
        s = s[:10]
    try:
        return date.fromisoformat(s)
    except Exception:
        raise ValueError("Invalid date, expected YYYY-MM-DD")

# LIST
@events_bp.get("/collections/<collection_id>/events")
def list_events(collection_id):
    Collection.query.get_or_404(collection_id)
    q = Event.query.filter(Event.collection_id == collection_id)

    search = (request.args.get("query") or "").strip()
    if search:
        q = q.filter(or_(Event.name.ilike(_like(search)),
                         Event.description.ilike(_like(search))))

    # filtres de chevauchement
    date_from_raw = request.args.get("from")
    date_to_raw   = request.args.get("to")

    try:
        date_from = _parse_date(date_from_raw)
        date_to   = _parse_date(date_to_raw)
    except ValueError as e:
        return {"error": str(e)}, 400

    if date_from:
        q = q.filter(or_(Event.end_date == None, Event.end_date >= date_from))
    if date_to:
        q = q.filter(Event.start_date <= date_to)

    # tags
    tag_ids = [t for t in (request.args.get("tags") or "").split(",") if t]
    match = (request.args.get("match") or "any").lower()
    if tag_ids:
        if match == "all":
            for tid in tag_ids:
                q = q.filter(Event.tags.any(Tag.id == tid))
        else:
            q = q.filter(Event.tags.any(Tag.id.in_(tag_ids)))

    q = q.order_by(Event.start_date.asc(), Event.name.asc())

    res = [{
        "id": ev.id,
        "name": ev.name,
        "startDate": ev.start_date.isoformat(),
        "endDate": ev.end_date.isoformat() if ev.end_date else None,
        "coverUrl": (ev.images or [None])[0],
        "tags": [t.to_dict() for t in ev.tags],
    } for ev in q.all()]

    return jsonify(res), 200

# CREATE
@events_bp.post("/collections/<collection_id>/events")
def create_event(collection_id):
    Collection.query.get_or_404(collection_id)
    data = request.get_json() or {}

    name = (data.get("name") or "").strip()
    try:
        start_date = _parse_date(data.get("startDate"))
        end_date = _parse_date(data.get("endDate"))
    except ValueError as e:
        return {"error": str(e)}, 400

    if not name or not start_date:
        return {"error": "name and startDate are required"}, 400

    ev = Event(
        name=name,
        start_date=start_date,
        end_date=end_date,
        description=data.get("description") or "",
        images=data.get("images") or [],
        content=data.get("content") or {},
        collection_id=collection_id,
    )
    db.session.add(ev)

    tag_ids = data.get("tagIds") or []
    if tag_ids:
        tags = Tag.query.filter(
            Tag.collection_id == collection_id,
            Tag.scope == "event",
            Tag.id.in_(tag_ids)
        ).all()
        ev.tags = tags

    db.session.commit()
    return jsonify(ev.to_dict()), 201

# READ
@events_bp.get("/events/<event_id>")
def get_event(event_id):
    ev = Event.query.get_or_404(event_id)
    return jsonify(ev.to_dict()), 200

# UPDATE
@events_bp.put("/events/<event_id>")
def update_event(event_id):
    ev = Event.query.get_or_404(event_id)
    data = request.get_json() or {}

    if "name" in data:
        v = (data["name"] or "").strip()
        if not v:
            return {"error": "name required"}, 400
        ev.name = v

    if "startDate" in data:
        try:
            sd = _parse_date(data["startDate"])
        except ValueError as e:
            return {"error": str(e)}, 400
        if not sd:
            return {"error": "startDate required"}, 400
        ev.start_date = sd

    if "endDate" in data:
        try:
            ev.end_date = _parse_date(data["endDate"])
        except ValueError as e:
            return {"error": str(e)}, 400

    if "description" in data:
        ev.description = data["description"] or ""
    if "images" in data:
        ev.images = data["images"] or []
    if "content" in data:
        ev.content = data["content"] or {}

    if "tagIds" in data and isinstance(data["tagIds"], list):
        tags = Tag.query.filter(
            Tag.collection_id == ev.collection_id,
            Tag.scope == "event",
            Tag.id.in_(data["tagIds"])
        ).all()
        ev.tags = tags

    db.session.commit()
    return jsonify(ev.to_dict()), 200

# SET TAGS
@events_bp.put("/events/<event_id>/tags")
def set_event_tags(event_id):
    ev = Event.query.get_or_404(event_id)
    data = request.get_json() or {}
    tag_ids = data.get("tagIds")
    if not isinstance(tag_ids, list):
        return {"error": "tagIds list required"}, 400
    tags = Tag.query.filter(
        Tag.collection_id == ev.collection_id,
        Tag.scope == "event",
        Tag.id.in_(tag_ids)
    ).all()
    ev.tags = tags
    db.session.commit()
    return jsonify({"id": ev.id, "tagIds": [t.id for t in ev.tags]}), 200

# DELETE
@events_bp.delete("/events/<event_id>")
def delete_event(event_id):
    ev = Event.query.get_or_404(event_id)
    db.session.delete(ev)
    db.session.commit()
    return "", 204
