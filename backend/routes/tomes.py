from flask import Blueprint, request, jsonify, Response
from ..models import Saga, Tome, Chapter
from ..database import db
from markupsafe import escape
from sqlalchemy import asc


tomes_bp = Blueprint('tomes', __name__, url_prefix='/api')

@tomes_bp.post('/sagas/<saga_id>/tomes')
def create_tome(saga_id):
    name = (request.json or {}).get('name', '').strip()
    if not name:
        return {'error': 'Name required'}, 400
    sg = Saga.query.get_or_404(saga_id)
    t = Tome(name=name, saga=sg)
    db.session.add(t)
    db.session.commit()
    return t.to_dict(), 201

@tomes_bp.get('/tomes/<cid>')
def get_tome(cid):
    tome = Tome.query.get_or_404(cid)

    q = Chapter.query.filter_by(tome_id=cid)
    # si tu as un champ position, trie dessus, sinon created_at
    if hasattr(Chapter, 'position'):
        q = q.order_by(asc(Chapter.position), asc(Chapter.created_at))
    else:
        q = q.order_by(asc(Chapter.created_at))

    chapters = [{'id': c.id, 'title': c.title, 'position': getattr(c, 'position', None)} for c in q.all()]

    return jsonify({
        **tome.to_dict(),
        'chapters': chapters
    }), 200

@tomes_bp.put('/tomes/<cid>')
def update_tome(cid):
    tome = Tome.query.get_or_404(cid)
    name = (request.json or {}).get('name', '').strip()
    if not name:
        return {'error': 'Name required'}, 400
    tome.name = name
    db.session.commit()
    return tome.to_dict(), 200

@tomes_bp.delete('/tomes/<cid>')
def delete_tome(cid):
    tome = Tome.query.get_or_404(cid)
    db.session.delete(tome)
    db.session.commit()
    return '', 204

########################################################################################################
# Chapters routes

@tomes_bp.get('/tomes/<tome_id>/chapters')
def list_chapters_for_tome(tome_id):
    Tome.query.get_or_404(tome_id)  # vérifie l'existence du tome
    chapters = (Chapter.query
                .filter_by(tome_id=tome_id)
                .order_by(Chapter.created_at.asc())
                .all())
    # renvoyer une liste "légère" (sans le content) pour le sélecteur
    return jsonify([{'id': c.id, 'title': c.title} for c in chapters]), 200

@tomes_bp.post('/tomes/<tome_id>/chapters')
def create_chapter(tome_id):
    Tome.query.get_or_404(tome_id)
    data = request.get_json() or {}
    title = (data.get("title") or "Nouveau chapitre").strip()
    content = data.get("content") or ""

    last = Chapter.query.filter_by(tome_id=tome_id).order_by(Chapter.position.desc()).first()
    pos = (last.position + 1) if last else 1

    c = Chapter(title=title, content=content, tome_id=tome_id, position=pos)
    db.session.add(c)
    db.session.commit()
    return jsonify(c.to_dict()), 201

@tomes_bp.put('/chapters/<chapter_id>/move')
def move_chapter(chapter_id):
    c = Chapter.query.get_or_404(chapter_id)
    payload = request.get_json() or {}
    to_pos = payload.get('toPosition')
    if not isinstance(to_pos, int):
        return {'error': 'toPosition (int) required'}, 400

    # bornes
    siblings_q = Chapter.query.filter_by(tome_id=c.tome_id)
    max_pos = siblings_q.count()
    to_pos = max(1, min(to_pos, max_pos))
    from_pos = c.position

    if to_pos == from_pos:
        ordered = siblings_q.order_by(Chapter.position.asc(), Chapter.created_at.asc()).all()
        return jsonify([{'id': ch.id, 'title': ch.title, 'position': ch.position} for ch in ordered]), 200

    # déplacer et décaler les autres
    if to_pos > from_pos:
        (Chapter.query
         .filter(Chapter.tome_id == c.tome_id,
                 Chapter.position > from_pos,
                 Chapter.position <= to_pos)
         .update({Chapter.position: Chapter.position - 1}, synchronize_session=False))
    else:
        (Chapter.query
         .filter(Chapter.tome_id == c.tome_id,
                 Chapter.position >= to_pos,
                 Chapter.position < from_pos)
         .update({Chapter.position: Chapter.position + 1}, synchronize_session=False))

    c.position = to_pos
    db.session.commit()

    # renvoyer la liste ordonnée mise à jour (pratique pour le front)
    ordered = siblings_q.order_by(Chapter.position.asc(), Chapter.created_at.asc()).all()
    return jsonify([{'id': ch.id, 'title': ch.title, 'position': ch.position} for ch in ordered]), 200

