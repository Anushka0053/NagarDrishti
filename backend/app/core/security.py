from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)


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


def require_authenticated_user(claims: Optional[Dict[str, Any]] = Depends(verify_supabase_jwt)) -> Dict[str, Any]:
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for this operation",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return claims
