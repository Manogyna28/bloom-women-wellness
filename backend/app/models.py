from datetime import datetime

from sqlalchemy import (Column, DateTime, Float, ForeignKey, Integer, String,
                        Text, UniqueConstraint)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(80), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    age = Column(String(20), nullable=False)          # age range, e.g. "18–24"
    password_hash = Column(String(255), nullable=False)
    profile_json = Column(Text, nullable=True)        # onboarding / settings blob
    dismissed_json = Column(Text, nullable=True)      # dismissed insight ids
    created_at = Column(DateTime, default=datetime.utcnow)

    logs = relationship("DailyLog", cascade="all, delete-orphan")
    periods = relationship("Period", cascade="all, delete-orphan")
    symptoms = relationship("SymptomDay", cascade="all, delete-orphan")
    meals = relationship("MealDay", cascade="all, delete-orphan")


class DailyLog(Base):
    __tablename__ = "daily_logs"
    __table_args__ = (UniqueConstraint("user_id", "date"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    date = Column(String(10), nullable=False)         # YYYY-MM-DD
    water = Column(Integer, default=0)
    sleep = Column(Float, default=0)
    activity = Column(Integer, default=0)
    mood = Column(String(20), nullable=True)
    energy = Column(String(20), nullable=True)
    stress = Column(Integer, nullable=True)           # 1-10, used by the ML part
    bedtime = Column(String(5), nullable=True)        # HH:MM
    wake_time = Column(String(5), nullable=True)      # HH:MM


class Period(Base):
    __tablename__ = "periods"
    id = Column(String(40), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    start = Column(String(10), nullable=False)
    end = Column(String(10), nullable=True)


class SymptomDay(Base):
    __tablename__ = "symptom_days"
    __table_args__ = (UniqueConstraint("user_id", "date"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    date = Column(String(10), nullable=False)
    data_json = Column(Text, nullable=False)          # {"cramps": 2}


class MealDay(Base):
    __tablename__ = "meal_days"
    __table_args__ = (UniqueConstraint("user_id", "date"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    date = Column(String(10), nullable=False)
    data_json = Column(Text, nullable=False)
