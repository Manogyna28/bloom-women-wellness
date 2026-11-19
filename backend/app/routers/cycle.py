import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import current_user
from ..models import Period, SymptomDay, User
from ..schemas import PeriodIn, PeriodPatch, SymptomsIn, check_date

router = APIRouter(tags=["cycle"])


def period_to_dict(p: Period) -> dict:
    return {"id": p.id, "start": p.start, "end": p.end}


def all_periods(db: Session, user: User) -> list:
    rows = db.query(Period).filter(Period.user_id == user.id).order_by(Period.start).all()
    return [period_to_dict(r) for r in rows]


def all_symptoms(db: Session, user: User) -> dict:
    rows = db.query(SymptomDay).filter(SymptomDay.user_id == user.id).all()
    return {r.date: json.loads(r.data_json) for r in rows}


# ---------- periods ----------
@router.get("/periods")
def list_periods(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return all_periods(db, user)


@router.post("/periods", status_code=201)
def add_period(body: PeriodIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if body.end and body.end < body.start:
        raise HTTPException(422, "End date cannot be before the start date.")
    exists = db.query(Period).filter(Period.user_id == user.id, Period.start == body.start).first()
    if not exists:
        pid = body.id or f"p-{uuid.uuid4().hex[:12]}"
        if db.get(Period, pid):                       # id clash with another user
            pid = f"p-{uuid.uuid4().hex[:12]}"
        db.add(Period(id=pid, user_id=user.id, start=body.start, end=body.end))
        db.commit()
    return all_periods(db, user)


@router.patch("/periods/{pid}")
def update_period(pid: str, body: PeriodPatch, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = db.query(Period).filter(Period.id == pid, Period.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Period not found.")
    for key, value in body.model_dump(exclude_unset=True).items():
        if key == "start" and value is None:
            continue                                   # start can't be cleared
        setattr(p, key, value)
    if p.end and p.end < p.start:
        raise HTTPException(422, "End date cannot be before the start date.")
    db.commit()
    return all_periods(db, user)


@router.delete("/periods/{pid}")
def delete_period(pid: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.query(Period).filter(Period.id == pid, Period.user_id == user.id).delete()
    db.commit()
    return all_periods(db, user)


# ---------- symptoms ----------
@router.get("/symptoms")
def get_symptoms(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return all_symptoms(db, user)


@router.put("/symptoms/{date}")
def set_symptoms(date: str, body: SymptomsIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    try:
        check_date(date)
    except ValueError as e:
        raise HTTPException(422, str(e))
    row = db.query(SymptomDay).filter(SymptomDay.user_id == user.id, SymptomDay.date == date).first()
    if not body.symptoms:                              # empty = remove that day
        if row:
            db.delete(row)
    elif row:
        row.data_json = json.dumps(body.symptoms)
    else:
        db.add(SymptomDay(user_id=user.id, date=date, data_json=json.dumps(body.symptoms)))
    db.commit()
    return all_symptoms(db, user)
