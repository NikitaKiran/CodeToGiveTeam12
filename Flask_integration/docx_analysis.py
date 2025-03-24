import os
import json
import base64
import subprocess
import requests
from pdf2image import convert_from_path

# Update your API key for OpenRouter here
API_KEY = "REPLACE-WITH-YOUR-API-KEY"

def convert_docx_to_pdf(docx_path, pdf_path):
    subprocess.run(["unoconv", "-f", "pdf", "-o", pdf_path, docx_path], check=True)

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

def analyze_docx_file(docx_path):
    pdf_path = docx_path.replace(".docx", ".pdf").replace(".doc", ".pdf")
    # Convert DOCX to PDF
    convert_docx_to_pdf(docx_path, pdf_path)

    # Convert PDF pages to images
    image_data_urls = convert_pdf_to_images(pdf_path)

    # Clean up the temporary files
    os.remove(docx_path)
    os.remove(pdf_path)

    TEXT = ("Extract all details in this page line by line if it is text, "
            "and describe images if any in detail. Don't include any information irrelevant to the main content.")

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

    return {"extracted_text": responses}
