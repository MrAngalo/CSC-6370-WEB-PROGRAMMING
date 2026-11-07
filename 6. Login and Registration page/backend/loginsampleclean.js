process.loadEnvFile(__dirname + "/.env"); //loads variables from .env into process.env (built into Node 20.12+)
const express = require("express");
const crypt = require("crypto");
const app = express(); 
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/../frontend")); //serves the html pages from the frontend folder

const mysql = require("mysql2");
const conn = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	port: Number(process.env.DB_PORT)
});


const hashRounds = 100;
const hashLength=64;
const salt = "salt";


conn.connect(function(err)
{
	if(err)
		console.log("Couldnt connect to MySQL",err);
	else
		console.log("Database connection established");
	
});

app.post("/register",function(req,res)
{
	let username = req.body.username;
	let email = req.body.email;
	let password = req.body.password;
	let passwordHashed = crypt.pbkdf2Sync(password,salt, hashRounds, hashLength, 'sha512').toString(`hex`);
	let sql = "insert into user (username,email,password) values (?,?,?)";
	conn.query(sql,[username,email,passwordHashed],function(err,result)
	{
		if (err)
		{
			console.log("There was an error inserting a user",err);
			res.send('<p>There was an error registering<br> <a href="register.html">Try again</a></p>');
		}
		else
			res.send('<p>You have successfully registered<br> <a href="login.html">Login</a> here</p>');
	});
});

app.post("/login",function(req,res)
{
	let plainPass = req.body.password; 
	let username = req.body.username;
	const pass = crypt.pbkdf2Sync(plainPass,
        salt, hashRounds, hashLength, 'sha512').toString(`hex`);
	let sql = 'select * from user where username=? and password = ?';
	conn.query(sql,[username,pass],function(err,result)
	{
		if(err)
		{
			console.log("There was an error logging in",err);
			res.send('<p>There was an error logging in<br> <a href="login.html">Try again</a></p>');
		}
		else
		{
			if (result.length === 0)
			{
				console.log('results of the query',result);
				res.send('<p>The login credentials were incorrect<br> <a href="login.html">Login </a> here </p> ');
			}
			else
				res.send(`<p>You have logged in successfully ${username}</p>`);
		} 
	});
});



app.listen(Number(process.env.PORT) || 3000);