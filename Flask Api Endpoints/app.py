import base64
import json
import requests
import random
import os
import subprocess
import io
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pdf2image import convert_from_path
from together import Together  # Ensure you have this module installed
from minio import Minio
import cv2, tempfile
from skimage.metrics import structural_similarity as ssim
from moviepy.video.io.VideoFileClip import VideoFileClip
from faster_whisper import WhisperModel

app = Flask(__name__)
CORS(app)

# --------------------------
# Configuration
# --------------------------
# OPENROUTER_API_KEY = "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"
OPENROUTER_API_KEY = "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"
TOGETHER_API_KEY = "094ad5f71e654a605fb914359d9cda2f11e66f55e00d8d9ffc416d90d11fd723"
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Initialize Together API client
together_client = Together(api_key=TOGETHER_API_KEY)

# Initialize Minio Client for local storage
minio_client = Minio(
    "localhost:9100",
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)
RESULTS_BUCKET = "results"
if not minio_client.bucket_exists(RESULTS_BUCKET):
    minio_client.make_bucket(RESULTS_BUCKET)

# --------------------------
# Helper Functions
# --------------------------
def convert_ppt_to_pdf(ppt_path, pdf_path):
    """Convert PPTX/PPT to PDF using unoconv (Linux)"""
    subprocess.run(["unoconv", "-f", "pdf", "-o", pdf_path, ppt_path], check=True)

def convert_docx_to_pdf(docx_path, pdf_path):
    """Convert DOCX/DOC to PDF using unoconv"""
    subprocess.run(["unoconv", "-f", "pdf", "-o", pdf_path, docx_path], check=True)

def convert_pdf_to_images(pdf_path):
    """Convert all pages of a PDF to a list of Base64-encoded PNG images."""
    images = convert_from_path(pdf_path)
    image_data_urls = []
    for i, image in enumerate(images):
        temp_image_path = f"temp_page_{i+1}.png"
        image.save(temp_image_path, "PNG")
        with open(temp_image_path, "rb") as img_file:
            base64_image = base64.b64encode(img_file.read()).decode("utf-8")
            image_data_urls.append(f"data:image/png;base64,{base64_image}")
        os.remove(temp_image_path)
    return image_data_urls

def get_image(image_path: str) -> str:
    """Convert an image file to a Base64-encoded Data URL."""
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode("utf-8")
    return f"data:image/jpeg;base64,{base64_image}"

def analyze_with_openrouter(prompt_text, image_data_url):
    """Call OpenRouter with a given prompt and image URL."""
    response = requests.post(
        url=OPENROUTER_API_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        data=json.dumps({
            "model": "mistralai/mistral-small-3.1-24b-instruct:free",
            "messages": [
                {"role": "user", "content": [
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": {"url": image_data_url}},
                ]}
            ],
        }),
    )
    try:
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error processing: {e}"

def store_result_in_minio(filename, data):
    """Store a JSON result in the Minio 'results' bucket."""
    json_data = json.dumps(data).encode("utf-8")
    minio_client.put_object(
        RESULTS_BUCKET,
        filename,
        io.BytesIO(json_data),
        length=len(json_data),
        content_type="application/json"
    )
def process_video_file(file_obj):
    """
    Process an uploaded video file:
      - Extract keyframe descriptions (using OpenRouter for frame analysis)
      - Perform audio transcription (using Whisper)
    Returns a dictionary with the results.
    """
    # Save the video file locally
    filename = file_obj.filename
    local_path = f"./{filename}"
    file_obj.save(local_path)

    

    # Helper: convert a frame to a base64-encoded JPEG data URL
    def frame_to_base64(frame):
        _, buffer = cv2.imencode('.jpg', frame)
        base64_image = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{base64_image}"

    # Helper: get a description of a frame by calling OpenRouter
    def get_image_description(image_data_url):
        TEXT = "Describe this frame in detail."
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
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

    # Open the video using OpenCV
    cap = cv2.VideoCapture(local_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * 2)  # process a frame every 2 seconds
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

    # --- Audio Transcription ---
    video_clip = VideoFileClip(local_path)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
        video_clip.audio.write_audiofile(temp_audio.name, logger=None)
        temp_audio_path = temp_audio.name

    model = WhisperModel("medium")
    result, _ = model.transcribe(temp_audio_path)
    transcription = " ".join([segment.text for segment in result])
    os.remove(temp_audio_path)
    os.remove(local_path)

    # Return the combined video analysis results
    return {
        "keyframe_descriptions": keyframe_descriptions,
        "audio_transcription": transcription
    }



