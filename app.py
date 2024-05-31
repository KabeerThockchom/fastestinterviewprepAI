import PyPDF2
import os
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from groq import Groq
import openai 
from openai import OpenAI
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='./build', static_url_path='/')
CORS(app)

# app = Flask(__name__)
# CORS(app)

api_key=os.environ.get("api_key")

openai = Groq(
    api_key=api_key
,
)

@app.route('/')
def serve_react():
    return send_from_directory(app.static_folder, 'index.html')

def extract_text_from_url(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    text = soup.get_text()
    return text

def extract_text_from_pdf(file_path):
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
    return text

def generate_interview_questions(job_posting, api_key):
    response = openai.chat.completions.create(
        model="mixtral-8x7b-32768",
        messages=[
            {
                "role": "system",
                "content": """Generate 25 insightful, unique, and specific interview questions based on the job posting provided below. The questions should assess a candidate's qualifications, work ethic, and alignment with the company's values. Try to include a variety of question types, such as situational, behavioral, and skill-based questions.Return only the questions numbered and each question as a new line""" #For example, if the job posting mentions a requirement for strong teamwork skills, you might ask: "Can you describe a time when you had to collaborate with a team to overcome a challenge? What was your role, and what was the outcome?"."
            },
            {
                "role": "user",
                "content": job_posting
            }
        ],
        temperature=0.7,
        max_tokens=32768
    )
    return response.choices[0].message.content.strip().split('\n')

def generate_answer(question, resume, api_key):
    parsed_resume = ""
    for line in resume.split("\n"):
        line = line.strip()
        if line:
            parsed_resume += line + "\n"
    response = openai.chat.completions.create(
        model="mixtral-8x7b-32768",
        messages=[
            {
                "role": "system",
                "content": """Generate a detailed, personalized, and compelling answer for the interview question provided, drawing directly from the experiences, skills, and qualifications listed in the resume. Structure your response using the STAR (Situation, Task, Action, Result) format to provide clear and concise examples. For instance, if the question is about overcoming a challenge, focus on a specific situation from the resume, describe the task and action taken, and conclude with the result of those actions. Format your answer in readable paragraphs"""
            },
            {
                "role": "user",
                "content": f"Question: {question}\n\nResume: {parsed_resume}"
            }
        ],
        temperature=0.7,
        max_tokens=32768,
    )

    return response.choices[0].message.content.strip()

@app.route('/upload', methods=['POST'])
def upload_files():
    job_posting_file = request.files.get('job_posting')
    job_description = request.form.get('job_description')
    resume_file = request.files.get('resume')

    if job_posting_file:
        job_posting_path = os.path.join('uploads', job_posting_file.filename)
        os.makedirs('uploads', exist_ok=True)
        job_posting_file.save(job_posting_path)
        job_posting = extract_text_from_pdf(job_posting_path)
    elif job_description:
        job_posting = job_description
    else:
        return jsonify({"error": "Missing job posting file or description"}), 400

    if resume_file:
        resume_path = os.path.join('uploads', resume_file.filename)
        os.makedirs('uploads', exist_ok=True)
        resume_file.save(resume_path)
        resume = extract_text_from_pdf(resume_path)
        questions = generate_interview_questions(job_posting, api_key)
        return jsonify({"questions": questions, "resumeText": resume})
    else:
        return jsonify({"error": "Missing resume file"}), 400

@app.route('/generate-answer', methods=['POST'])
def generate_answer_route():
    data = request.json
    print("Received data:", data)
    question = data.get('question')
    resume = data.get('resume')

    if question and resume:
        answer = generate_answer(question, resume, api_key)
        return jsonify({"answer": answer})

    return jsonify({"error": "Missing question or resume"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)