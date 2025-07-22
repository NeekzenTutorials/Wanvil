from flask import Flask
from flask_cors import CORS
from .database import db
from .routes.registerRoutes import register_routes
from flask_migrate import Migrate


def create_app(test_config=None):
    app = Flask(__name__, static_folder=None)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wanvil.sqlite'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    migrate = Migrate(app, db)

    CORS(app)

    register_routes(app)

    return app