def process_file(file_obj, file_type):
    """
    Process the uploaded file based on its type.
    Returns the extracted text (solution) as a single string.
    """
    # Save the file locally
    filename = file_obj.filename
    local_path = f"./{filename}"
    file_obj.save(local_path)
    extracted_texts = []  # to accumulate responses

    try:
        if file_type == "ppt":
            pdf_path = local_path.rsplit('.', 1)[0] + ".pdf"
            convert_ppt_to_pdf(local_path, pdf_path)
            os.remove(local_path)
            image_urls = convert_pdf_to_images(pdf_path)
            os.remove(pdf_path)
            prompt_text = ("Extract all the details in this slide line by line if it is text and describe what "
                           "the images show if any in detail. Don't include any information irrelevant to the main slide content.")
            for img_url in image_urls:
                extracted_texts.append(analyze_with_openrouter(prompt_text, img_url))
        elif file_type == "pdf":
            pdf_path = local_path
            image_urls = convert_pdf_to_images(pdf_path)
            os.remove(pdf_path)
            prompt_text = ("Extract all the details in this page line by line if it is text and describe images if any "
                           "in detail. Don't include any information irrelevant to the main page content.")
            for img_url in image_urls:
                extracted_texts.append(analyze_with_openrouter(prompt_text, img_url))
        elif file_type == "docx":
            pdf_path = local_path.rsplit('.', 1)[0] + ".pdf"
            convert_docx_to_pdf(local_path, pdf_path)
            os.remove(local_path)
            image_urls = convert_pdf_to_images(pdf_path)
            os.remove(pdf_path)
            prompt_text = ("Extract all details in this page line by line if text, and describe images if any in detail. "
                           "Don't include any information irrelevant to the main page content.")
            for img_url in image_urls:
                extracted_texts.append(analyze_with_openrouter(prompt_text, img_url))
        elif file_type == "image":
            image_path = local_path
            image_data_url = get_image(image_path)
            os.remove(image_path)
            prompt_text = ("What's in this image? Don't include any information irrelevant to the main content.")
            extracted_texts.append(analyze_with_openrouter(prompt_text, image_data_url))
        elif file_type == "video":
            # Process the video using the helper function
            result = process_video_file(file_obj)
            # Format the output similar to the other file types
            keyframes_text = "Keyframe Descriptions:\n" + "\n".join(result.get("keyframe_descriptions", []))
            audio_text = "Audio Transcription:\n" + result.get("audio_transcription", "")
            extracted_texts.append(keyframes_text)
            extracted_texts.append(audio_text)
        else:
            return None, f"Unsupported file type: {file_type}"
    except Exception as e:
        return None, f"Error processing file: {e}"

    # Join multiple responses (if any) into a single string
    solution_text = "\n".join(extracted_texts)
    return solution_text, None

