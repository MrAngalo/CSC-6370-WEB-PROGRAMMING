process.loadEnvFile(__dirname + "/.env");
const express = require("express");
const crypt = require("crypto");
const session = require("express-session");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/../frontend"));

// Creates a session for each visitor, the session id is stored in a cookie
app.use(session({
	secret: process.env.SESSION_SECRET, // Used to sign the session id cookie
	resave: false, // Does not save the session again if nothing changed
	saveUninitialized: false, // Does not create a session until something is stored in it
	cookie: {
		maxAge: 60000 * 60, // Cookie expires after 1 hour, in milliseconds
		httpOnly: true, // Javascript in the browser cannot read the cookie
		secure: false // Set to true when the site uses HTTPS
	}
}));

const mysql = require("mysql2");

// Connects to the database, using values from the .env file
const conn = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	port: Number(process.env.DB_PORT)
});

// Password hash settings
const hashRounds = 100;
const hashLength= 64;
const salt = process.env.PASSWORD_SALT;

// Test connection to the database
conn.connect(function(err)
{
	if(err)
		console.log("Couldnt connect to MySQL",err);
	else
		console.log("Database connection established");

});

// Receives the form from register.html, hashes the password and saves the new user
app.post("/register",function(req,res)
{
	let username = req.body.username;
	let email = req.body.email;
	let password = req.body.password;
	let passwordHashed = crypt.pbkdf2Sync(password,salt, hashRounds, hashLength, 'sha512').toString(`hex`); // Hashes the password so it is not stored as plain text
	let sql = "insert into user (username,email,password) values (?,?,?)"; // The ? are filled in by the array below, this prevents sql injection
	conn.query(sql,[username,email,passwordHashed],function(err,result)
	{
		if (err) // Happens when the username is taken or too long
		{
			console.log("There was an error inserting a user",err);
			res.send('<p>There was an error registering<br> <a href="register.html">Try again</a></p>');
		}
		else
			res.send('<p>You have successfully registered<br> <a href="login.html">Login</a> here</p>');
	});
});

// Receives the form from login.html and checks the username and password against the user table
app.post("/login",function(req,res)
{
	let username = req.body.username;
	let password = req.body.password;
	// Hashes the password the same way as register so they can be compared
	let passwordHashed = crypt.pbkdf2Sync(password,salt, hashRounds, hashLength, 'sha512').toString(`hex`);
	let sql = 'select * from user where username=? and password = ?';
	conn.query(sql,[username,passwordHashed],function(err,result)
	{
		if(err)
		{
			console.log("There was an error logging in",err);
			res.send('<p>There was an error logging in<br> <a href="login.html">Try again</a></p>');
		}
		else
		{
			if (result.length === 0) // No rows means the username or password did not match
			{
				console.log('results of the query',result);
				res.send('<p>The login credentials were incorrect<br> <a href="login.html">Login </a> here </p> ');
			}
			else
				res.send(`<p>You have logged in successfully ${username}</p>`);
		}
	});
});



app.listen(Number(process.env.PORT) || 3000); // Starts the server on the port from .env, or 3000 if it is not set
