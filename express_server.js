const express = require("express");
const app = express();
const PORT = 8080; // Default port 8080
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { getUserByEmail } = require('./helper');

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: [
    'b7e73fb92f43c572f759fd91619fdb0b9cc2e7c9b8c379380ea51094019749a9',
    '27d59af790e649d3d30ede13c69e7910459f10e851c633d960b0cb0953e01898'
  ],
  maxAge: 24 * 60 * 60 * 1000
}));

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
};

function urlsForUser(id) {
  let userUrls = {};
  for (let urlId in urlDatabase) {
    if (urlDatabase[urlId].userID === id) {
      userUrls[urlId] = urlDatabase[urlId];
    }
  }
  return userUrls;
}

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
  },
};

function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (!user) {
    return res.send('Please <a href="/login">login</a> or <a href="/register">register</a> first.');
  }
  const templateVars = {
    urls: urlsForUser(userId),
    user: user
  };
  res.render("urls_index", templateVars);
});

app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('register');
  }
});

app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('login');
  }
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect('/login');
  } else {
    const templateVars = { user: users[userId] };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const url = urlDatabase[req.params.id];
  
  if (!user) {
    return res.status(403).send('Please login first.');
  }
  if (!url || url.userID !== userId) {
    return res.status(403).send('URL does not exist or you do not have access.');
  }

  const templateVars = { id: req.params.id, longURL: url.longURL, user: user };
  res.render("urls_show", templateVars);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(403).send('Incorrect email or password.');
  }

  req.session.user_id = user.id;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password cannot be empty.');
  }

  if (getUserByEmail(email, users)) {
    return res.status(400).send('A user with that email already exists.');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword
  };

  req.session.user_id = userId;
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(403).send('You must be logged in to shorten URLs.');
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: userId };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const url = urlDatabase[req.params.id];

  if (!userId) {
    return res.status(403).send('Please login first.');
  }
  if (!url || url.userID !== userId) {
    return res.status(403).send('URL does not exist or you do not have permission to delete it.');
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const url = urlDatabase[req.params.id];

  if (!userId) {
    return res.status(403).send('Please login first.');
  }
  if (!url || url.userID !== userId) {
    return res.status(403).send('URL does not exist or you do not have permission to edit it.');
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});