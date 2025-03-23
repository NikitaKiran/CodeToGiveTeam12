import base64
import json
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

#API Key for OpenRouter
API_KEY = "REPLACE_WITH_YOUR_API_KEY"

#Function to convert an image file to Base64 Data URL
def get_image(image_path: str) -> str:
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode("utf-8")
        return f"data:image/jpeg;base64,{base64_image}"

@app.route("/analyze_image", methods=["POST"])
def analyze_image():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files["image"]
    image_path = f"./{image_file.filename}"
    image_file.save(image_path)  #Save the uploaded file locally

    image_data_url = get_image(image_path)

    #Customisable prompt for image analysis
    TEXT = "What's in this image? Don't include any information irrelevant to the main content."

    #Send request to OpenRouter API
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        data=json.dumps({
            "model": "mistralai/mistral-small-3.1-24b-instruct:free",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": TEXT},
                        {"type": "image_url", "image_url": {"url": image_data_url}},
                    ],
                }
            ],
        }),
    )

    try:
        result = response.json()
        message = result["choices"][0]["message"]["content"]
        return jsonify({"message": message})
        #return jsonify(result)
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid response from OpenRouter"}), 500

if __name__ == "__main__":
    app.run(debug=True)
