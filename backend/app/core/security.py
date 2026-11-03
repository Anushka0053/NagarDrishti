from typing import Optional, Dict, Any, List, Callable
from uuid import UUID
import os
import re
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)

# File upload security constraints
ALLOWED_UPLOAD_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "audio/wav",
    "audio/webm",
    "audio/mpeg",
    "audio/ogg",
    "application/json",
    "application/geo+json"
}
ALLOWED_UPLOAD_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp",
    ".wav", ".webm", ".mp3", ".ogg",
    ".json", ".geojson"
}
MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB max per file


def verify_supabase_jwt(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)) -> Optional[Dict[str, Any]]:
    """
    Validates Supabase JWT from Authorization header.
    In development without JWT_SECRET configured, returns decoded claims or mock guest context.
    """
    if not credentials:
        return None

    token = credentials.credentials
    if not settings.SUPABASE_JWT_SECRET:
        # Development fallback: Decode without verify if secret is not provided yet
        try:
            return jwt.decode(token, options={"verify_signature": False})
        except Exception:
            return None

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def extract_user_identity(claims: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Extracts structured user identity and role from Supabase or custom JWT claims.
    Standardizes role hierarchy: 'super_admin' > 'gis_admin' > 'analyst' > 'verifier' > 'citizen' > 'guest'.
    """
    if not claims:
        return {
            "user_id": None,
            "role": "guest",
            "city_id": None,
            "department_id": None,
            "email": None
        }

    app_meta = claims.get("app_metadata", {})
    user_meta = claims.get("user_metadata", {})

    role = claims.get("role") or app_meta.get("role") or user_meta.get("role") or "citizen"
    user_id = claims.get("sub") or claims.get("id")
    city_id = app_meta.get("city_id") or user_meta.get("city_id") or claims.get("city_id")
    department_id = app_meta.get("department_id") or user_meta.get("department_id") or claims.get("department_id")
    email = claims.get("email") or user_meta.get("email")

    return {
        "user_id": user_id,
        "role": role,
        "city_id": city_id,
        "department_id": department_id,
        "email": email
    }


def require_authenticated_user(claims: Optional[Dict[str, Any]] = Depends(verify_supabase_jwt)) -> Dict[str, Any]:
    """Requires a valid authenticated user token."""
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for this operation",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return claims


def require_roles(allowed_roles: List[str]) -> Callable:
    """
    Dependency factory enforcing Role-Based Access Control (RBAC).
    'super_admin' always has unrestricted bypass rights across all administrative functions.
    """
    def role_checker(claims: Optional[Dict[str, Any]] = Depends(verify_supabase_jwt)) -> Dict[str, Any]:
        if not claims:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token required for administrative operation",
                headers={"WWW-Authenticate": "Bearer"},
            )

        identity = extract_user_identity(claims)
        role = identity["role"]

        if role == "super_admin":
            return claims

        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Role '{role}' does not have sufficient privileges. Allowed: {allowed_roles}"
            )
        return claims

    return role_checker


def enforce_city_scope(claims: Dict[str, Any], target_city_id: Optional[UUID]) -> None:
    """
    Prevents cross-city modifications by municipal/city admins.
    Super Admins are exempt.
    """
    identity = extract_user_identity(claims)
    if identity["role"] == "super_admin":
        return

    user_city_id = identity["city_id"]
    if user_city_id and target_city_id:
        if str(user_city_id) != str(target_city_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cross-city operation denied: Authorized for city '{user_city_id}', not '{target_city_id}'"
            )


def enforce_department_scope(claims: Dict[str, Any], target_dept_id: Optional[UUID]) -> None:
    """
    Prevents cross-department modification of reports by department officers.
    Super Admins and GIS Admins are exempt.
    """
    identity = extract_user_identity(claims)
    if identity["role"] in ["super_admin", "gis_admin"]:
        return

    user_dept_id = identity["department_id"]
    if user_dept_id and target_dept_id:
        if str(user_dept_id) != str(target_dept_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cross-department operation denied: Authorized for dept '{user_dept_id}', not '{target_dept_id}'"
            )


def sanitize_and_validate_file_upload(
    file_name: str,
    file_size_bytes: int,
    mime_type: str
) -> str:
    """
    Validates uploaded file against path traversal, forbidden extensions,
    MIME type spoofing, and excessive file size.
    Returns a safe sanitized filename.
    """
    # 1. Path traversal prevention
    if ".." in file_name or "/" in file_name or "\\" in file_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Illegal file name: path traversal characters detected."
        )
    base_name = os.path.basename(file_name)

    # 2. Sanitized file name
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', base_name)
    ext = os.path.splitext(clean_name)[1].lower()

    # 3. Extension & MIME Validation
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(sorted(ALLOWED_UPLOAD_EXTENSIONS))}"
        )

    if mime_type.lower() not in ALLOWED_UPLOAD_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported MIME type '{mime_type}'. Allowed: {', '.join(sorted(ALLOWED_UPLOAD_MIME_TYPES))}"
        )

    # 4. Size validation
    if file_size_bytes > MAX_UPLOAD_SIZE_BYTES:
        max_mb = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_mb:.0f} MB."
        )

    return clean_name
