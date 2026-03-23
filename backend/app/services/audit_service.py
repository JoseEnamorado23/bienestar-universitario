from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from typing import Optional, List
from datetime import datetime
from app.models.audit import AuditLog
from app.models.user import User


class AuditService:
    """Service to log and query audit events."""

    @staticmethod
    def log_action(
        db: Session,
        action: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        details: Optional[dict] = None,
    ) -> AuditLog:
        """Record an audit event. Silently fails to avoid breaking main operations."""
        try:
            log = AuditLog(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                ip_address=ip_address,
                details=details,
            )
            db.add(log)
            db.commit()
            db.refresh(log)
            return log
        except Exception:
            db.rollback()
            return None

    @staticmethod
    def get_audit_logs(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> dict:
        """Retrieve audit logs with filters and pagination."""
        query = db.query(AuditLog).outerjoin(User, AuditLog.user_id == User.id)

        if user_id:
            query = query.filter(AuditLog.user_id == user_id)

        if action:
            query = query.filter(AuditLog.action == action)

        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)

        if search:
            search_like = f"%{search}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_like),
                    User.last_name.ilike(search_like),
                    User.email.ilike(search_like),
                    AuditLog.action.ilike(search_like),
                    AuditLog.entity_type.ilike(search_like),
                )
            )

        if date_from:
            query = query.filter(AuditLog.created_at >= date_from)

        if date_to:
            query = query.filter(AuditLog.created_at <= date_to)

        total = query.count()
        logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()

        result = []
        for log in logs:
            user = log.user
            result.append({
                "id": log.id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "ip_address": log.ip_address,
                "details": log.details,
                "created_at": log.created_at,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                } if user else None,
            })

        return {"items": result, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def get_stats(db: Session) -> dict:
        """Get audit activity stats for the dashboard."""
        from sqlalchemy import func

        # Count by action
        action_counts = (
            db.query(AuditLog.action, func.count(AuditLog.id).label("count"))
            .group_by(AuditLog.action)
            .order_by(desc("count"))
            .limit(10)
            .all()
        )

        # Total logs
        total = db.query(func.count(AuditLog.id)).scalar()

        # Most active users
        top_users = (
            db.query(
                AuditLog.user_id,
                User.first_name,
                User.last_name,
                User.email,
                func.count(AuditLog.id).label("count"),
            )
            .join(User, AuditLog.user_id == User.id)
            .group_by(AuditLog.user_id, User.first_name, User.last_name, User.email)
            .order_by(desc("count"))
            .limit(5)
            .all()
        )

        return {
            "total_logs": total,
            "action_counts": [{"action": a, "count": c} for a, c in action_counts],
            "top_users": [
                {"user_id": uid, "name": f"{fn} {ln}", "email": em, "count": c}
                for uid, fn, ln, em, c in top_users
            ],
        }
