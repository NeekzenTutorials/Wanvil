from flask import Blueprint, request, jsonify
from ..database import db
from ..models import (
    TicketBoard, TicketColumn, Ticket, TicketTag,
    TicketChecklistItem, TicketAssignee, ProjectMember,
)

tickets_bp = Blueprint('tickets', __name__, url_prefix='/api/projects/<project_id>/board')

# ─── Helpers ───

DEFAULT_COLUMNS = [
    {'name': 'À faire', 'color': '#6366f1', 'position': 0},
    {'name': 'En cours', 'color': '#f59e0b', 'position': 1},
    {'name': 'Terminé', 'color': '#10b981', 'position': 2},
]


def _get_or_create_board(project_id):
    board = TicketBoard.query.filter_by(project_id=project_id).first()
    if not board:
        board = TicketBoard(project_id=project_id)
        db.session.add(board)
        db.session.flush()
        for col_def in DEFAULT_COLUMNS:
            col = TicketColumn(board_id=board.id, **col_def)
            db.session.add(col)
        db.session.commit()
    return board


# ─── Board ───

@tickets_bp.route('', methods=['GET'])
def get_board(project_id):
    board = _get_or_create_board(project_id)
    return jsonify(board.to_dict()), 200


# ─── Columns ───

@tickets_bp.route('/columns', methods=['POST'])
def add_column(project_id):
    board = _get_or_create_board(project_id)
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Column name is required'}), 400
    max_pos = db.session.query(db.func.coalesce(db.func.max(TicketColumn.position), -1)).filter_by(board_id=board.id).scalar()
    col = TicketColumn(
        board_id=board.id,
        name=name,
        color=data.get('color', '#6366f1'),
        position=max_pos + 1,
    )
    db.session.add(col)
    db.session.commit()
    return jsonify(col.to_dict()), 201


@tickets_bp.route('/columns/<col_id>', methods=['PUT'])
def update_column(project_id, col_id):
    col = TicketColumn.query.get_or_404(col_id)
    data = request.get_json() or {}
    if 'name' in data:
        col.name = data['name'].strip()
    if 'color' in data:
        col.color = data['color']
    if 'position' in data:
        col.position = int(data['position'])
    db.session.commit()
    return jsonify(col.to_dict()), 200


@tickets_bp.route('/columns/<col_id>', methods=['DELETE'])
def delete_column(project_id, col_id):
    col = TicketColumn.query.get_or_404(col_id)
    db.session.delete(col)
    db.session.commit()
    return '', 204


@tickets_bp.route('/columns/reorder', methods=['PUT'])
def reorder_columns(project_id):
    """Expects { order: [col_id, col_id, ...] }"""
    board = _get_or_create_board(project_id)
    data = request.get_json() or {}
    order = data.get('order', [])
    cols = {c.id: c for c in TicketColumn.query.filter_by(board_id=board.id).all()}
    for i, cid in enumerate(order):
        if cid in cols:
            cols[cid].position = i
    db.session.commit()
    return jsonify(board.to_dict()), 200


# ─── Tickets ───

@tickets_bp.route('/columns/<col_id>/tickets', methods=['POST'])
def create_ticket(project_id, col_id):
    col = TicketColumn.query.get_or_404(col_id)
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'error': 'Ticket title is required'}), 400
    max_pos = db.session.query(db.func.coalesce(db.func.max(Ticket.position), -1)).filter_by(column_id=col_id).scalar()
    ticket = Ticket(
        column_id=col_id,
        title=title,
        description=data.get('description', ''),
        priority=data.get('priority', 'medium'),
        position=max_pos + 1,
    )
    db.session.add(ticket)
    db.session.flush()

    # Tags
    for tag_data in data.get('tags', []):
        tag = TicketTag(ticket_id=ticket.id, name=tag_data.get('name', ''), color=tag_data.get('color', '#6366f1'))
        db.session.add(tag)

    # Checklist
    for i, item_data in enumerate(data.get('checklist', [])):
        ci = TicketChecklistItem(ticket_id=ticket.id, text=item_data.get('text', ''), position=i)
        db.session.add(ci)

    # Assignees
    for mid in data.get('assigneeIds', []):
        member = ProjectMember.query.filter_by(id=mid, project_id=project_id).first()
        if member:
            db.session.add(TicketAssignee(ticket_id=ticket.id, member_id=mid))

    db.session.commit()
    return jsonify(ticket.to_dict()), 201


