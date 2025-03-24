import os
import io
import cv2
import base64
import json
import tempfile
import numpy as np
import requests
from flask import Flask, request, jsonify
from skimage.metrics import structural_similarity as ssim
from moviepy.video.io.VideoFileClip import VideoFileClip
from faster_whisper import WhisperModel

app = Flask(__name__)

API_KEY = "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"

def frame_to_base64(frame):
    _, buffer = cv2.imencode('.jpg', frame)
    base64_image = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{base64_image}"

def get_image_description(image_data_url):
    TEXT = "Describe this frame in detail."
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
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error in image description: {e}"

@app.route("/evaluate_video", methods=["POST"])
def evaluate_video():
    print("Received video analysis request")
    if "video" not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    video_file = request.files["video"]

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
        video_file.save(temp_video.name)
        video_path = temp_video.name

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * 2)  # every 2 seconds

    prev_gray = None
    ssim_threshold = 0.8
    keyframe_descriptions = []

    frame_num = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_num % frame_interval == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            if prev_gray is None:
                image_data_url = frame_to_base64(frame)
                desc = get_image_description(image_data_url)
                keyframe_descriptions.append(desc)
                prev_gray = gray
            else:
                score, _ = ssim(prev_gray, gray, full=True)
                if score < ssim_threshold:
                    image_data_url = frame_to_base64(frame)
                    desc = get_image_description(image_data_url)
                    keyframe_descriptions.append(desc)
                    prev_gray = gray
        frame_num += 1

    cap.release()

    # Whisper Audio Transcription
    video_clip = VideoFileClip(video_path)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
        video_clip.audio.write_audiofile(temp_audio.name, logger=None)
        temp_audio_path = temp_audio.name

    model = WhisperModel("medium")
    result, _ = model.transcribe(temp_audio_path)
    transcription = " ".join([segment.text for segment in result])
    os.remove(temp_audio_path)
    os.remove(video_path)

    return jsonify({
        "keyframe_descriptions": keyframe_descriptions,
        "audio_transcription": transcription
    })

if __name__ == "__main__":
    app.run(debug=True)
