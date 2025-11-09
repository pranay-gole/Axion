import sqlite3

conn = sqlite3.connect("database/usersdata.db")
c = conn.cursor()

# Add new columns safely (ignore if already added)
columns = ["avatar", "bio", "dob", "exp"]
for col in columns:
    try:
        if col == "exp":
            c.execute(f"ALTER TABLE users ADD COLUMN {col} INTEGER DEFAULT 0;")
        else:
            c.execute(f"ALTER TABLE users ADD COLUMN {col} TEXT DEFAULT '';")
        print(f"✅ Added column '{col}' successfully.")
    except sqlite3.OperationalError:
        print(f"ℹ️ Column '{col}' already exists, skipping...")

conn.commit()
conn.close()

print("\n✅ Database structure is up to date!")
