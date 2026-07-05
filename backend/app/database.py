from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# 1. Define the SQLite database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./voyadix.db"

# 2. Create the SQLAlchemy engine
# "check_same_thread": False is needed only for SQLite in FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 3. Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Create a Base class for our models to inherit from
Base = declarative_base()

# --- DATABASE MODELS ---

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Relationship: A user can have many saved trips
    trips = relationship("Trip", back_populates="owner")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    destination = Column(String, index=True)
    duration = Column(Integer)
    itinerary_json = Column(Text)  # We will store the AI's output as a JSON string here
    
    # Foreign Key linking this specific trip to a user
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationship mapping back to the user
    owner = relationship("User", back_populates="trips")

# --- DEPENDENCY INJECTION ---

# Dependency to get the DB session in our FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()