let express = require("express");
let { Pool } = require("pg");
let cors = require("cors");
let bodyParser = require("body-parser");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
});
const bcrypt = require("bcrypt");
//let dotenv = require('dotenv').config()

let passport = require("./passport");
let session = require("express-session");

let app = express();

//app.use(serveStatic(path.join(__dirname, 'dist')))
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log("successful connection");
  })
  .catch(() => {
    console.log("unable to connect to db", err);
  });

let User = sequelize.define("user", {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER,
  },
  firstName: {
    type: Sequelize.STRING,
    notEmpty: true,
  },
  lastName: {
    type: Sequelize.STRING,
    notEmpty: true,
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

let Poem = sequelize.define("poem", {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER,
  },
  title: {
    type: Sequelize.JSONB,
    notEmpty: true,
  },
  text: {
    type: Sequelize.JSONB,
    notEmpty: true,
  },
  published: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  },
});

let Code = sequelize.define("code", {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER,
  },
  title: {
    type: Sequelize.JSONB,
    notEmpty: true,
  },
  text: {
    type: Sequelize.TEXT,
    notEmpty: true,
  },
  published: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  },
});

User.hasMany(Poem, {
  foreignKey: "userId",
  sourceKey: "id",
});

User.hasMany(Code, {
  foreignKey: "userId",
  sourceKey: "id",
});

Poem.hasMany(Code, {
  foreignKey: "poemId",
  sourceKey: "id",
});

Poem.belongsTo(User);

Code.belongsTo(User);
Code.belongsTo(Poem);

User.prototype.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

User.beforeCreate((user) => {
  user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10), null);
});

sequelize.sync({ alter: true }).then(function () {
  app.listen(PORT, function () {
    console.log("listening on port.");
  });
});

app.get("/", (req, res) => {
  res.send("welcome to passport with sequelize");
});

app.post("/confirminvitation", function (req, res) {
  if (req.body.code === "JsEliot") {
    res.json({ message: true });
  } else {
    res.json({ message: false });
  }
});

app.get("/checkpoems", function (req, res) {
  Poem.findAll({
    where: {
      userId: 1,
    },
  }).then(function (poems) {
    res.send(poems);
  });
});

app.get("/checkcode", function (req, res) {
  Poem.findAll({
    where: {
      userId: 1,
    },
  }).then(function (poems) {
    res.send(poems);
  });
});

app.get("/getallpoems", function (req, res) {
  Poem.findAll({
    where: {
      published: false,
    },
  }).then(function (poems) {
    res.send(poems);
  });
});

app.post("/getusercode", function (req, res) {
  Code.findAll({
    where: {
      userId: req.body.id,
    },
  }).then(function (poems) {
    console.log(poems);
    res.send(poems);
  });
});

app.post("/getpoemcode", function (req, res) {
  Code.findAll({
    where: {
      poemId: req.body.id,
    },
  }).then(function (poems) {
    console.log(poems);
    res.send(poems);
  });
});

app.post("/getuserpoems", function (req, res) {
  Poem.findAll({
    where: {
      userId: req.body.id,
    },
  }).then(function (poems) {
    console.log(poems);
    res.send(poems);
  });
});

app.post("/getonepoem", function (req, res) {
  Poem.findAll({
    where: {
      id: req.body.id,
    },
  }).then(function (poem) {
    res.send(poem);
  });
});

app.post("/publishcode", function (req, res) {
  User.findOne({
    where: {
      id: req.body.id,
    },
  }).then(function (user) {
    if (user) {
      const code = Code.create({
        title: req.body.title,
        text: req.body.text,
        published: req.body.published,
        userId: req.body.id,
      });
    } else {
      res.json(400, {
        error: 1,
        msg: "You must log in first",
      });
    }
  });
});

app.post("/publishpoem", function (req, res) {
  console.log(req.body.id);
  User.findOne({
    where: {
      id: req.body.id,
    },
  }).then(function (user) {
    if (user) {
      //publish the poem
      const poem = Poem.create({
        title: req.body.title,
        text: req.body.text,
        published: req.body.published,
        userId: req.body.id,
      }).then(function (poems) {
        res.json({ message: true });
      });
    } else {
      res.json(400, {
        error: 1,
        msg: "You must log in first",
      });
    }
  });
});

app.post("/savecode", function (req, res) {
  Code.findOne({
    where: {
      id: req.body.id,
    },
  }).then(function (code) {
    if (code) {
      code
        .update({
          title: req.body.title,
          text: req.body.text,
          published: req.body.published,
          userId: req.body.userId,
        })
        .then(function (success) {
          res.json({ message: true });
        });
    } else {
      Code.create({
        title: req.body.title,
        text: req.body.text,
        published: req.body.published,
        userId: req.body.userId,
      }).then(function (code) {
        res.json({ message: true });
      });
    }
  });
});

//jk it  makes a new one if it doesnt exist
//pass in 0 if there is no poem
app.post("/savepoem", function (req, res) {
  console.log(req.body.id);
  console.log("THIS IS THE POEM SAVED", req.body.text);
  Poem.findOne({
    where: {
      id: req.body.id,
    },
  }).then(function (poem) {
    console.log(poem);
    if (poem) {
      poem
        .update({
          title: req.body.title,
          text: req.body.text,
          published: req.body.published,
          userId: req.body.userId,
        })
        .then(function (success) {
          console.log(success);
          res.json({ message: true });
        });
    } else {
      Poem.create({
        title: req.body.title,
        text: req.body.text,
        published: req.body.published,
        userId: req.body.userId,
      }).then(function (poems) {
        console.log(poems);
        res.json({ message: true });
      });
    }
  });
});

app.post("/deletecode", function (req, res) {
  Code.findOne({
    where: {
      id: req.body.id,
    },
  }).then(function (code) {
    console.log(code);
    if (code) {
      code.destroy().then(function (success) {
        res.json({ message: true });
      });
    }
  });
});

app.post("/deletepoem", function (req, res) {
  Poem.findOne({
    where: {
      id: req.body.id,
    },
  }).then(function (poem) {
    console.log(poem);
    if (poem) {
      poem.destroy().then(function (success) {
        res.json({ message: true });
      });
    }
  });
});

app.post("/finduser", function (req, res) {
  User.findOne({
    where: {
      id: req.body.id,
    },
  }).then(function (user) {
    if (user) {
      console.log(user);
      res.send(user.dataValues);
    } else {
      res.json({ message: false });
    }
  });
});

app.post("/login", function (req, res) {
  User.findOne({
    where: {
      email: req.body.email,
    },
  }).then(function (user) {
    if (user) {
      console.log(user);
      res.send(user.dataValues);
    } else {
      console.log("DID NOT LOGIN");
      res.json({ message: false });
    }
  });
});

app.post("/signup", function (req, res) {
  User.findOne({
    where: {
      email: req.body.email,
    },
  }).then(function (user) {
    if (user) {
      res.json({ message: false });
    } else {
      console.log("trying to make user");
      let newUser = User.create({
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      }).then(function (user) {
        console.log("this is the new user", user);
        res.send(user.dataValues);
      });
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/checkusers", function (req, res) {
  User.findAll().then(function (users) {
    console.log(users);
    res.send(users);
  });
});