def evaluate_submission_logic(solution, theme, criteria):
    """
    Calls the evaluation logic using the Together API.
    Returns the parsed evaluation result.
    """
    # def create_criteria_string(criteria):
    #     count = 1
    #     criteria_string = ""
    #     for key, value in criteria.items():
    #         criteria_string += f"{count}) {key}: {value}\n"
    #         count += 1
    #     return criteria_string
    def create_criteria_string(criteria):
        count = 1
        criteria_string = ""
        # Check if criteria is a dict
        if isinstance(criteria, dict):
            for key, value in criteria.items():
                criteria_string += f"{count}) {key}: {value}\n"
                count += 1
        # If criteria is a list, assume each element is either a string or a dict
        elif isinstance(criteria, list):
            for crit in criteria:
                if isinstance(crit, dict):
                    # For each key-value pair in the dict element, append it
                    for key, value in crit.items():
                        criteria_string += f"{count}) {key}: {value}\n"
                        count += 1
                else:
                    # Otherwise, just use the element's string representation
                    criteria_string += f"{count}) {crit}\n"
                    count += 1
        else:
            # Fallback to just converting criteria to a string
            criteria_string = str(criteria)
        return criteria_string

    criteria_string = create_criteria_string(criteria)
    prompt = f'''You are an expert evaluator for hackathon submissions.
The theme of the hackathon is {theme}. You need to judge based on the following criteria: {criteria_string}.
Return the evaluation result in this format: [Tags: (main keywords from the solution), Summary of the main aspects of the solution: , Pros of solution: [pro1, pro2...] , Cons of solution: [con1, con2...] , Score for <criteria1>:[x/10, justification with examples], Score for <criteria2>:[y/10, justification with examples]].
The solution is {solution}'''

    response = together_client.chat.completions.create(
        model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        messages=[{"role": "user", "content": prompt}],
    )
    ans = response.choices[0].message.content

    # def parse_ans(ans):
    #     tags = ans.split("Tags: (")[1].split(")")[0].split(',')
    #     cleaned_tags = [tag.strip() for tag in tags]
    #     summary = ans.split("Summary of the main aspects of the solution: ")[1].split("Pros of solution: ")[0]
    #     pros = ans.split("Pros of solution: ")[1].split("Cons of solution: ")[0]
    #     cons = ans.split("Cons of solution: ")[1].split("Score for ")[0]
    #     scores = ans.split("Score for ")[1:]
    #     score_dict = {}
    #     for score in scores:
    #         key = score.split(":")[0]
    #         value = score.split(":", 1)[1]
    #         score_dict[key.strip()] = value.strip()
    #     return cleaned_tags, summary, pros, cons, score_dict

    def parse_ans(ans):
        try:
            # Remove the square brackets at the start and end
            ans = ans.strip('[]')
            
            # Get tags
            tags_line = ans.split("Tags: ")[1].split("\n")[0]
            tags_line = tags_line.strip('()')
            tags = [tag.strip() for tag in tags_line.split(',')]
            tags = [tag.strip(')') for tag in tags]
            
            # Get summary
            summary = ans.split("Summary of the main aspects of the solution: ")[1].split("\n")[0].strip(" .")
            
            # Get pros
            pros_line = ans.split("Pros of solution: ")[1].split("\n")[0].strip()
            pros = pros_line.strip('[]').split(',')
            
            # Get cons
            cons_line = ans.split("Cons of solution: ")[1].split("\n")[0].strip()
            cons = cons_line.strip('[]').split(',')
            
            # Parse scores
            scores_section = ans.split("Score for ")[1:]
            score_dict = {}
            for score in scores_section:
                # Split on first colon to separate key and value
                key = score.split(":")[0].strip()
                # Remove newline and trailing comma
                value_str = score.split(":", 1)[1].split("\n")[0].strip(" ,")
                # Evaluate the value
                score_dict[key] = value_str.strip('[]').split(',', 1)
            
            return tags, summary, pros, cons, score_dict

        except Exception as e:
            raise Exception(f"Error parsing AI response: {str(e)}")

    try:
        tags, summary, pros, cons, score_dict = parse_ans(ans)
    except Exception as e:
        return None, f"Error parsing AI response: {e}", ans

    result_json = {
        "tags": tags,
        "summary": summary.strip(),
        "pros": pros,
        "cons": cons,
        "scores": score_dict
    }
    return result_json, None, None

# --------------------------
# Endpoints
# --------------------------
# Existing analysis endpoints (kept for direct testing)
@app.route("/analyze_ppt", methods=["POST"])
def analyze_ppt():
    if "ppt" not in request.files:
        return jsonify({"error": "No PPT file provided"}), 400

    solution, err = process_file(request.files["ppt"], "ppt")
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"extracted_text": solution})

@app.route("/analyze_pdf", methods=["POST"])
def analyze_pdf():
    if "pdf" not in request.files:
        return jsonify({"error": "No PDF file provided"}), 400

    solution, err = process_file(request.files["pdf"], "pdf")
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"extracted_text": solution})

@app.route("/analyze_docx", methods=["POST"])
def analyze_docx():
    if "docx" not in request.files:
        return jsonify({"error": "No DOCX file provided"}), 400

    solution, err = process_file(request.files["docx"], "docx")
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"extracted_text": solution})

@app.route("/analyze_image", methods=["POST"])
def analyze_image():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    solution, err = process_file(request.files["image"], "image")
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"extracted_text": solution})

# # New endpoint that ties together file analysis and evaluation
# @app.route("/submit", methods=["POST"])
# def submit():
#     # Expecting:
#     #   - a file in request.files with key "file"
#     #   - form field "fileType" (one of: ppt, pdf, docx, image)
#     #   - form fields "theme" and "criteria" (criteria as a JSON string)
#     print('HIIIII')
#     if "file" not in request.files:
#         return jsonify({"error": "No file provided"}), 400
#     file_obj = request.files["file"]

