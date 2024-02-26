const express = require("express");
const app = express();
const PORT = 8080; // Default port 8080
const cookieParser = require('cookie-parser');
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
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

function getUserByEmail(email, usersDb) {
  for (let userId in usersDb) {
    if (usersDb[userId].email === email) {
      return usersDb[userId];
    }
  }
  return null;
}

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
  const userId = req.cookies['user_id'];
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
  if (req.cookies["user_id"]) {
    res.redirect('/urls');
  } else {
    res.render('register');
  }
});

app.get('/login', (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect('/urls');
  } else {
    res.render('login');
  }
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies['user_id'];
  if (!userId) {
    res.redirect('/login');
  } else {
    res.render("urls_new", { user: users[userId] });
  }
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies['user_id'];
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

app.get("/urls/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send('Short URL not found');
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user || user.password !== password) {
    return res.status(403).send('Incorrect email or password.');
  }

  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password cannot be empty.');
  }

  const user = getUserByEmail(email, users);
  if (user) {
    return res.status(400).send('A user with that email already exists.');
  }

  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email,
    password
  };

  res.cookie('user_id', userId);
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  const userId = req.cookies['user_id'];
  if (!userId) {
    return res.status(403).send('You must be logged in to shorten URLs.');
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies['user_id'];
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
  const userId = req.cookies['user_id'];
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