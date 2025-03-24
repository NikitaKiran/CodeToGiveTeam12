import os
import json
import io
import minio
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from docx_analysis import analyze_docx_file
from image_analysis import analyze_image_file
from pdf_analysis import analyze_pdf_file
from ppt_pptx_analysis import analyze_ppt_file

load_dotenv()

app = Flask(__name__)

# MinIO Configuration for a local instance
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9100")
ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "your-access-key")
SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "your-secret-key")
BUCKET_NAME = os.getenv("MINIO_BUCKET", "submissions")

minio_client = minio.Minio(
    MINIO_ENDPOINT,
    access_key=ACCESS_KEY,
    secret_key=SECRET_KEY,
    secure=False  # Assuming local instance without SSL
)

# Ensure the bucket exists
try:
    if not minio_client.bucket_exists(BUCKET_NAME):
        minio_client.make_bucket(BUCKET_NAME)
except Exception as e:
    print(f"Error initializing MinIO bucket: {e}")

# Helper function to save data to MinIO
def save_to_minio(filename, data):
    json_data = json.dumps(data).encode("utf-8")
    minio_client.put_object(BUCKET_NAME, filename, io.BytesIO(json_data), length=len(json_data), content_type="application/json")

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    filename = file.filename
    file_extension = filename.split(".")[-1].lower()

    file_path = os.path.join("/tmp", filename)
    file.save(file_path)

    # Process file based on extension
    if file_extension in ["doc", "docx"]:
        response = analyze_docx_file(file_path)
    elif file_extension in ["png", "jpg", "jpeg"]:
        response = analyze_image_file(file_path)
    elif file_extension in ["pdf"]:
        response = analyze_pdf_file(file_path)
    elif file_extension in ["ppt", "pptx"]:
        response = analyze_ppt_file(file_path)
    else:
        return jsonify({"error": "Unsupported file type"}), 400

    # Save extracted data to MinIO
    minio_filename = f"processed_{filename}.json"
    save_to_minio(minio_filename, response)

    return jsonify(response)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