@tomes_bp.get('/chapters/<chapter_id>')
def get_chapter(chapter_id):
    c = Chapter.query.get_or_404(chapter_id)
    return jsonify(c.to_dict()), 200

@tomes_bp.put('/chapters/<chapter_id>')
def update_chapter(chapter_id):
    c = Chapter.query.get_or_404(chapter_id)
    payload = request.get_json() or {}
    if 'title' in payload:
        c.title = (payload['title'] or '').strip()
        if not c.title:
            return {'error': 'Title required'}, 400
    if 'content' in payload:
        c.content = payload['content'] or ''
    db.session.commit()
    return jsonify(c.to_dict()), 200

@tomes_bp.delete('/chapters/<chapter_id>')
def delete_chapter(chapter_id):
    c = Chapter.query.get_or_404(chapter_id)
    db.session.delete(c)
    db.session.commit()
    return '', 204

def _cleanup_html(html: str) -> str:
    """Retire les marqueurs internes (liens d'app, data-*) pour un export propre."""
    try:
        from bs4 import BeautifulSoup  # pip install beautifulsoup4 (facultatif)
        soup = BeautifulSoup(html or "", "html.parser")
        # unwrap des liens internes
        for a in soup.find_all("a", attrs={"data-app-link": True}):
            a.unwrap()
        # retire quelques data-* (adapte si besoin)
        for el in soup.find_all(attrs={"data-entity": True}):
            del el["data-entity"]
        return str(soup)
    except Exception:
        return html or ""

def _build_tome_html(tome: Tome, chapters: list[Chapter]) -> str:
    title = f"{tome.name}"
    toc_items, content_items = [], []
    for i, ch in enumerate(chapters, start=1):
        anchor = f"ch-{i}"
        toc_items.append(f'<li><a href="#{anchor}">{escape(ch.title)}</a></li>')
        content_items.append(f"""
          <section class="chapter{' first' if i == 1 else ''}">
            <h1 id="{anchor}">{escape(ch.title)}</h1>
            <div class="chapter-content">
              {_cleanup_html(ch.content)}
            </div>
          </section>
        """)

    return f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>{escape(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  @page {{ margin: 20mm; }}
  body {{
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    line-height: 1.6; color: #111;
  }}
  .container {{ max-width: 800px; margin: 0 auto; padding: 24px; }}
  header h1 {{ font-size: 2rem; margin: 0 0 8px; }}
  .toc {{ margin: 16px 0 32px; }}
  .toc h2 {{ font-size: 1.1rem; margin: 0 0 8px; }}
  .toc ul {{ margin: 0; padding-left: 20px; }}
  .chapter h1 {{ font-size: 1.6rem; margin: 24px 0 12px; }}
  .chapter:not(.first) {{ page-break-before: always; }}
  .chapter-content img {{ max-width: 100%; height: auto; }}
</style>
</head>
<body>
  <div class="container">
    <header><h1>{escape(title)}</h1></header>
    <nav class="toc">
      <h2>Sommaire</h2>
      <ul>{''.join(toc_items)}</ul>
    </nav>
    {''.join(content_items)}
  </div>
</body>
</html>"""

@tomes_bp.get('/tomes/<tome_id>/export/pdf')
def export_tome_pdf(tome_id):
    tome = Tome.query.get_or_404(tome_id)

    q = Chapter.query.filter_by(tome_id=tome.id)
    if hasattr(Chapter, 'position'):
        q = q.order_by(Chapter.position.asc(), Chapter.created_at.asc())
    else:
        q = q.order_by(Chapter.created_at.asc())
    chapters = q.all()

    html = _build_tome_html(tome, chapters)

    # --- WeasyPrint (recommandé) ---
    try:
        from weasyprint import HTML  # pip install weasyprint (lib Cairo/Pango requises)
        pdf_bytes = HTML(string=html, base_url=request.url_root).write_pdf()
        headers = {"Content-Disposition": f'attachment; filename="{tome.name or "tome"}.pdf"'}
        return Response(pdf_bytes, mimetype="application/pdf", headers=headers)
    except Exception as e:
        # --- Fallback wkhtmltopdf (si installé) ---
        try:
            import pdfkit  # pip install pdfkit  (+ wkhtmltopdf côté OS)
            pdf_bytes = pdfkit.from_string(html, False, options={"enable-local-file-access": ""})
            headers = {"Content-Disposition": f'attachment; filename="{tome.name or "tome"}.pdf"'}
            return Response(pdf_bytes, mimetype="application/pdf", headers=headers)
        except Exception as e2:
            return {"error": "PDF export failed", "weasyprint": str(e), "wkhtmltopdf": str(e2)}, 500