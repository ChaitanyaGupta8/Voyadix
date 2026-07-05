import os
import sys
import re
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt

from nlp_engine import TRIPLinguist
from recommender import DynamicPOIRecommender
from optimizer import ItineraryOptimizer
from live_data import LiveDataManager

sys.path.append(os.path.dirname(os.path.abspath(__file__)))


# Database Configuration Imports
from database import engine, get_db, User, Trip
import database

app = FastAPI(title="Voyadix API", version="1.0.0")

# AUTHENTICATION CONFIGURATION 
SECRET_KEY = "your-super-secret-key-change-this-in-production"  
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- PYDANTIC SCHEMAS ---
class QueryRequest(BaseModel):
    user_prompt: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str

# --- DATABASE TABLE CREATION & MIDDLEWARE ---
database.Base.metadata.create_all(bind=database.engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

linguist = TRIPLinguist()
recommender = DynamicPOIRecommender()
optimizer = ItineraryOptimizer()
live_engine = LiveDataManager()

def isolate_true_city(prompt: str, extracted_dest: str) -> str:
    """
    Intelligently extracts the precise destination name.
    """
    clean_prompt = prompt.replace(",", " ").replace(".", " ").strip()

    match_to = re.search(r'\bto\s+([a-zA-Z\s]+?)(?:\b(?:in|exploring|for|during|with)\b|$)', clean_prompt, re.IGNORECASE)
    if match_to:
        city = match_to.group(1).strip()
        if city: 
            return city.title()

    match_region = re.search(r'\b([a-zA-Z\s]+?)\s+in\s+([a-zA-Z\s]+)\b', clean_prompt, re.IGNORECASE)
    if match_region:
        city = match_region.group(1).strip()
        city = re.sub(r'\b(trip|vacation|tour|day)\b', '', city, flags=re.IGNORECASE).strip()
        if city:
            return city.title()

    return extracted_dest.title()

# --- AUTH API ENDPOINTS ---

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and persist user record
    hashed_pwd = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_pwd)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "user_id": new_user.id}

@app.post("/api/auth/login")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    # Find the user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # Verify existence and password match
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Generate secure access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# --- TRAVEL PLANNING ENDPOINTS ---

@app.post("/generate-itinerary")
async def generate_itinerary(request: QueryRequest):
    try:
   
        constraints = linguist.extract_constraints(request.user_prompt)
        raw_destination = constraints["destination"]
        duration = constraints["duration_days"]
        
        target_city = isolate_true_city(request.user_prompt, raw_destination)
        
        live_poi_df = live_engine.fetch_live_pois_by_city(target_city, duration_days=duration)
        
        if live_poi_df.empty:
            raise HTTPException(
                status_code=404, 
                detail=f"Could not resolve notable travel hotspots for '{target_city}'. Try adjusting the city name format."
            )

        top_matches = recommender.fit_and_recommend(
            df=live_poi_df,
            query=constraints["search_query"],
            max_budget=constraints.get("max_budget"),
            top_n=duration * 3
        )

        final_schedule = optimizer.generate_plan(
            recommended_pois=top_matches, 
            duration_days=duration
        )

        return {
            "status": "success",
            "extracted_constraints": {
                **constraints,
                "destination": target_city
            },
            "itinerary": final_schedule
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    



@app.post("/api/trips/save")
async def save_trip(
    trip_data: dict,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)


    user = db.query(User).filter(User.email == email).first()
    
    # trip_data should contain: {"destination": "...", "duration": 3, "itinerary": {...}}
    new_trip = Trip(
        destination=trip_data['destination'],
        duration=trip_data['duration'],
        itinerary_json=str(trip_data['itinerary']),
        user_id=user.id
    )
    
    db.add(new_trip)
    db.commit()
    return {"message": "Trip saved successfully!"}




@app.get("/api/trips/me")
async def get_my_trips(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):

    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    email: str = payload.get("sub")

    user = db.query(User).filter(User.email == email).first()
    trips = db.query(Trip).filter(Trip.user_id == user.id).all()

    return [
        {
            "id": trip.id,
            "destination": trip.destination,
            "duration": trip.duration,
            "itinerary": trip.itinerary_json
        } for trip in trips
    ]