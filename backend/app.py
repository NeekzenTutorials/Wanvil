from flask import Flask
from flask_cors import CORS
from .database import db
from .routes.registerRoutes import register_routes
from flask_migrate import Migrate


def create_app(test_config=None):
    app = Flask(__name__, static_folder=None)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wanvil.sqlite'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5006",
            "http://127.0.0.1:5006",
            "http://10.1.106.16:5006",  # IP de ton PC vue par le téléphone
        ],
        "supports_credentials": True,
    }
})

    db.init_app(app)
    migrate = Migrate(app, db)

    register_routes(app)

    return app