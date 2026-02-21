from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "usersdata.db")

if not os.path.exists(os.path.join(BASE_DIR, "database")):
    os.makedirs(os.path.join(BASE_DIR, "database"))

if not os.path.exists(DB_PATH):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT,
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

app = Flask(__name__)
app.secret_key = "your_secret_key"  # Replace with a secure key

app.secret_key = "super_secret_key_123"
app.permanent_session_lifetime = timedelta(days=7)

# -----------------------
# Home Page
# -----------------------
@app.route("/")
def home():
    return render_template("index.html")


# -----------------------
# Register Page (with password hashing)
# -----------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if "username" in session:
        # Already logged in users should not access register page
        return redirect(url_for("dashboard"))
    
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()

        # Check if user already exists
        c.execute("SELECT * FROM users WHERE username=?", (username,))
        if c.fetchone():
            conn.close()
            return "Username already exists."

        # Hash the password before saving
        hashed_password = generate_password_hash(password)
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        conn.close()

        return redirect(url_for("login"))

    return render_template("register.html")


# -----------------------
# Login Page
# -----------------------
@app.route("/login", methods=["GET", "POST"])
def login():
    # If already logged in, skip login
    if "username" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        db_path = os.path.join(os.path.dirname(__file__), "database", "usersdata.db")

        try:
            conn = sqlite3.connect(db_path)
            c = conn.cursor()
            c.execute("SELECT username, password, email, avatar, bio, dob, exp, is_admin FROM users WHERE username=?", (username,))
            user = c.fetchone()
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
            app.permanent_session_lifetime = timedelta(days=7)

            session["username"] = user[0]
            session["email"] = user[2]
            session["avatar"] = user[3]
            session["bio"] = user[4]
            session["dob"] = user[5]
            session["exp"] = user[6]
            session["is_admin"] = 1 if user[7] == 1 else 0

            print(f"✅ Login success for {username}")
            return redirect(url_for("dashboard"))
        else:
            print(f"❌ Invalid credentials for: {username}")
            # ⚠️ Only this line added for showing error on login page
            return render_template("login.html", error="❌ User not found or password incorrect.")

    return render_template("login.html")


# -----------------------
# Dashboard Page
# -----------------------
@app.route("/dashboard")
def dashboard():
    if "username" in session:
        return render_template("dashboard.html", username=session["username"])
    else:
        return redirect(url_for("login"))


# -----------------------
# Add XP Function
# -----------------------
def add_exp(username, amount=10):
    """Adds XP to the given user."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE users SET exp = exp + ? WHERE username=?", (amount, username))
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
# Profile Page
# -----------------------
@app.route("/profile")
def profile():
    if "username" not in session:
        return redirect(url_for("login"))

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT exp FROM users WHERE username=?", (session["username"],))
    result = c.fetchone()
    conn.close()

    exp = result[0] if result else 0

    level = (exp // 100) + 1
    current_xp = exp % 100
    progress_percent = current_xp

    return render_template(
        "profile.html",
        level=level,
        exp=exp,
        current_xp=current_xp,
        progress_percent=progress_percent
    )

# -----------------------
# Update Avatar
# -----------------------
@app.route("/update_avatar", methods=["POST"])
def update_avatar():
    if "username" not in session:
        return redirect(url_for("login"))

    avatar = request.form.get("avatar")

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE users SET avatar=? WHERE username=?", (avatar, session["username"]))
    conn.commit()
    conn.close()

    session["avatar"] = avatar  # update session
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

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        UPDATE users
        SET email=?, dob=?, bio=?
        WHERE username=?
    """, (email, dob, bio, session["username"]))
    conn.commit()
    conn.close()

    # update session data
    session["email"] = email
    session["dob"] = dob
    session["bio"] = bio

    return redirect(url_for("profile"))


# -----------------------
# Admin Panel (Protected)
# -----------------------
@app.route("/admin")
def admin_panel():
    if "username" not in session:
        return redirect(url_for("login"))

    if session.get("is_admin") != 1:
        return "<h2>Access Denied 🚫</h2><p>You are not authorized to view this page.</p>"

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT username, email, dob, exp FROM users")
    users = c.fetchall()
    conn.close()

    return render_template("admin.html", users=users)

# -----------------------
# Leaderboard
# -----------------------
@app.route('/leaderboard')
def leaderboard():
    if "username" not in session:
        return redirect(url_for("login"))

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT username, exp FROM users ORDER BY exp DESC")
    users = cursor.fetchall()

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
# Games (add XP)
# -----------------------
@app.route("/tictactoe")
def tictactoe():
    if "username" not in session:
        return redirect(url_for("login"))
    add_exp(session["username"], 10)
    return render_template("games/tictactoe.html")


@app.route('/memory')
def memory():
    if "username" not in session:
        return redirect(url_for("login"))
    add_exp(session["username"], 10)
    return render_template('games/memory.html')


@app.route('/snake')
def snake():
    if "username" not in session:
        return redirect(url_for("login"))
    add_exp(session["username"], 10)
    return render_template('games/snake.html')


@app.route('/brickbreaker')
def brickbreaker():
    if "username" not in session:
        return redirect(url_for("login"))
    add_exp(session["username"], 10)
    return render_template('games/brickbreaker.html')


@app.route('/games/space-shooter')
def space_shooter():
    if "username" not in session:
        return redirect(url_for("login"))
    add_exp(session["username"], 10)
    return render_template('games/space_shooter.html')


@app.route('/maze_escape')
def maze_escape():
    if "username" not in session:
        return redirect(url_for("login"))
    add_exp(session["username"], 10)
    return render_template('games/maze_escape.html')


@app.route("/fruitcatcher")
def fruitcatcher():
    if "username" not in session:
        return redirect(url_for("login"))
    add_exp(session["username"], 10)
    return render_template("games/fruit_catcher.html")


@app.route('/flappy')
def flappy():
    if "username" not in session:
        return redirect(url_for("login"))
    add_exp(session["username"], 10)
    return render_template('games/flappy.html')

@app.route('/runner')
def runner():
    if "username" not in session:
        return redirect(url_for("login"))
    add_exp(session["username"], 15)
    return render_template('games/runner.html')

# -----------------------
# Run App (Render-ready)
# -----------------------
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
