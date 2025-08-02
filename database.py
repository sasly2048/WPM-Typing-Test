# database.py (MODIFIED to use text_processor.py)
import sqlite3
import random
import time

DATABASE_NAME = 'wpm_paragraphs.db'
RECENT_THRESHOLD_SECONDS = 3600 * 24 * 7  # 1 week, adjust as needed to define "recent"


def init_db():
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS paragraphs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL UNIQUE,
            last_used_timestamp REAL DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()


def insert_paragraphs(paragraphs):
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    for para in paragraphs:
        cursor.execute("INSERT OR IGNORE INTO paragraphs (content) VALUES (?)", (para,))
    conn.commit()
    conn.close()
    print(f"Attempted to insert {len(paragraphs)} paragraphs. Duplicates ignored.")


def get_random_paragraph():
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()

    cursor.execute(f'''
        SELECT content, id FROM paragraphs
        WHERE last_used_timestamp < ?
        ORDER BY last_used_timestamp ASC, RANDOM() LIMIT 1
    ''', (time.time() - RECENT_THRESHOLD_SECONDS,))

    paragraph_data = cursor.fetchone()

    if paragraph_data:
        paragraph_content, paragraph_id = paragraph_data
        cursor.execute("UPDATE paragraphs SET last_used_timestamp = ? WHERE id = ?",
                       (time.time(), paragraph_id))
        conn.commit()
        conn.close()
        return paragraph_content
    else:
        print("All paragraphs used recently. Picking a random one regardless of recency.")
        cursor.execute("SELECT content, id FROM paragraphs ORDER BY RANDOM() LIMIT 1")
        paragraph_data = cursor.fetchone()
        if paragraph_data:
            paragraph_content, paragraph_id = paragraph_data
            cursor.execute("UPDATE paragraphs SET last_used_timestamp = ? WHERE id = ?",
                           (time.time(), paragraph_id))
            conn.commit()
            conn.close()
            return paragraph_content
        else:
            conn.close()
            return "No paragraphs available in the database. Please process a text file."


def count_paragraphs():
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM paragraphs")
    count = cursor.fetchone()[0]
    conn.close()
    return count


if __name__ == '__main__':
    from text_processor import extract_paragraphs_from_txt  # CHANGED IMPORT
    import os

    init_db()
    print("Database initialized.")

    txt_file_path = '1000_paragraphs.txt'  # CHANGED FILE NAME
    if os.path.exists(txt_file_path):
        current_paragraph_count = count_paragraphs()
        if current_paragraph_count == 0:
            print(f"No paragraphs in DB. Extracting from {txt_file_path} and inserting...")
            extracted_paras = extract_paragraphs_from_txt(txt_file_path)  # CHANGED FUNCTION CALL
            if extracted_paras:
                insert_paragraphs(extracted_paras)
                print(f"Inserted {len(extracted_paras)} new paragraphs from TXT.")
            else:
                print("No paragraphs extracted from TXT to insert.")
        else:
            print(f"Database already contains {current_paragraph_count} paragraphs.")
            print("To re-populate or update, delete 'wpm_paragraphs.db' and re-run.")

    print(f"Random paragraph: {get_random_paragraph()}")
