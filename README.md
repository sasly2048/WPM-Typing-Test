# WPM Typing Test Application

This is a simple web-based Words Per Minute (WPM) typing test application. It allows users to practice their typing by presenting paragraphs of text and calculating their WPM and accuracy. The application uses Flask for the backend, SQLite for paragraph storage, and a combination of HTML, CSS, and JavaScript for the frontend.

# Features

- **Typing Test:** Users can start a typing test with a randomly selected paragraph.

- **WPM Calculation:** Dynamically calculates Words Per Minute as the user types.

- **Accuracy Tracking:** Shows the user's typing accuracy in real-time.

- **Time Limit:** The test has a 5-minute time limit.

- **Character Highlighting:** Provides visual feedback by highlighting correct, incorrect, and the current character  to be typed.

- **Paragraph Management:** Stores paragraphs in an SQLite database and fetches them, prioritizing less recently used ones to provide variety.

- **Responsive Design:** Adapts to different screen sizes for a good user experience on various devices.



# Project Structure :

The project is organized into the following files:

***app.py:*** The main Flask application that serves the web pages and handles API requests for text.

***database.py:*** Manages the SQLite database, including initialization, inserting paragraphs, and retrieving random paragraphs.

***text_processor.py:*** A utility script to extract paragraphs from a plain text file for database population.

***index.html:*** The main HTML file for the typing test user interface.

static/
***style.css:*** Contains all the CSS rules for styling the application.

***script.js:*** Contains the JavaScript logic for the typing test functionality, including WPM calculation, accuracy, timer, and character highlighting.

***wpm_paragraphs.db:*** The SQLite database file (will be created automatically if it doesn't exist upon running database.py or app.py).

***1000_paragraphs.txt:*** A placeholder text file that you need to create and populate with paragraphs. This file will be used by database.py to initially fill the wpm_paragraphs.db.
