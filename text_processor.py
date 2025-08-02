# text_processor.py (NEW FILE/MODIFIED from pdf_processor.py)
import re
import os


def extract_paragraphs_from_txt(txt_path):
    """
    Extracts text from a .txt file and attempts to split it into paragraphs.
    A paragraph is defined as text separated by two or more newlines.
    """
    paragraphs = []
    try:
        with open(txt_path, 'r', encoding='utf-8') as file:
            content = file.read()
            # Split by two or more newlines, which typically denotes a paragraph break
            # re.split will correctly handle various newline combinations (\n, \r\n, \r)
            # and consecutive empty lines.
            # Split by 2+ newlines with optional whitespace
            raw_paragraphs = re.split(r'\n\s*\n+', content)

            for para in raw_paragraphs:
                cleaned_para = para.strip()
                # Further filter out very short or empty strings that might result from splitting
                if len(cleaned_para.split()) > 10:  # Only add if it has more than 10 words
                    paragraphs.append(cleaned_para)
    except FileNotFoundError:
        print(f"Error: Text file not found at {txt_path}")
    except Exception as e:
        print(f"An error occurred during text processing: {e}")
    return paragraphs


if __name__ == '__main__':
    # Make sure you place your text file named '1000_paragraphs.txt' in the same directory
    txt_file = '1000_paragraphs.txt'
    if not os.path.exists(txt_file):
        print(
            f"Please place your text file '{txt_file}' in the same directory as text_processor.py.")
        print("Exiting. You need to create '1000_paragraphs.txt' first.")
    else:
        print(f"Extracting paragraphs from {txt_file}...")
        extracted_paragraphs = extract_paragraphs_from_txt(txt_file)
        print(f"Found {len(extracted_paragraphs)} paragraphs.")
        if extracted_paragraphs:
            print("\n--- First 3 Paragraphs ---")
            for i, p in enumerate(extracted_paragraphs[:3]):
                print(f"Paragraph {i+1}:\n{p}\n")
            print("--------------------------")
        else:
            print("No substantial paragraphs extracted. Check text file content or extraction logic.")
