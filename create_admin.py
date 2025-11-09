import sqlite3
from werkzeug.security import generate_password_hash

# ✅ Define multiple admin accounts here
ADMINS = [
    {"username": "Pranay", "password": "BANKAI"},
    {"username": "Arjun", "password": "Arjun28"},
]

# ✅ Connect to your database
conn = sqlite3.connect("database/usersdata.db")
c = conn.cursor()

for admin in ADMINS:
    username = admin["username"]
    password = admin["password"]
    hashed = generate_password_hash(password)

    # Check if user exists
    c.execute("SELECT * FROM users WHERE username=?", (username,))
    row = c.fetchone()

    if row:
        c.execute("UPDATE users SET password=?, is_admin=1 WHERE username=?", (hashed, username))
        print(f"✅ Updated existing admin: {username}")
    else:
        c.execute("INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)", (username, hashed))
        print(f"✅ Created new admin: {username}")

conn.commit()
conn.close()

print("\nAll admin accounts are ready! 🚀")
