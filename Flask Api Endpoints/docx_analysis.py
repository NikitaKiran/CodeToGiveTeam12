import base64
import json
import requests
import os
import subprocess
from flask import Flask, request, jsonify
from pdf2image import convert_from_path

app = Flask(__name__)

#API Key for OpenRouter
API_KEY = "REPLACE-WITH-YOUR-API-KEY"

#Function to convert DOCX to PDF
def convert_docx_to_pdf(docx_path, pdf_path):
    subprocess.run(["unoconv", "-f", "pdf", "-o", pdf_path, docx_path], check=True)

#Function to convert PDF pages to Base64 Image URLs
def convert_pdf_to_images(pdf_path):
    images = convert_from_path(pdf_path)
    image_data_urls = []

    for i, image in enumerate(images):
        image_path = f"temp_page_{i + 1}.png"
        image.save(image_path, "PNG")
        with open(image_path, "rb") as img_file:
            base64_image = base64.b64encode(img_file.read()).decode("utf-8")
            image_data_urls.append(f"data:image/png;base64,{base64_image}")

        os.remove(image_path)

    return image_data_urls

@app.route("/analyze_docx", methods=["POST"])
def analyze_docx():
    if "docx" not in request.files:
        return jsonify({"error": "No DOCX file provided"}), 400

    docx_file = request.files["docx"]
    docx_path = f"./{docx_file.filename}"
    pdf_path = docx_path.replace(".docx", ".pdf").replace(".doc", ".pdf")
    docx_file.save(docx_path)  
    convert_docx_to_pdf(docx_path, pdf_path)
    os.remove(docx_path)  
    image_data_urls = convert_pdf_to_images(pdf_path)
    os.remove(pdf_path) 
    TEXT = "Extract all details in this page line by line if text, and describe images if any in detail. Don't include any information irrelevant to the main page content."

    responses = []

    for image_data_url in image_data_urls:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            data=json.dumps({
                "model": "mistralai/mistral-small-3.1-24b-instruct:free",
                "messages": [
                    {"role": "user", "content": [
                        {"type": "text", "text": TEXT},
                        {"type": "image_url", "image_url": {"url": image_data_url}},
                    ]}
                ],
            }),
        )

        try:
            result = response.json()
            message = result["choices"][0]["message"]["content"]
            responses.append(message)
        except json.JSONDecodeError:
            responses.append("Error processing this page.")

    return jsonify({"extracted_text": responses})

if __name__ == "__main__":
    app.run(debug=True)