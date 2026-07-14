import sqlite3
import uuid
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from dotenv import load_dotenv

def generate_rsa_keys():
    print("Generating RSA keys...")
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(env_path)
    
    if os.getenv("JWT_PRIVATE_KEY"):
        print("RSA keys already exist in .env. Skipping.")
        return

    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')

    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')

    # We replace newlines with \n for .env
    priv_str = private_pem.replace('\n', '\\n')
    pub_str = public_pem.replace('\n', '\\n')
    
    with open(env_path, 'a') as f:
        f.write(f'\nJWT_PRIVATE_KEY="{priv_str}"\n')
        f.write(f'JWT_PUBLIC_KEY="{pub_str}"\n')
    print("RSA keys added to .env")

def encrypt_user_data():
    print("Encrypting existing user PII...")
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(env_path)
    secret_key = os.getenv("SECRET_KEY", "")
    if not secret_key:
        print("No SECRET_KEY found in .env, skipping encryption.")
        return
        
    key_bytes = secret_key.encode('utf-8')
    padded_key = key_bytes.ljust(32, b'0')[:32]
    url_safe_key = base64.urlsafe_b64encode(padded_key)
    f = Fernet(url_safe_key)
    
    db_path = os.path.join(os.path.dirname(__file__), 'elektra.db')
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, province, cooperative FROM users")
    users = cursor.fetchall()
    
    for user_id, province, cooperative in users:
        new_prov = province
        new_coop = cooperative
        
        if province and not province.startswith('gAAAAA'):
            new_prov = f.encrypt(province.encode('utf-8')).decode('utf-8')
        if cooperative and not cooperative.startswith('gAAAAA'):
            new_coop = f.encrypt(cooperative.encode('utf-8')).decode('utf-8')
            
        cursor.execute(
            "UPDATE users SET province = ?, cooperative = ? WHERE id = ?",
            (new_prov, new_coop, user_id)
        )
    conn.commit()
    conn.close()
    print("Encryption complete.")

def migrate_schema():
    print("Migrating schema...")
    db_path = os.path.join(os.path.dirname(__file__), 'elektra.db')
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Add columns if not exist
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN public_id VARCHAR(36)")
        cursor.execute("ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user'")
    except sqlite3.OperationalError as e:
        print(f"User columns may already exist: {e}")

    try:
        cursor.execute("ALTER TABLE bills ADD COLUMN public_id VARCHAR(36)")
    except sqlite3.OperationalError as e:
        print(f"Bill columns may already exist: {e}")

    # Generate UUIDs
    cursor.execute("SELECT id, public_id FROM users")
    for user_id, pub_id in cursor.fetchall():
        if not pub_id:
            cursor.execute("UPDATE users SET public_id = ?, role = 'user', token_version = 0 WHERE id = ?", (str(uuid.uuid4()), user_id))

    cursor.execute("SELECT id, public_id FROM bills")
    for bill_id, pub_id in cursor.fetchall():
        if not pub_id:
            cursor.execute("UPDATE bills SET public_id = ? WHERE id = ?", (str(uuid.uuid4()), bill_id))

    conn.commit()
    conn.close()
    print("Schema migration complete.")

if __name__ == "__main__":
    generate_rsa_keys()
    migrate_schema()
    encrypt_user_data()
    print("All migrations finished successfully.")
