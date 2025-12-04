from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt
import os
import uuid
import logging
from pathlib import Path
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
import io
import PyPDF2
import docx
from openai import OpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

# JWT configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# OpenAI client with Emergent LLM key
client_openai = OpenAI(
    api_key=os.environ.get('EMERGENT_LLM_KEY'),
    base_url="https://llm.emergentagi.com/v1"
)

# Create the main app
app = FastAPI(title="Job Portal API")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserRole(str):
    JOB_SEEKER = "Job Seeker"
    EMPLOYER = "Employer"

class UserBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    phone: int
    role: str = Field(..., pattern="^(Job Seeker|Employer)$")

class UserRegister(UserBase):
    password: str = Field(..., min_length=8, max_length=32)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: datetime

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class JobBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=30)
    description: str = Field(..., min_length=30, max_length=500)
    category: str
    country: str
    city: str
    location: str = Field(..., min_length=20)
    fixed_salary: Optional[int] = None
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    expired: bool = False
    job_posted_on: datetime
    posted_by: str

class ApplicationBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    cover_letter: str
    phone: int
    address: str

class ApplicationCreate(ApplicationBase):
    pass

class ResumeInfo(BaseModel):
    public_id: str
    url: str

class ApplicationResponse(ApplicationBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    resume: ResumeInfo
    applicant_id: Dict[str, Any]
    employer_id: Dict[str, Any]

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ResumeText(BaseModel):
    resume_text: str
    session_id: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {
        "id": user_id,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        logger.error(f"Error extracting PDF: {e}")
        raise HTTPException(status_code=400, detail="Failed to extract text from PDF")

def extract_text_from_docx(file_content: bytes) -> str:
    try:
        doc_file = io.BytesIO(file_content)
        doc = docx.Document(doc_file)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except Exception as e:
        logger.error(f"Error extracting DOCX: {e}")
        raise HTTPException(status_code=400, detail="Failed to extract text from DOCX")

async def analyze_resume_with_ai(resume_text: str, jobs: List[Dict]) -> Dict:
    try:
        jobs_summary = "\n".join([
            f"- {job['title']} ({job['category']}) in {job['city']}, {job['country']}: {job['description'][:100]}..."
            for job in jobs[:20]  # Limit to 20 jobs to avoid token limits
        ])
        
        prompt = f"""Analyze this resume and recommend the most suitable jobs from the list below.

Resume:
{resume_text[:2000]}

Available Jobs:
{jobs_summary}

Please provide:
1. Top 3-5 recommended jobs with reasons
2. Skills identified in the resume
3. Career level assessment
4. Suggestions for improvement

Format your response in a clear, friendly manner."""

        response = client_openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful career advisor and job matching expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        return {
            "analysis": response.choices[0].message.content,
            "recommended_jobs": jobs[:5]  # Return top 5 jobs
        }
    except Exception as e:
        logger.error(f"Error in AI analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze resume")

# ==================== USER ROUTES ====================

@app.post("/api/user/register", response_model=TokenResponse)
async def register(user: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user_dict["password"])
    user_dict["id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Generate token
    token = create_jwt_token(user_dict["id"])
    
    # Prepare response
    user_response = UserResponse(
        id=user_dict["id"],
        name=user_dict["name"],
        email=user_dict["email"],
        phone=user_dict["phone"],
        role=user_dict["role"],
        created_at=datetime.fromisoformat(user_dict["created_at"])
    )
    
    return TokenResponse(token=token, user=user_response)

@app.post("/api/user/login", response_model=TokenResponse)
async def login(user: UserLogin):
    # Find user
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate token
    token = create_jwt_token(db_user["id"])
    
    # Prepare response
    user_response = UserResponse(
        id=db_user["id"],
        name=db_user["name"],
        email=db_user["email"],
        phone=db_user["phone"],
        role=db_user["role"],
        created_at=datetime.fromisoformat(db_user["created_at"])
    )
    
    return TokenResponse(token=token, user=user_response)

@app.get("/api/user/logout")
async def logout(current_user: Dict = Depends(get_current_user)):
    return {"message": "Logged out successfully"}

@app.get("/api/user/getuser", response_model=UserResponse)
async def get_user(current_user: Dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        phone=current_user["phone"],
        role=current_user["role"],
        created_at=datetime.fromisoformat(current_user["created_at"])
    )

# ==================== JOB ROUTES ====================

@app.get("/api/job/getall", response_model=List[JobResponse])
async def get_all_jobs():
    jobs = await db.jobs.find({"expired": False}, {"_id": 0}).to_list(1000)
    for job in jobs:
        if isinstance(job.get('job_posted_on'), str):
            job['job_posted_on'] = datetime.fromisoformat(job['job_posted_on'])
    return jobs

@app.post("/api/job/post", response_model=JobResponse)
async def post_job(job: JobCreate, current_user: Dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can post jobs")
    
    job_dict = job.model_dump()
    job_dict["id"] = str(uuid.uuid4())
    job_dict["expired"] = False
    job_dict["job_posted_on"] = datetime.now(timezone.utc).isoformat()
    job_dict["posted_by"] = current_user["id"]
    
    await db.jobs.insert_one(job_dict)
    
    return JobResponse(
        **{k: v for k, v in job_dict.items() if k != "_id"},
        job_posted_on=datetime.fromisoformat(job_dict["job_posted_on"])
    )

@app.get("/api/job/getmyjobs", response_model=List[JobResponse])
async def get_my_jobs(current_user: Dict = Depends(get_current_user)):
    jobs = await db.jobs.find({"posted_by": current_user["id"]}, {"_id": 0}).to_list(1000)
    for job in jobs:
        if isinstance(job.get('job_posted_on'), str):
            job['job_posted_on'] = datetime.fromisoformat(job['job_posted_on'])
    return jobs

@app.put("/api/job/update/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, job_update: JobCreate, current_user: Dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["posted_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this job")
    
    update_dict = job_update.model_dump()
    await db.jobs.update_one({"id": job_id}, {"$set": update_dict})
    
    updated_job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if isinstance(updated_job.get('job_posted_on'), str):
        updated_job['job_posted_on'] = datetime.fromisoformat(updated_job['job_posted_on'])
    
    return JobResponse(**updated_job)

@app.delete("/api/job/delete/{job_id}")
async def delete_job(job_id: str, current_user: Dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["posted_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
    
    await db.jobs.delete_one({"id": job_id})
    return {"message": "Job deleted successfully"}

@app.get("/api/job/{job_id}", response_model=JobResponse)
async def get_single_job(job_id: str, current_user: Dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if isinstance(job.get('job_posted_on'), str):
        job['job_posted_on'] = datetime.fromisoformat(job['job_posted_on'])
    
    return JobResponse(**job)

# ==================== APPLICATION ROUTES ====================

@app.post("/api/application/post")
async def post_application(
    name: str = Form(...),
    email: str = Form(...),
    cover_letter: str = Form(...),
    phone: int = Form(...),
    address: str = Form(...),
    employer_id: str = Form(...),
    resume: UploadFile = File(...),
    current_user: Dict = Depends(get_current_user)
):
    if current_user["role"] != UserRole.JOB_SEEKER:
        raise HTTPException(status_code=403, detail="Only job seekers can apply")
    
    # Upload resume to Cloudinary
    try:
        resume_content = await resume.read()
        upload_result = cloudinary.uploader.upload(
            resume_content,
            folder="job_portal_resumes",
            resource_type="auto"
        )
        
        application_dict = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "cover_letter": cover_letter,
            "phone": phone,
            "address": address,
            "resume": {
                "public_id": upload_result["public_id"],
                "url": upload_result["secure_url"]
            },
            "applicant_id": {
                "user": current_user["id"],
                "role": current_user["role"]
            },
            "employer_id": {
                "user": employer_id,
                "role": UserRole.EMPLOYER
            }
        }
        
        await db.applications.insert_one(application_dict)
        
        return {"message": "Application submitted successfully", "application_id": application_dict["id"]}
    except Exception as e:
        logger.error(f"Error uploading resume: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload resume")

@app.get("/api/application/employer/getall")
async def employer_get_all_applications(current_user: Dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can view applications")
    
    applications = await db.applications.find(
        {"employer_id.user": current_user["id"]},
        {"_id": 0}
    ).to_list(1000)
    
    return applications

@app.get("/api/application/jobseeker/getall")
async def jobseeker_get_all_applications(current_user: Dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.JOB_SEEKER:
        raise HTTPException(status_code=403, detail="Only job seekers can view their applications")
    
    applications = await db.applications.find(
        {"applicant_id.user": current_user["id"]},
        {"_id": 0}
    ).to_list(1000)
    
    return applications

@app.delete("/api/application/delete/{application_id}")
async def delete_application(application_id: str, current_user: Dict = Depends(get_current_user)):
    application = await db.applications.find_one({"id": application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application["applicant_id"]["user"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this application")
    
    await db.applications.delete_one({"id": application_id})
    return {"message": "Application deleted successfully"}

# ==================== CHATBOT ROUTES ====================

@app.post("/api/chatbot/upload-resume")
async def upload_resume(
    resume: UploadFile = File(...),
    current_user: Dict = Depends(get_current_user)
):
    try:
        resume_content = await resume.read()
        filename = resume.filename.lower()
        
        # Extract text based on file type
        if filename.endswith('.pdf'):
            resume_text = extract_text_from_pdf(resume_content)
        elif filename.endswith('.docx'):
            resume_text = extract_text_from_docx(resume_content)
        else:
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
        # Get all jobs
        jobs = await db.jobs.find({"expired": False}, {"_id": 0}).to_list(1000)
        
        # Analyze resume with AI
        analysis = await analyze_resume_with_ai(resume_text, jobs)
        
        # Create session
        session_id = str(uuid.uuid4())
        session_data = {
            "session_id": session_id,
            "user_id": current_user["id"],
            "resume_text": resume_text,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "conversation_history": []
        }
        await db.chat_sessions.insert_one(session_data)
        
        return {
            "session_id": session_id,
            "analysis": analysis["analysis"],
            "recommended_jobs": analysis["recommended_jobs"]
        }
    except Exception as e:
        logger.error(f"Error processing resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chatbot/paste-resume")
async def paste_resume(
    resume_data: ResumeText,
    current_user: Dict = Depends(get_current_user)
):
    try:
        # Get all jobs
        jobs = await db.jobs.find({"expired": False}, {"_id": 0}).to_list(1000)
        
        # Analyze resume with AI
        analysis = await analyze_resume_with_ai(resume_data.resume_text, jobs)
        
        # Create or update session
        session_id = resume_data.session_id or str(uuid.uuid4())
        
        existing_session = await db.chat_sessions.find_one({"session_id": session_id})
        if existing_session:
            await db.chat_sessions.update_one(
                {"session_id": session_id},
                {"$set": {"resume_text": resume_data.resume_text}}
            )
        else:
            session_data = {
                "session_id": session_id,
                "user_id": current_user["id"],
                "resume_text": resume_data.resume_text,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "conversation_history": []
            }
            await db.chat_sessions.insert_one(session_data)
        
        return {
            "session_id": session_id,
            "analysis": analysis["analysis"],
            "recommended_jobs": analysis["recommended_jobs"]
        }
    except Exception as e:
        logger.error(f"Error processing resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chatbot/chat")
async def chat(
    message_data: ChatMessage,
    current_user: Dict = Depends(get_current_user)
):
    try:
        session_id = message_data.session_id
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        # Get session
        session = await db.chat_sessions.find_one({"session_id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get conversation history
        conversation_history = session.get("conversation_history", [])
        resume_text = session.get("resume_text", "")
        
        # Get all jobs for context
        jobs = await db.jobs.find({"expired": False}, {"_id": 0}).to_list(1000)
        jobs_context = "\n".join([
            f"- {job['title']} ({job['category']}) in {job['city']}, {job['country']}"
            for job in jobs[:10]
        ])
        
        # Build messages for AI
        messages = [
            {"role": "system", "content": f"""You are a helpful career advisor and job search assistant. 
You have access to the user's resume and can help with:
1. Job recommendations based on their skills and experience
2. Job search strategies and tips
3. Interview preparation advice
4. Career development guidance

User's Resume Summary:
{resume_text[:500]}...

Available Jobs:
{jobs_context}

Be friendly, encouraging, and provide actionable advice."""},
        ]
        
        # Add conversation history
        for msg in conversation_history[-6:]:  # Last 6 messages for context
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        # Add current message
        messages.append({"role": "user", "content": message_data.message})
        
        # Get AI response
        response = client_openai.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.8,
            max_tokens=800
        )
        
        ai_response = response.choices[0].message.content
        
        # Update conversation history
        conversation_history.append({"role": "user", "content": message_data.message})
        conversation_history.append({"role": "assistant", "content": ai_response})
        
        await db.chat_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"conversation_history": conversation_history}}
        )
        
        return {
            "response": ai_response,
            "session_id": session_id
        }
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chatbot/sessions")
async def get_chat_sessions(current_user: Dict = Depends(get_current_user)):
    sessions = await db.chat_sessions.find(
        {"user_id": current_user["id"]},
        {"_id": 0, "resume_text": 0}
    ).to_list(1000)
    return sessions

# ==================== MIDDLEWARE ====================

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Job Portal API is running"}
