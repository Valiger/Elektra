import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), 'elektra.db')
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE bills ADD COLUMN custom_fields_json TEXT")
        conn.commit()
        print("Successfully added custom_fields_json to bills table")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
