import sqlite3

# Connect to your existing database
conn = sqlite3.connect("database/usersdata.db")
c = conn.cursor()

# Add admin column if not already there
try:
    c.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0")
except:
    pass

conn.commit()
conn.close()

print("✅ Database updated — added 'is_admin' column if it was missing.")
