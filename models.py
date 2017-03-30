# create an Engine
from sqlalchemy import create_engine
engine = create_engine("sqlite:///application.db")

# create a configured "Session" class
from sqlalchemy.orm import sessionmaker
dbSession = sessionmaker(bind=engine)

# create the session
db_session = dbSession()

# initialize base class
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

from passlib.context import CryptContext
myctx = CryptContext(schemes=["sha256_crypt", "md5_crypt", "des_crypt"])

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, backref
from sqlalchemy.orm.collections import attribute_mapped_collection
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    fullname = Column(String)
    pw_hash = Column(String)
    # set up one-to-many relationship
    cards = relationship("Card", backref='users')

    def __init__(self, username, password=None):
        if password == None:
            raise Exception('Need to provide a password')
        self.name = username
        self.set_password(password)

    # method to store hashed password
    def set_password(self, password):
        self.pw_hash = myctx.hash(password)

    def verify_password(self, password):
        return myctx.verify(password, self.pw_hash)

    def __repr__(self):
        return "<User(id={}, name={}, pw_hash={}>".format(self.id,
                                                          self.name,
                                                          self.pw_hash)

class Card(Base):
    __tablename__ = "cards"
    id = Column(Integer, primary_key=True)
    parent_ide = Column(Integer, ForeignKey(id))
    # set up one-to-many relationship
    user_id = Column(Integer, ForeignKey('users.id'))
    tags = Column(String)
    title = Column(String, nullable=False)
    content = Column(String)

    children = relationship("Card",


                            # cascade deletions
                            cascade="all, delete-orphan",

                            # many to one + adjacency list - remote_side
                            # is required to reference the 'remote'
                            # column in the join condition.
                            backref=backref("parent", remote_side=id),
                            # need to understand this

                            # children will be represented as a dict
                            # on the id attribute
                            collection_class=attribute_mapped_collection('id')
                            )

    def __init__(self, title, parent=None):
        self.title = title
        self.parent = parent

    def __repr__(self):
        return 'Card<id: {}, title: {}, content: {}, user_id: {}'.format(self.id,
                                    self.title,
                                    self.content,
                                    self.user_id)
        
Base.metadata.create_all(engine)
