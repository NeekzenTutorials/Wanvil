from flask import Flask
from .projects import projects_bp

def register_routes(app: Flask):
    """Attach all Blueprint routes to the Flask app"""
    app.register_blueprint(projects_bp)