from flask import Flask, request, jsonify
from together import Together

app = Flask(__name__)

# Initialize Together API client
client = Together(api_key="API_KEY")

@app.route("/evaluate_submission", methods=["POST"])
def evaluate_hackathon():
    data = request.get_json()

    # Expecting 'theme', 'solution', and 'criteria' from request body
    theme = data.get("theme")
    solution = data.get("solution")
    criteria = data.get("criteria")

    if not all([theme, solution, criteria]):
        return jsonify({"error": "Missing required fields: theme, solution, or criteria"}), 400

    def create_criteria_string(criteria):
        count = 1
        criteria_string = ""
        for key, value in criteria.items():
            criteria_string += f"{count}) {key}: {value}\n"
            count += 1
        return criteria_string

    criteria_string = create_criteria_string(criteria)

    prompt = f'''You are an evaluator for hackathon submissions.
The theme of the hackathon is {theme}. You need to judge based on the following criteria: {criteria_string}.
Return the evaluation result in this format: [Tags: (main keywords from the solution),Summary of the main aspects of the solution: , Pros of solution: , Cons of solution: , Score for <criteria1>:[score, justification with examples], Score for <criteria2>:[score, justification with examples]].
The solution is {solution}'''

    response = client.chat.completions.create(
        model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        messages=[{"role": "user", "content": prompt}],
    )

    ans = response.choices[0].message.content

    # Parsing function
    def parse_ans(ans):
        tags = ans.split("Tags: (")[1].split(")")[0].split(',')
        cleaned_tags = [tag.strip() for tag in tags]
        summary = ans.split("Summary of the main aspects of the solution: ")[1].split("Pros of solution: ")[0]
        pros = ans.split("Pros of solution: ")[1].split("Cons of solution: ")[0]
        cons = ans.split("Cons of solution: ")[1].split("Score for ")[0]
        scores = ans.split("Score for ")[1:]
        score_dict = {}
        for score in scores:
            key = score.split(":")[0]
            value = score.split(":")[1]
            score_dict[key] = value
        return cleaned_tags, summary, pros, cons, score_dict

    try:
        tags, summary, pros, cons, score_dict = parse_ans(ans)
    except Exception as e:
        return jsonify({"error": "Error parsing AI response", "details": str(e), "raw_response": ans}), 500

    return jsonify({
        "tags": tags,
        "summary": summary.strip(),
        "pros": pros.strip(),
        "cons": cons.strip(),
        "scores": score_dict
    })

if __name__ == "__main__":
    app.run(debug=True)