#     file_type = request.form.get("fileType")
#     theme = request.form.get("theme")
#     criteria_str = request.form.get("criteria")
#     if not file_type or not theme or not criteria_str:
#         return jsonify({"error": "Missing required fields: fileType, theme, or criteria"}), 400
#     try:
#         criteria = json.loads(criteria_str)
#     except Exception as e:
#         return jsonify({"error": "Invalid criteria JSON", "details": str(e)}), 400

#     # Process the file based on type and extract text
#     solution_text, err = process_file(file_obj, file_type)
#     if err:
#         return jsonify({"error": err}), 500

#     # Call evaluation logic using the extracted text as the solution
#     eval_result, eval_err, raw_response = evaluate_submission_logic(solution_text, theme, criteria)
#     if eval_err:
#         return jsonify({"error": eval_err, "raw_response": raw_response}), 500

#     # Store the evaluation result in Minio
#     name_without_ext = os.path.splitext(file_obj.filename)[0]
#     file_name = f"evaluation_{name_without_ext}.json"
#     result_bytes = json.dumps(eval_result).encode("utf-8")
#     try:
#         minio_client.put_object(
#             RESULTS_BUCKET,
#             file_name,
#             data=io.BytesIO(result_bytes),
#             length=len(result_bytes),
#             content_type="application/json"
#         )
#     except Exception as e:
#         return jsonify({"error": "Failed to store result in Minio", "details": str(e)}), 500

#     return jsonify(eval_result)

@app.route("/submit", methods=["POST"])
def submit():
    # Expecting:
    # - a file in request.files with key "file"
    # - form field "fileType" (one of: ppt, pdf, docx, image)
    # - form fields "theme" and "criteria" (criteria as a JSON string)
    # - optional: teamName 
    
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file_obj = request.files["file"]
    file_type = request.form.get("fileType")
    theme = request.form.get("theme")
    criteria_str = request.form.get("criteria")
    criteria_dict = {}
    if criteria_str:
          # Ensure it's not None
        criteria_dict = json.loads(criteria_str)
    team_name = file_obj.filename.split('_')[0]
    hackathon_id = request.form.get("hackathonId")

    
    if not file_type or not theme or not criteria_str:
        return jsonify({"error": "Missing required fields: fileType, theme, or criteria"}), 400
    print(criteria_dict)
    try:
        criteria = json.loads(criteria_str)
    except Exception as e:
        return jsonify({"error": "Invalid criteria JSON", "details": str(e)}), 400
    
    # Process the file based on type and extract text
    solution_text, err = process_file(file_obj, file_type)
    if err:
        return jsonify({"error": err}), 500
    
    # Call evaluation logic using the extracted text as the solution
    eval_result, eval_err, raw_response = evaluate_submission_logic(solution_text, theme, criteria)
    if eval_err:
        return jsonify({"error": eval_err, "raw_response": raw_response}), 500
    
    
    # Construct the new JSON structure
    submission_data = {
        "hackathonId": hackathon_id,
        "teamName": team_name,
        "originalFile": file_obj.filename,
        "fileType": file_type,
        "justification": {},  # This can be populated from eval_result
        "criteriaScores": {},
        "oldCriteriaScores": {},  # Optional: you might want to implement a way to track previous scores
        "summary": eval_result.get('summary', ''),
        "keywords": eval_result.get('tags', []),
        "strengths": eval_result.get('pros', ''),
        "weaknesses": eval_result.get('cons', ''),
        "processed": True,
        "evaluated": True,
        "id": random.randint(1000, 9999),
        "score": 0
    }
    
    # Populate criteriaScores and justification
    if eval_result.get('scores'):
        for criterion, score_info in eval_result['scores'].items():
           
                submission_data['criteriaScores'][criterion] = int(score_info[0].split('/')[0])
                submission_data['justification'][criterion] = score_info[1]
          
    score = 0
    for c in criteria_dict:
        category = c['name']
        score += submission_data['criteriaScores'][category] * c['weightage']
    submission_data['score'] = score//10
    name_without_ext = os.path.splitext(file_obj.filename)[0]
    file_name = f"submission_{name_without_ext}_{submission_data['hackathonId']}.json"
    result_bytes = json.dumps(submission_data).encode("utf-8")
    
    try:
        minio_client.put_object(
            RESULTS_BUCKET,
            file_name,
            data=io.BytesIO(result_bytes),
            length=len(result_bytes),
            content_type="application/json"
        )
    except Exception as e:
        return jsonify({"error": "Failed to store result in Minio", "details": str(e)}), 500
    
    return jsonify(submission_data)


# --------------------------
# Run the Application
# --------------------------
if __name__ == "__main__":
    app.run(debug=True)
