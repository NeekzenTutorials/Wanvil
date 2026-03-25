from flask import Flask, request
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
                "http://10.1.106.20:5006",
            ],
            "supports_credentials": True,
        }
    })

    @app.before_request
    def log_request():
        print("REQUEST:", request.method, request.path)

    @app.get("/ping")
    def ping():
        return {"ok": True}, 200

    db.init_app(app)
    Migrate(app, db)

    register_routes(app)

    return app