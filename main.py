import sys, os
BASE_BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if BASE_BACKEND_DIR not in sys.path:
    sys.path.insert(0, BASE_BACKEND_DIR)

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
