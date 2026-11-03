from typing import Optional, Dict, Any
from uuid import UUID
import uuid
from datetime import datetime, timedelta
import jwt
from pydantic import BaseModel, Field, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_supabase_jwt, extract_user_identity
from app.models.feedback import UserProfile
from app.models.admin import City

router = APIRouter()

JWT_SECRET = settings.SUPABASE_JWT_SECRET or "nagardrishti-mp-secure-jwt-signing-secret-2026"
JWT_ALGORITHM = "HS256"

# Demo predefined user profiles for government and citizen demonstration
DEMO_CREDENTIALS = {
    "superadmin@mp.gov.in": {
        "id": "u0000000-0000-0000-0000-000000000001",
        "full_name": "Dr. Rajeshwar Sharma, IAS",
        "role": "super_admin",
        "title": "Principal Secretary, Urban Development & Housing, MP",
        "city_id": None
    },
    "cityadmin.gwalior@mp.gov.in": {
        "id": "u0000000-0000-0000-0000-000000000002",
        "full_name": "Smt. Neha Bansal, IAS",
        "role": "city_admin",
        "title": "Municipal Commissioner, Gwalior (GMC)",
        "city_id": "c0000000-0000-0000-0000-000000000001"
    },
    "cityadmin.indore@mp.gov.in": {
        "id": "u0000000-0000-0000-0000-000000000003",
        "full_name": "Shri Shivam Mishra, IAS",
        "role": "city_admin",
        "title": "Municipal Commissioner, Indore (IMC)",
        "city_id": "c0000000-0000-0000-0000-000000000002"
    },
    "depthead.pwd@mp.gov.in": {
        "id": "u0000000-0000-0000-0000-000000000004",
        "full_name": "Er. Alok Nath Saxena",
        "role": "department_head",
        "title": "Chief Engineer, PWD Madhya Pradesh",
        "department_id": "d0000000-0000-0000-0000-000000000003"
    },
    "fieldofficer.pwd@mp.gov.in": {
        "id": "u0000000-0000-0000-0000-000000000005",
        "full_name": "Er. Rajesh Sharma",
        "role": "field_officer",
        "title": "Assistant Engineer, PWD Gwalior Division",
        "city_id": "c0000000-0000-0000-0000-000000000001",
        "department_id": "d0000000-0000-0000-0000-000000000003"
    },
    "gisofficer@mp.gov.in": {
        "id": "u0000000-0000-0000-0000-000000000006",
        "full_name": "Pooja Verma",
        "role": "gis_admin",
        "title": "Senior GIS Specialist, UADD GARUD Portal",
        "city_id": None
    },
    "citizen@nagardrishti.mp": {
        "id": "u0000000-0000-0000-0000-000000000007",
        "full_name": "Ananya Sharma",
        "role": "citizen",
        "title": "Verified Citizen",
        "city_id": "c0000000-0000-0000-0000-000000000001"
    }
}


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email or phone")
    password: str = Field(..., min_length=4)
    role_override: Optional[str] = None
    city_id: Optional[UUID] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in_seconds: int
    user: Dict[str, Any]


@router.post("/login", response_model=LoginResponse, tags=["Authentication"])
def login_for_access_token(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a public citizen or government officer and return a signed JWT token.
    Supports demonstration identity accounts and role-scoped permissions.
    """
    email_clean = req.email.strip().lower()

    # Match predefined account or fallback
    account = DEMO_CREDENTIALS.get(email_clean)
    if not account:
        # Dynamic fallback for demo / test inputs
        role = req.role_override or ("super_admin" if "admin" in email_clean else "citizen")
        account = {
            "id": str(uuid.uuid4()),
            "full_name": email_clean.split("@")[0].replace(".", " ").title(),
            "role": role,
            "title": f"Officer ({role.replace('_', ' ').title()})" if role != "citizen" else "Citizen User",
            "city_id": str(req.city_id) if req.city_id else "c0000000-0000-0000-0000-000000000001"
        }

    role = req.role_override or account["role"]
    user_id = account["id"]
    now = datetime.utcnow()
    exp = now + timedelta(days=7)

    payload = {
        "sub": user_id,
        "email": email_clean,
        "aud": "authenticated",
        "role": role,
        "app_metadata": {
            "role": role,
            "city_id": account.get("city_id"),
            "department_id": account.get("department_id")
        },
        "user_metadata": {
            "full_name": account["full_name"],
            "title": account.get("title", ""),
            "role": role
        },
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp())
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return LoginResponse(
        access_token=token,
        token_type="Bearer",
        expires_in_seconds=7 * 86400,
        user={
            "id": user_id,
            "email": email_clean,
            "full_name": account["full_name"],
            "title": account.get("title", ""),
            "role": role,
            "city_id": account.get("city_id"),
            "department_id": account.get("department_id")
        }
    )


@router.get("/me", tags=["Authentication"])
def get_current_user_profile(
    claims: Optional[dict] = Depends(verify_supabase_jwt)
):
    """Return the current user identity and active roles from decoded JWT."""
    if not claims:
        return {
            "is_authenticated": False,
            "role": "guest",
            "user": None
        }

    identity = extract_user_identity(claims)
    user_meta = claims.get("user_metadata", {})

    return {
        "is_authenticated": True,
        "user_id": identity["user_id"],
        "email": identity["email"],
        "full_name": user_meta.get("full_name") or "User",
        "title": user_meta.get("title") or identity["role"].replace("_", " ").title(),
        "role": identity["role"],
        "city_id": identity["city_id"],
        "department_id": identity["department_id"]
    }

