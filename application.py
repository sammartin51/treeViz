
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

def process_data(content):
    nodes = content["nodes"]
    links = content["links"]
    # update node content:
    for node in nodes:
        # check if it's in the database
        db_node = db_session.query(Card).filter_by(id=node["id"]).first()
        if db_node:
            # update the date
            db_node.title = node["title"]
            db_node.content = node["text"]
            db_session.commit()
        else:
            print('somethings wrong')          
             
@app.route("/_update_data", methods=["GET", "POST"])
def update_data():
    if request.method == "GET":
        martisa4 = db_session.query(User).filter_by(name='martisa4').first()
        cards = martisa4.cards
        nodes = [{"id" : card.id,
                  "title" : card.title,
                  "text" : card.content,
                  "children" : [child_id for child_id in card.children]}
                 for card in martisa4.cards]

        root_card = [card for card in martisa4.cards
                     if card.parent == None][0]
        def get_links(card):
            if card.children:
                for child_num in card.children:
                    child = db_session.query(Card).filter_by(id=child_num).first()
                    yield {"source" : card.id, "target" : child.id}
                    yield from get_links(child)
                    
        links = [link for link in get_links(root_card)]
        data = {
            "nodes" : nodes,
            "links" : links
        }
        return json.dumps(data) 
    if request.method == "POST":
        content = request.get_json(force=True)
        process_data(content)
        return 'ok'

        
