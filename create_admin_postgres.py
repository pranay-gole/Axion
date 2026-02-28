import psycopg
import os
from werkzeug.security import generate_password_hash

DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

conn = psycopg.connect(DATABASE_URL, sslmode="require")
cur = conn.cursor()

username = "admin"
password = generate_password_hash("admin123")

cur.execute("""
INSERT INTO users (username, password, is_admin)
VALUES (%s, %s, %s)
ON CONFLICT (username) DO NOTHING
""", (username, password, 1))

conn.commit()
conn.close()

print("Admin created.")