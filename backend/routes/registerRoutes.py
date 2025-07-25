from flask import Flask
from .projects import projects_bp
from .hierarchy import hierarchy_bp
from .sagas import sagas_bp
from .tomes import tomes_bp
from .collections import collections_bp

def register_routes(app: Flask):
    """Attach all Blueprint routes to the Flask app"""
    app.register_blueprint(projects_bp)
    app.register_blueprint(hierarchy_bp)
    app.register_blueprint(sagas_bp)
    app.register_blueprint(tomes_bp)
    app.register_blueprint(collections_bp)