# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import Base, engine, get_db
from sqlalchemy import Column, String, Integer, Float, Enum
from pydantic import BaseModel
from typing import List
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt

# Initialize FastAPI application
app = FastAPI()

# Initialize security context
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], default="bcrypt")

# Define SQLAlchemy models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    password = Column(String)

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    category = Column(String)
    amount = Column(Float)
    status = Column(Enum("Approved", "Pending", "Rejected"))

# Define Pydantic models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str

class ExpenseRequest(BaseModel):
    title: str
    category: str
    amount: float

class Token(BaseModel):
    access_token: str
    token_type: str

# Define authentication endpoint
@app.post("/api/v1/auth/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not pwd_context.verify(request.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    access_token = jwt.encode({"sub": user.email, "exp": datetime.utcnow() + timedelta(minutes=30)}, "secret_key", algorithm="HS256")
    return {"access_token": access_token, "token_type": "bearer"}

# Define registration endpoint
@app.post("/api/v1/auth/register", response_model=Token)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
    new_user = User(email=request.email, password=pwd_context.hash(request.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = jwt.encode({"sub": new_user.email, "exp": datetime.utcnow() + timedelta(minutes=30)}, "secret_key", algorithm="HS256")
    return {"access_token": access_token, "token_type": "bearer"}

# Define protected endpoint
def get_current_user(token: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token.credentials, "secret_key", algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Define expense endpoints
@app.get("/api/v1/expenses/")
async def get_expenses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    expenses = db.query(Expense).all()
    return [{"id": expense.id, "title": expense.title, "category": expense.category, "amount": expense.amount, "status": expense.status} for expense in expenses]

@app.post("/api/v1/expenses/")
async def create_expense(request: ExpenseRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_expense = Expense(title=request.title, category=request.category, amount=request.amount, status="Pending")
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return {"id": new_expense.id, "title": new_expense.title, "category": new_expense.category, "amount": new_expense.amount, "status": new_expense.status}

@app.get("/api/v1/summary/")
async def get_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_expenses = db.query(Expense).count()
    pending_approvals = db.query(Expense).filter(Expense.status == "Pending").count()
    monthly_budget_remaining = 1000 - sum([expense.amount for expense in db.query(Expense).all()])
    return {"total_expenses": total_expenses, "pending_approvals": pending_approvals, "monthly_budget_remaining": monthly_budget_remaining}