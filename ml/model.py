from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process_submission():
    file = request.files['file']
    criteria = request.form.get('criteria')

    # ML model logic (placeholder)
    score = 8.5
    summary = "This is a well-structured submission."
    pros = "Clear problem statement, strong technical solution."
    cons = "Limited scalability."

    # Send back the results
    return jsonify({
        'score': score,
        'summary': summary,
        'pros': pros,
        'cons': cons
    })

if __name__ == '__main__':
    app.run(port=5001)
