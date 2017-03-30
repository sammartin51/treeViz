
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

def process_data_old(node, parent=None):
    user = db_session.query(User).filter_by(name='martisa4').first()
    existing_card = db_session.query(Card).filter_by(id=node["id"]).first()
    if existing_card != None:
        existing_card.title = node["title"]
        existing_card.content = node["text"]
        if "children" in node:
            for child in node["children"]:
                process_data(child, parent=existing_card)
    else:
        new_card = Card(node["title"])
        new_card.content = node["text"]
        new_card.parent_ide = parent.id
        if "children" in node:
            new_card.children = [process_data(child, parent=new_card)
                                 for child
                                 in new_card.children]
        user.cards.append(new_card)
        db_session.add(new_card)
        db_session.commit()
        parent.children[new_card.id] = new_card

    db_session.commit()

def process_data(content):
    # get server data
    user = db_session.query(User).filter_by(name='martisa4').first()
    server_data = {card.id : card
                   for card in user.cards}
    print('server data:')
    print(server_data)
    
    client_data = {}
    def catalog(node):
        print('node: {}'.format(node))
        client_data[node["id"]] = node
        if "children" in node:
            for child in node["children"]:
                catalog(child)
    catalog(content)
    print('client data:')
    print(client_data)
            
    # analyze differences
    added = [node
             for node_id, node
             in client_data.items()
             if node_id not in server_data]
    removed = [card
               for card_id, card
               in server_data.items()
               if card.id not in client_data]

    # process differences
    for node in added:
        new_card = Card(node["title"])
        new_card.content = node["text"]

        #parent relationships
        new_card.parent_ide = node["parent"]
        parent = server_data[new_card.parent_ide]
        user.cards.append(new_card)
        db_session.add(new_card)
        db_session.commit()
        parent.children[new_card.id] = new_card
        db_session.commit()

    print("removed:")
    for card in removed:
        db_session.delete(card)
        db_session.commit()

    # update all of the data:
    for node_id, node in client_data.items():
        if node_id in server_data:
            db_card = server_data[node_id]
            db_card.title = node["title"]
            db_card.content = node["text"]    
             
@app.route("/_update_data", methods=["GET", "POST"])
def update_data():
    if request.method == "GET":
        initiate_user('martisa4')
        martisa4 = db_session.query(User).filter_by(name='martisa4').first()
        root = [card for card in martisa4.cards
                if card.parent_ide == None][0]
        def print_tree(node):
            print(node)
            for child in node.children.values():
                print_tree(child)
        #print_tree(root)
                
        def generate_data(node):
            if node.children:
                return {"id" : node.id,
                        "title" : node.title,
                        "text" : node.content,
                        "children" : [generate_data(child)
                                      for child in node.children.values()],
                        "parent" : node.parent_ide} # this is new
            else:
                return {"id" : node.id,
                        "title" : node.title,
                        "text" : node.content,
                        "parent" : node.parent_ide} # this is new


        #print(generate_data(root))

        return json.dumps(generate_data(root))
    
    if request.method == "POST":
        content = request.get_json(force=True)
        print(content)
        print(process_data(content))
        return 'ok'

def initiate_user(username):
    user = db_session.query(User).filter_by(name='martisa4').first()
    if not user.cards:
        new_card = Card('Main')
        user.cards.append(new_card)
        db_session.add(new_card)
        db_session.commit()

        

