import sqlite3

conn = sqlite3.connect("database/usersdata.db")
c = conn.cursor()

print("\nAll users in database:\n")
for row in c.execute("SELECT username, is_admin FROM users"):
    print(row)

conn.close()
