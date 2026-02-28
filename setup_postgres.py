import psycopg
import os

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE_URL not set")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

conn = psycopg.connect(DATABASE_URL, sslmode="require")
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT,
    email TEXT,
    avatar TEXT,
    bio TEXT,
    dob TEXT,
    exp INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0
);
""")

conn.commit()
conn.close()

print("PostgreSQL setup completed successfully.")