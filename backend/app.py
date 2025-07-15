from flask import Flask, request, jsonify
from flask_cors import CORS
from .database import db
from .models import Project
from .routes.registerRoutes import register_routes


def create_app(test_config=None):
    app = Flask(__name__, static_folder=None)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wanvil.sqlite'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    

    with app.app_context():
        db.create_all()

    CORS(app)

    register_routes(app)

    return app