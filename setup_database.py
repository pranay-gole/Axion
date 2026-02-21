import sqlite3
import os

# Create database folder if it doesn’t exist
os.makedirs("database", exist_ok=True)

# Connect to the DB file
conn = sqlite3.connect("database/usersdata.db")
c = conn.cursor()

# Create users table
c.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    avatar TEXT,
    bio TEXT,
    dob TEXT,
    exp INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0
)
""")

conn.commit()
conn.close()
print("✅ Database and users table created successfully!")
