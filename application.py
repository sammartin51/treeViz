
from flask import Flask, flash, redirect, render_template, request, session, url_for, jsonify
from flask_session import Session
import json

from tempfile import gettempdir

from collections import Counter

from datetime import datetime

from models import *

from helpers import *

# configure application
app = Flask(__name__, static_url_path="/static")      
                               
# ensure responses aren't cached
if app.config["DEBUG"]:
    @app.after_request
    def after_request(response):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Expires"] = 0
        response.headers["Pragma"] = "no-cache"
        return response

# configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = gettempdir()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

@app.route("/", methods=["GET"])
#@login_required
def index():
    """a
     # redirect to login
    if session["user_id"] == None:
        return redirect(url_for(login))
    # look up user
    user = User.query.filter_by(username=session["user_id"]).first()
    if user == None:
        return apology("Something bad happened")

    # generate portfolio data
    portfolio = {}
    balance, holdings = user.audit()
    for stock, shares in holdings.items():
        stock_info = Stock.fast_lookup(stock)
        if shares != 0:
            portfolio[stock] = {"name" : stock_info["name"],
                                "shares" : shares,
                                "price" : stock_info["price"]}
        
    # calculate total value of holdings
    total_value = sum([portfolio[stock]["shares"] * portfolio[stock]["price"]
                       for stock in portfolio])
                                            
    return render_template("index.html",
                           portfolio=portfolio,
                           balance=usd(balance),
                           total_value=usd(total_value))
    """
    return render_template("index.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in."""

    # forget any user_id
    session.clear()

    # if user reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        if not mandatory_fields(request.form,
                                ["username", "password"]):
            flash("Please provide a username and password.")
            return redirect(url_for("login"))

        # query database for username
        user = User.query.filter_by(username=request.form.get("username")).first()

        # ensure username exists and password is correct
        if user == None or not pwd_context.verify(request.form.get("password"),
                                                  user.pw_hash):
            flash("Username and password do not match.")
            return redirect(url_for("login"))

        # remember which user has logged in
        session["user_id"] = user.username

        # redirect user to home page
        return redirect(url_for("index"))

    # else if user reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")

@app.route("/logout")
def logout():
    """Log user out."""

    # forget any user_id
    session.clear()

    # redirect user to login form
    return redirect(url_for("login"))

    
@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user."""
    # forget any user_id
    session.clear()
    
    if request.method == "POST":
        # ensure all required fields were submitted
        if not mandatory_fields(request.form, ["username",
                                                "password"]):
            return apology("must provide a username and password.")

        # should probably check to make sure there's not somebode there already
        
        # save the user in the database
        new_user = User(request.form.get("username"),
                        request.form.get("password"))
        db.session.add(new_user)
        db.session.commit()

        # remember which user logged in... I wonder if i can login that person
        session["user_id"] = new_user.username

        # redirect to home page
        return redirect(url_for("index"))
      
    # User got here via GET
    else:
        return render_template("register.html")

def process_data(node):
    existing_card = db_session.query(Card).filter_by(id=node["id"]).first()
    if existing_card != None:
        existing_card.title = node["title"]
        existing_card.content = node["text"]
        if "children" in node:
            for child in node["children"]:
                process_data(child)
    else:
        new_card = Card(node["title"])
        new_card.content = node["text"]
        new_card.parent_ide = parent["id"]
        if "children" in node:
            new_card.children = [process_data(child)
                                 for child
                                 in new_card.children]
        db_session.add(new_card)
    db_session.commit()
    
             
@app.route("/_update_data", methods=["GET", "POST"])
def update_data():
    if request.method == "GET":
        martisa4 = db_session.query(User).filter_by(name='martisa4').first()
        cards = martisa4.cards
                
        def generate_data(node):
            if node.children:
                return {"id" : node.id,
                        "title" : node.title,
                        "text" : node.content,
                        "children" : [generate_data(child)
                                      for child in node.children.values()]}
            else:
                return {"id" : node.id,
                        "title" : node.title,
                        "text" : node.content}

        root = [card for card in cards
                if card.parent_ide == None][0]

        return json.dumps(generate_data(root))
    
    if request.method == "POST":
        content = request.get_json(force=True)
        print(process_data(content))
        return 'ok'

        

