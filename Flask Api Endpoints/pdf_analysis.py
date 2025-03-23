import base64
import json
import requests
import os
from flask import Flask, request, jsonify
from pdf2image import convert_from_path

app = Flask(__name__)

#API Key for OpenRouter
API_KEY = "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"

#Function to convert a PDF page to Base64 Image URL
def convert_pdf_to_images(pdf_path):
    images = convert_from_path(pdf_path)  #Convert all pages to images
    image_data_urls = []

    for i, image in enumerate(images):
        image_path = f"temp_page_{i + 1}.png"
        image.save(image_path, "PNG")  #Save image temporarily

        #Convert to Base64
        with open(image_path, "rb") as img_file:
            base64_image = base64.b64encode(img_file.read()).decode("utf-8")
            image_data_urls.append(f"data:image/png;base64,{base64_image}")

        os.remove(image_path)  #Cleanup temporary image

    return image_data_urls

@app.route("/analyze_pdf", methods=["POST"])
def analyze_pdf():
    if "pdf" not in request.files:
        return jsonify({"error": "No PDF file provided"}), 400

    pdf_file = request.files["pdf"]
    pdf_path = f"./{pdf_file.filename}"
    pdf_file.save(pdf_path)  #Save uploaded PDF

    # Convert PDF to images
    image_data_urls = convert_pdf_to_images(pdf_path)
    os.remove(pdf_path)  # Cleanup PDF after conversion

    # Customisable prompt
    TEXT = "Extract all the details in this page line by line if it is text and and describe images if any in detail. Don't include any information irrelevant to the main page content."

    responses = []

    for image_data_url in image_data_urls:
        #Send request to OpenRouter AI for each page
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
