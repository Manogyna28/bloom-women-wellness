import json
from datetime import date

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import current_user
from ..models import DailyLog, MealDay, Period, SymptomDay, User
from .cycle import all_periods, all_symptoms
from .logs import all_logs
from .meals import all_meals

router = APIRouter(tags=["account & sync"])


def _load(text):
    return json.loads(text) if text else None


@router.get("/sync")
def sync(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """One call that returns everything, so the frontend can load after login."""
    return {
        "account": {"name": user.name, "email": user.email, "age": user.age},
        "profile": _load(user.profile_json),
        "logs": all_logs(db, user),
        "periods": all_periods(db, user),
        "symptoms": all_symptoms(db, user),
        "meals": all_meals(db, user),
        "dismissed": _load(user.dismissed_json) or {},
    }


@router.get("/profile")
def get_profile(user: User = Depends(current_user)):
    return _load(user.profile_json)


@router.put("/profile")
def save_profile(profile: dict = Body(...), user: User = Depends(current_user), db: Session = Depends(get_db)):
    text = json.dumps(profile)
    if len(text) > 20000:
        raise HTTPException(413, "Profile is too large.")
    user.profile_json = text
    db.commit()
    return profile


@router.get("/dismissed")
def get_dismissed(user: User = Depends(current_user)):
    return _load(user.dismissed_json) or {}


@router.put("/dismissed")
def save_dismissed(data: dict[str, str] = Body(...), user: User = Depends(current_user), db: Session = Depends(get_db)):
    user.dismissed_json = json.dumps(data)
    db.commit()
    return data


@router.get("/export")
def export_all(user: User = Depends(current_user), db: Session = Depends(get_db)):
    data = sync(user, db)
    data["exportedOn"] = date.today().isoformat()
    return data


@router.delete("/data", status_code=204)
def delete_tracked(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Removes entries but keeps the account and profile."""
    for model in (DailyLog, Period, SymptomDay, MealDay):
        db.query(model).filter(model.user_id == user.id).delete()
    user.dismissed_json = None
    db.commit()


@router.delete("/account", status_code=204)
def delete_account(user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(user)          # cascades to every table
    db.commit()
