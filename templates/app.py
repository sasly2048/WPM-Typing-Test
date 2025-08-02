# app.py (NO CHANGES NEEDED)
from flask import Flask, render_template, jsonify
from database import init_db, get_random_paragraph, count_paragraphs
import os

app = Flask(__name__)

with app.app_context():
    init_db()


@app.route('/')
def index():
    if count_paragraphs() == 0:
        return "No paragraphs available. Please ensure '1000_paragraphs.txt' exists and run 'python database.py' once to populate the database.", 500
    return render_template('index.html')


@app.route('/get_text')
def get_text():
    paragraph = get_random_paragraph()
    return jsonify({'text': paragraph})


if __name__ == '__main__':
    app.run(debug=True)
