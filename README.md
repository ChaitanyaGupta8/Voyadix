# ✈️ Voyadix: AI-Powered Travel Architect

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Render](https://img.shields.io/badge/Render-%46E3B7.svg?style=for-the-badge&logo=render&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

Voyadix is a full-stack AI travel itinerary generator that transforms natural language prompts into structured, multi-day travel plans. Built with a React frontend and a FastAPI backend, it leverages Natural Language Processing (spaCy) to orchestrate personalized adventures.

**🔗 [Live Demo: Experience Voyadix Here](https://voyadix-app.vercel.app/)** *(Note: The backend is hosted on a free Render cloud instance. Please allow up to 50 seconds for the AI engine to wake up from sleep on the initial request.)*

---

## ✨ Key Features

* **AI Prompt Engine:** Users can input natural, unstructured travel desires (e.g., "A relaxing 4-day beach trip to Bali"), which the NLP engine parses to extract destinations, durations, and travel intent.
* **Intelligent Itinerary Generation:** Dynamically builds day-by-day schedules complete with location-specific activities and logical pacing.
* **Secure Authentication:** Full JWT-based user authentication system allowing users to securely create accounts, log in, and manage sessions.
* **Persistent Storage:** Users can save generated itineraries to their personal dashboard, utilizing a relational SQLite database via SQLAlchemy.
* **Responsive UI/UX:** A modern, glass-morphism inspired interface built in React, optimized for both desktop and mobile viewing.

---

## 🛠️ Tech Stack

**Frontend:**
* React.js (Vite)
* JWT-Decode (Client-side Auth handling)
* CSS3 (Custom responsive styling)

**Backend:**
* Python 3 & FastAPI
* SQLAlchemy & SQLite
* Passlib & Bcrypt (Password Hashing)
* Python-Jose (JWT Token Generation)

**AI & Data Engine:**
* spaCy (NLP parsing & entity recognition)
* Scikit-Learn
* Pandas & Numpy

---

## 🚀 Local Development Setup

If you would like to run this project locally, follow these steps:

### 1. Clone the Repository
```bash
git clone [https://github.com/](https://github.com/)[YOUR-USERNAME]/voyadix.git
cd voyadix
```

### 2. Start the Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt

# Download the required spaCy language model
python -m spacy download en_core_web_sm

# Start the local server
uvicorn app.main:app --reload

# The backend API will be available at http://127.0.0.1:8000
```

### Start the Frontend (React)

```bash
cd frontend
npm install
npm run dev

# The frontend will run on http://localhost:5173
```

---

## 🏗️ Architecture & System Flow

Voyadix uses a decoupled client-server architecture to ensure high performance and separation of concerns:

1. **Client Request:** The React frontend captures the user's natural language prompt and sends it to the FastAPI backend.
2. **NLP Processing:** The custom `TRIPLinguist` engine (powered by spaCy) intercepts the prompt, extracting named entities (GPE) for location and cardinal numbers for duration.
3. **Generation:** The recommendation engine builds a structured JSON itinerary based on the extracted parameters and context.
4. **Persistence:** If authenticated, the system serializes the JSON itinerary and stores it in the relational database alongside a foreign key linking to the user's ID.

---

