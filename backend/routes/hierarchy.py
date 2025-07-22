from flask import Blueprint, jsonify, abort
from ..models import Project
from ..database import db

hierarchy_bp = Blueprint("hierarchy", __name__, url_prefix="/api/projects")

@hierarchy_bp.route("/<project_id>/tree", methods=["GET"])
def get_project_tree(project_id):
    """Return collections ▸ sagas ▸ tomes as a nested tree."""
    project = Project.query.get_or_404(project_id)

    def tome_to_dict(t):
        return {"id": t.id, "title": t.name, "level": "tome", "children": []}

    def saga_to_dict(s):
        return {
            "id": s.id,
            "title": s.name,
            "level": "saga",
            "children": [tome_to_dict(t) for t in sorted(s.tomes, key=lambda t: t.created_at)],
        }

    def collection_to_dict(c):
        return {
            "id": c.id,
            "title": c.name,
            "level": "collection",
            "children": [saga_to_dict(s) for s in sorted(c.sagas, key=lambda s: s.created_at)],
        }

    tree = [collection_to_dict(c) for c in sorted(project.collections, key=lambda c: c.created_at)]
    return jsonify(tree), 200