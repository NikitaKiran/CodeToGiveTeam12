import os
import json
import base64
import requests

# Update your API key for OpenRouter here
API_KEY = "REPLACE-WITH-YOUR-API-KEY"

def get_image(image_path: str) -> str:
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode("utf-8")
        return f"data:image/jpeg;base64,{base64_image}"

def analyze_image_file(image_path):
    # Convert image file to Base64 Data URL
    image_data_url = get_image(image_path)
    os.remove(image_path)  # Remove temporary saved image

    TEXT = "What's in this image? Don't include any information irrelevant to the main content."

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
    except json.JSONDecodeError:
        message = "Error processing this image."

    return {"extracted_text": [message]}
