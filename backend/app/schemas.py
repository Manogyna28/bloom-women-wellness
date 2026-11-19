import re
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
AGE_OPTIONS = {"Under 13", "13–17", "18–24", "25–34", "35–44", "45+"}
MOODS = {"happy", "calm", "neutral", "sad", "frustrated"}
ENERGY = {"low", "moderate", "high"}


def check_date(value: str) -> str:
    if not DATE_RE.match(value):
        raise ValueError("Date must look like YYYY-MM-DD.")
    return value


# ---------- auth ----------
class SignupIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    age: str

    @field_validator("name")
    @classmethod
    def clean_name(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Please tell us what to call you.")
        return v

    @field_validator("age")
    @classmethod
    def valid_age(cls, v):
        if v not in AGE_OPTIONS:
            raise ValueError("Please select a valid age range.")
        if v == "Under 13":
            raise ValueError("Bloom is for ages 13 and up.")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    name: str
    email: str
    age: str


class TokenOut(BaseModel):
    token: str
    account: UserOut


# ---------- daily logs ----------
class LogPatch(BaseModel):
    """Only the fields the client sends are changed (use exclude_unset)."""
    water: Optional[int] = Field(default=None, ge=0, le=40)
    sleep: Optional[float] = Field(default=None, ge=0, le=24)
    activity: Optional[int] = Field(default=None, ge=0, le=1440)
    mood: Optional[str] = None
    energy: Optional[str] = None
    stress: Optional[int] = Field(default=None, ge=1, le=10)
    bedtime: Optional[str] = None
    wakeTime: Optional[str] = None

    @field_validator("mood")
    @classmethod
    def v_mood(cls, v):
        if v is not None and v not in MOODS:
            raise ValueError("Unknown mood.")
        return v

    @field_validator("energy")
    @classmethod
    def v_energy(cls, v):
        if v is not None and v not in ENERGY:
            raise ValueError("Unknown energy level.")
        return v

    @field_validator("bedtime", "wakeTime")
    @classmethod
    def v_time(cls, v):
        if v is not None and not TIME_RE.match(v):
            raise ValueError("Time must look like HH:MM.")
        return v


# ---------- periods ----------
class PeriodIn(BaseModel):
    id: Optional[str] = Field(default=None, max_length=40)
    start: str
    end: Optional[str] = None

    @field_validator("start")
    @classmethod
    def v_start(cls, v):
        return check_date(v)

    @field_validator("end")
    @classmethod
    def v_end(cls, v):
        return check_date(v) if v is not None else v


class PeriodPatch(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None

    @field_validator("start", "end")
    @classmethod
    def v_dates(cls, v):
        return check_date(v) if v is not None else v


# ---------- symptoms & meals ----------
class SymptomsIn(BaseModel):
    symptoms: dict[str, int] = Field(default_factory=dict)

    @field_validator("symptoms")
    @classmethod
    def v_sym(cls, v):
        if len(v) > 30:
            raise ValueError("Too many symptoms.")
        for k, sev in v.items():
            if not 1 <= sev <= 3:
                raise ValueError("Severity must be 1 to 3.")
        return v


class MealEntry(BaseModel):
    id: str = Field(max_length=60)
    foodId: str | int
    servings: float = Field(gt=0, le=50)


class MealDayIn(BaseModel):
    breakfast: list[MealEntry] = []
    lunch: list[MealEntry] = []
    snacks: list[MealEntry] = []
    dinner: list[MealEntry] = []
    skipped: dict[str, bool] = {}
