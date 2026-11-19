import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import current_user
from ..models import MealDay, User
from ..schemas import MealDayIn, check_date

router = APIRouter(prefix="/meals", tags=["meals"])


def all_meals(db: Session, user: User) -> dict:
    rows = db.query(MealDay).filter(MealDay.user_id == user.id).all()
    return {r.date: json.loads(r.data_json) for r in rows}


@router.get("")
def get_meals(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return all_meals(db, user)


@router.put("/{date}")
def save_day(date: str, body: MealDayIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    try:
        check_date(date)
    except ValueError as e:
        raise HTTPException(422, str(e))
    payload = json.dumps(body.model_dump())
    row = db.query(MealDay).filter(MealDay.user_id == user.id, MealDay.date == date).first()
    if row:
        row.data_json = payload
    else:
        db.add(MealDay(user_id=user.id, date=date, data_json=payload))
    db.commit()
    return json.loads(payload)
