import base64
import json
import requests
import os
from flask import Flask, request, jsonify
from pdf2image import convert_from_path
import subprocess

app = Flask(__name__)

# API Key for OpenRouter
API_KEY = "REPLACE-WITH-YOUR-API-KEY"

def convert_ppt_to_pdf(ppt_path, pdf_path):
    """ Convert PPTX/PPT to PDF using unoconv (Linux) """
    subprocess.run(["unoconv", "-f", "pdf", "-o", pdf_path, ppt_path], check=True)

#Function to convert a PDF page to Base64 Image URL
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

@app.route("/analyze_ppt", methods=["POST"])
def analyze_ppt():
    if "ppt" not in request.files:
        return jsonify({"error": "No PPT file provided"}), 400

    ppt_file = request.files["ppt"]
    ppt_path = f"./{ppt_file.filename}"
    pdf_path = ppt_path.replace(".pptx", ".pdf").replace(".ppt", ".pdf")
    ppt_file.save(ppt_path)  
    convert_ppt_to_pdf(ppt_path, pdf_path)
    os.remove(ppt_path)  
    image_data_urls = convert_pdf_to_images(pdf_path)
    os.remove(pdf_path) 

    # Customizable prompt
    TEXT = "Extract all the details in this slide line by line if it is text and describe what the images show if any in detail. Don't include any information irrelevant to the main slide content."

    responses = []

    for image_data_url in image_data_urls:
        # Send request to OpenRouter AI for each slide
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
            responses.append("Error processing this slide.")

    return jsonify({"extracted_text": responses})

if __name__ == "__main__":
    app.run(debug=True)