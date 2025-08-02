# ⌨️ WPM Typing Test Application 🚀

This is a simple web-based Words Per Minute (WPM) typing test application. It enables users to practice typing with randomly selected paragraphs, giving real-time feedback on speed and accuracy. The app is built with Flask (Python) on the backend, uses SQLite for paragraph storage, and serves a responsive interface with HTML, CSS, and JavaScript on the frontend.

## ✨ Features

- **Typing Test 📝:** Start a test with a randomly chosen paragraph to type.
- **WPM Calculation ⚡:** Real-time calculation of Words Per Minute as you type.
- **Accuracy Tracking 🎯:** Track and display typing accuracy dynamically.
- **Time Limit ⏰:** 5-minute countdown timer for each test.
- **Character Highlighting 🌈:** Visually highlights correct, incorrect, and current characters.
- **Paragraph Management 📚:** Paragraphs are fetched from an SQLite database, prioritizing those not recently used for more variety.
- **Responsive Design 📱:** Optimized for both desktop and mobile devices.

## 🗂️ Project Structure

The project is organized as follows:

- **app.py:** Main Flask application; serves pages and handles API requests.
- **database.py:** Handles SQLite database functions—initialization, adding, and fetching paragraphs.
- **text_processor.py:** A utility to extract paragraphs from text files for database population.
- **index.html:** Main user interface for the typing test.
- **static/**
  - **style.css:** All styling rules for the application.
  - **script.js:** Core JavaScript for WPM calculation, accuracy, timer, and highlights.
- **wpm_paragraphs.db:** SQLite database file (auto-generated on first use).
- **1000_paragraphs.txt:** (You provide this) Source file for populating the database.

Start typing, track your speed, and improve your accuracy—one paragraph at a time! 🚀🔡


