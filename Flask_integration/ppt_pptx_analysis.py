import os
import json
import base64
import requests
import subprocess
from flask import jsonify
from pdf2image import convert_from_path

# Update your API key for OpenRouter here
API_KEY = "REPLACE-WITH-YOUR-API-KEY"

def convert_ppt_to_pdf(ppt_path, pdf_path):
    subprocess.run(["unoconv", "-f", "pdf", "-o", pdf_path, ppt_path], check=True)

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

def analyze_ppt_file(ppt_path):
    pdf_path = ppt_path.replace(".pptx", ".pdf").replace(".ppt", ".pdf")
    # Convert PPT/PPTX to PDF
    convert_ppt_to_pdf(ppt_path, pdf_path)
    os.remove(ppt_path)  # Cleanup the PPT/PPTX file

    # Convert PDF pages to images
    image_data_urls = convert_pdf_to_images(pdf_path)
    os.remove(pdf_path)  # Cleanup the PDF file

    TEXT = ("Extract all the details in this slide line by line if it is text "
            "and describe what the images show if any in detail. Don't include any information irrelevant to the main content.")

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
            responses.append("Error processing this slide.")

    return {"extracted_text": responses}
