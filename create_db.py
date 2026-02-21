import sqlite3

conn = sqlite3.connect("database/usersdata.db")
c = conn.cursor()

# Modify your table to add new columns if they don’t exist
try:
    c.execute("ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''")
except:
    pass

try:
    c.execute("ALTER TABLE users ADD COLUMN dob TEXT DEFAULT ''")
except:
    pass

try:
    c.execute("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''")
except:
    pass

try:
    c.execute("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT 'avatar1.png'")
except:
    pass

try:
    c.execute("ALTER TABLE users ADD COLUMN exp INTEGER DEFAULT 0")
except:
    pass

conn.commit()
conn.close()

print("✅ User table updated with missing columns (if any).")
