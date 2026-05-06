from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from app.services.extractor import process_file, process_files

app = FastAPI(title="Invoice AI Parser API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Invoice AI API running"}

@app.post("/upload-single")
async def upload_single(file: UploadFile = File(...)):
    """Upload a single invoice file and get raw extraction results."""
    try:
        return process_file(file)
    except Exception as e:
        return {"error": str(e)}

@app.post("/inspect-excel")
async def inspect_excel(file: UploadFile = File(...)):
    """Return headers and suggested mapping for human-in-the-loop."""
    try:
        from app.services.extractor import get_excel_headers
        file_bytes = await file.read()
        return get_excel_headers(file_bytes, file.filename)
    except Exception as e:
        return {"error": str(e)}

@app.post("/upload-multiple")
async def upload_multiple(files: List[UploadFile] = File(...)):
    """Upload multiple files and get merged data."""
    try:
        return process_files(files)
    except Exception as e:
        return {"error": str(e)}

@app.post("/upload-excel-with-map")
async def upload_excel_with_map(file: UploadFile = File(...), mapping: str = None):
    """Process Excel with a specific manual mapping."""
    try:
        import json
        from app.services.extractor import excel_extract
        file_bytes = await file.read()
        custom_map = json.loads(mapping) if mapping else None
        return excel_extract(file_bytes, file.filename, custom_map=custom_map)
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
