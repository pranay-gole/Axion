from flask import Flask, render_template, request, redirect, url_for, session
import psycopg
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "fallback_dev_key")
app.permanent_session_lifetime = timedelta(days=7)

def get_db_connection():
    DATABASE_URL = os.environ.get("DATABASE_URL")
    print("DATABASE_URL =", DATABASE_URL)

    if not DATABASE_URL:
        raise Exception("DATABASE_URL not set in environment variables")

    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    conn = psycopg.connect(DATABASE_URL, sslmode="require")
    return conn

# -----------------------
# Home Page
# -----------------------
@app.route("/")
def home():
    return render_template("index.html")


# -----------------------
# Register Page
# -----------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if "username" in session:
        return redirect(url_for("dashboard"))
    
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT * FROM users WHERE username=%s", (username,))
        if cur.fetchone():
            conn.close()
            return "Username already exists."

        hashed_password = generate_password_hash(password)

        cur.execute(
            "INSERT INTO users (username, password) VALUES (%s, %s)",
            (username, hashed_password)
        )

        conn.commit()
        conn.close()

        return redirect(url_for("login"))

    return render_template("register.html")


# -----------------------
# Login Page
# -----------------------
@app.route("/login", methods=["GET", "POST"])
def login():

    if "username" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        try:
            conn = get_db_connection()
            cur = conn.cursor()

            cur.execute("""
                SELECT username, password, email, avatar, bio, dob, exp, is_admin
                FROM users
                WHERE username=%s
            """, (username,))

            user = cur.fetchone()
            conn.close()

        except Exception as e:
            print("❌ Database error:", e)
            return render_template("login.html", error="Database connection failed")

        if user:
            stored_hash = user[1]
            try:
                valid = check_password_hash(stored_hash, password)
            except:
                valid = (stored_hash == password)
        else:
            valid = False

        if valid:
            session.clear()
            session.permanent = True

            session["username"] = user[0]
            session["email"] = user[2]
            session["avatar"] = user[3]
            session["bio"] = user[4]
            session["dob"] = user[5]
            session["exp"] = user[6]
            session["is_admin"] = 1 if user[7] == 1 else 0

            return redirect(url_for("dashboard"))
        else:
            return render_template("login.html", error="❌ User not found or password incorrect.")

    return render_template("login.html")


# -----------------------
# Dashboard
# -----------------------
@app.route("/dashboard")
def dashboard():
    if "username" in session:
        return render_template("dashboard.html", username=session["username"])
    return redirect(url_for("login"))


# -----------------------
# Add XP
# -----------------------
def add_exp(username, amount=10):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE users SET exp = exp + %s WHERE username=%s", (amount, username))
    conn.commit()
    conn.close()


# -----------------------
# Logout
# -----------------------
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))


# -----------------------
# Profile
# -----------------------
@app.route("/profile")
def profile():
    if "username" not in session:
        return redirect(url_for("login"))

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT exp FROM users WHERE username=%s", (session["username"],))
    result = cur.fetchone()
    conn.close()

    exp = result[0] if result else 0

    level = (exp // 100) + 1
    current_xp = exp % 100

    return render_template(
        "profile.html",
        level=level,
        exp=exp,
        current_xp=current_xp,
        progress_percent=current_xp
    )


# -----------------------
# Update Avatar
# -----------------------
@app.route("/update_avatar", methods=["POST"])
def update_avatar():
    if "username" not in session:
        return redirect(url_for("login"))

    avatar = request.form.get("avatar")

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE users SET avatar=%s WHERE username=%s", (avatar, session["username"]))
    conn.commit()
    conn.close()

    session["avatar"] = avatar
    return redirect(url_for("profile"))


# -----------------------
# Update Profile
# -----------------------
@app.route("/update_profile", methods=["POST"])
def update_profile():
    if "username" not in session:
        return redirect(url_for("login"))

    email = request.form.get("email")
    dob = request.form.get("dob")
    bio = request.form.get("bio")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE users
        SET email=%s, dob=%s, bio=%s
        WHERE username=%s
    """, (email, dob, bio, session["username"]))

    conn.commit()
    conn.close()

    session["email"] = email
    session["dob"] = dob
    session["bio"] = bio

    return redirect(url_for("profile"))


# -----------------------
# Admin Panel
# -----------------------
@app.route("/admin")
def admin_panel():
    if "username" not in session:
        return redirect(url_for("login"))

    if session.get("is_admin") != 1:
        return "<h2>Access Denied 🚫</h2>"

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT username, email, dob, exp FROM users")
    users = cur.fetchall()
    conn.close()

    return render_template("admin.html", users=users)


# -----------------------
# Leaderboard
# -----------------------
@app.route('/leaderboard')
def leaderboard():
    if "username" not in session:
        return redirect(url_for("login"))

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT username, exp FROM users ORDER BY exp DESC")
    users = cur.fetchall()
    conn.close()

    ranked_users = []
    for index, user in enumerate(users, start=1):
        username, exp = user
        level = (exp // 100) + 1
        ranked_users.append({
            "rank": index,
            "username": username,
            "exp": exp,
            "level": level
        })

    return render_template("leaderboard.html", users=ranked_users)



# -----------------------
# Run
# -----------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)