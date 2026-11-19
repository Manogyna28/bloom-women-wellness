from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import current_user
from ..models import DailyLog, User
from ..schemas import LogPatch, check_date

router = APIRouter(prefix="/logs", tags=["daily logs"])


def log_to_dict(l: DailyLog) -> dict:
    return {
        "water": l.water or 0, "sleep": l.sleep or 0, "activity": l.activity or 0,
        "mood": l.mood, "energy": l.energy, "stress": l.stress,
        "bedtime": l.bedtime, "wakeTime": l.wake_time,
    }


def all_logs(db: Session, user: User) -> dict:
    rows = db.query(DailyLog).filter(DailyLog.user_id == user.id).all()
    return {r.date: log_to_dict(r) for r in rows}


@router.get("")
def get_logs(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return all_logs(db, user)


@router.put("/{date}")
def save_log(date: str, body: LogPatch, user: User = Depends(current_user), db: Session = Depends(get_db)):
    try:
        check_date(date)
    except ValueError as e:
        raise HTTPException(422, str(e))
    row = db.query(DailyLog).filter(DailyLog.user_id == user.id, DailyLog.date == date).first()
    if not row:
        row = DailyLog(user_id=user.id, date=date, water=0, sleep=0, activity=0)
        db.add(row)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(row, "wake_time" if key == "wakeTime" else key, value)
    db.commit()
    db.refresh(row)
    return log_to_dict(row)


@router.delete("/{date}", status_code=204)
def delete_log(date: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.query(DailyLog).filter(DailyLog.user_id == user.id, DailyLog.date == date).delete()
    db.commit()
