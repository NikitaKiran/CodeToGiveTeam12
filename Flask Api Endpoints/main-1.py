from flask import Flask, request, jsonify
import minio
import os
import io
import json
from docx_analysis import analyze_docx
from image_analysis import analyze_image
from pdf_analysis import analyze_pdf
from ppt_pptx_analysis import analyze_ppt

app = Flask(__name__)

# MinIO Configuration
MINIO_ENDPOINT = "your-minio-server:9100"
ACCESS_KEY = "minioadmin"
SECRET_KEY = "minioadmin"
BUCKET_NAME = "submissions"

minio_client = minio.Minio(
    MINIO_ENDPOINT,
    access_key=ACCESS_KEY,
    secret_key=SECRET_KEY,
    secure=False
)

# Ensure the bucket exists
if not minio_client.bucket_exists(BUCKET_NAME):
    minio_client.make_bucket(BUCKET_NAME)


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
        response = analyze_docx(file_path)
    elif file_extension in ["png", "jpg", "jpeg"]:
        response = analyze_image(file_path)
    elif file_extension in ["pdf"]:
        response = analyze_pdf(file_path)
    elif file_extension in ["ppt", "pptx"]:
        response = analyze_ppt(file_path)
    else:
        return jsonify({"error": "Unsupported file type"}), 400

    # Save extracted data to MinIO
    minio_filename = f"processed_{filename}.json"
    save_to_minio(minio_filename, response)

    return jsonify(response)


if __name__ == "__main__":
    app.run(debug=True)
