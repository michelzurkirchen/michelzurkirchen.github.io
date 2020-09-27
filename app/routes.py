from flask import render_template, session
from app import app

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/facebook/")
def facebook_home():
    return render_template("facebook.html")