@tickets_bp.route('/tickets/<ticket_id>', methods=['GET'])
def get_ticket(project_id, ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    return jsonify(ticket.to_dict()), 200


@tickets_bp.route('/tickets/<ticket_id>', methods=['PUT'])
def update_ticket(project_id, ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    data = request.get_json() or {}

    if 'title' in data:
        ticket.title = data['title'].strip()
    if 'description' in data:
        ticket.description = data['description']
    if 'priority' in data:
        ticket.priority = data['priority']
    if 'columnId' in data:
        ticket.column_id = data['columnId']
    if 'position' in data:
        ticket.position = int(data['position'])

    # Replace tags  
    if 'tags' in data:
        TicketTag.query.filter_by(ticket_id=ticket.id).delete()
        for tag_data in data['tags']:
            db.session.add(TicketTag(ticket_id=ticket.id, name=tag_data.get('name', ''), color=tag_data.get('color', '#6366f1')))

    # Replace checklist
    if 'checklist' in data:
        TicketChecklistItem.query.filter_by(ticket_id=ticket.id).delete()
        for i, item_data in enumerate(data['checklist']):
            db.session.add(TicketChecklistItem(
                ticket_id=ticket.id,
                text=item_data.get('text', ''),
                done=item_data.get('done', False),
                position=i,
            ))

    # Replace assignees
    if 'assigneeIds' in data:
        TicketAssignee.query.filter_by(ticket_id=ticket.id).delete()
        for mid in data['assigneeIds']:
            member = ProjectMember.query.filter_by(id=mid, project_id=project_id).first()
            if member:
                db.session.add(TicketAssignee(ticket_id=ticket.id, member_id=mid))

    db.session.commit()
    return jsonify(ticket.to_dict()), 200


@tickets_bp.route('/tickets/<ticket_id>', methods=['DELETE'])
def delete_ticket(project_id, ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    db.session.delete(ticket)
    db.session.commit()
    return '', 204


@tickets_bp.route('/tickets/<ticket_id>/move', methods=['PUT'])
def move_ticket(project_id, ticket_id):
    """Move ticket to a different column and/or position. { columnId, position }"""
    ticket = Ticket.query.get_or_404(ticket_id)
    data = request.get_json() or {}
    new_col_id = data.get('columnId', ticket.column_id)
    new_pos = data.get('position', ticket.position)

    # Shift positions in target column
    if new_col_id != ticket.column_id:
        # Remove from old column: shift down
        Ticket.query.filter(
            Ticket.column_id == ticket.column_id,
            Ticket.position > ticket.position
        ).update({Ticket.position: Ticket.position - 1})
        # Insert into new column: shift up
        Ticket.query.filter(
            Ticket.column_id == new_col_id,
            Ticket.position >= new_pos
        ).update({Ticket.position: Ticket.position + 1})
        ticket.column_id = new_col_id
        ticket.position = new_pos
    else:
        old_pos = ticket.position
        if new_pos > old_pos:
            Ticket.query.filter(
                Ticket.column_id == ticket.column_id,
                Ticket.id != ticket.id,
                Ticket.position > old_pos,
                Ticket.position <= new_pos
            ).update({Ticket.position: Ticket.position - 1})
        elif new_pos < old_pos:
            Ticket.query.filter(
                Ticket.column_id == ticket.column_id,
                Ticket.id != ticket.id,
                Ticket.position >= new_pos,
                Ticket.position < old_pos
            ).update({Ticket.position: Ticket.position + 1})
        ticket.position = new_pos

    db.session.commit()
    return jsonify(ticket.to_dict()), 200
