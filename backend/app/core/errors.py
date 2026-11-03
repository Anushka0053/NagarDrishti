from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from app.core.logging import logger


class NagarDrishtiException(Exception):
    def __init__(self, message: str, status_code: int = 400, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


def register_error_handlers(app: FastAPI):
    @app.exception_handler(NagarDrishtiException)
    async def custom_exception_handler(request: Request, exc: NagarDrishtiException):
        origin = request.headers.get("origin", "*")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "message": exc.message,
                "details": exc.details,
                "path": request.url.path
            },
            headers={
                "Access-Control-Allow-Origin": origin if origin else "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled error at {request.url.path}: {exc}", exc_info=True)
        origin = request.headers.get("origin", "*")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": True,
                "message": str(exc) if "development" in request.app.title.lower() or "127.0.0.1" in str(request.base_url) else "An internal server error occurred.",
                "path": request.url.path
            },
            headers={
                "Access-Control-Allow-Origin": origin if origin else "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
