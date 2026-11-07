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

//
app.post("/signup",function(req,res)
{
	let plainPass = req.body.password; 
	let username = req.body.userName;
	let fname = req.body.fname;
	let lname = req.body.lname;
	let gpa = Number(req.body.gpa);
	hashedPass = crypt.pbkdf2Sync(plainPass,salt, hashRounds, hashLength, 'sha512').toString(`hex`);
	let sql = "insert into student (fname,lname,gpa,user_id,password,salt) values (?,?,?,?,?,?)";
	conn.query(sql,[fname,lname,gpa,username,hashedPass,salt],function(err,result)
	{
		if (err)
			console.log("There was an error inserting a student",err)
		else
			res.send("<p> You have inserted "+fname+" "+lname+" "+ "into " + result.affectedRows+' row <a href="login.html">Login </a> here </p>');
	});
	
});

app.post("/login",function(req,res)
{
	let plainPass = req.body.password; 
	let username = req.body.username;
	let saltVal="salt";
	const pass = crypt.pbkdf2Sync(plainPass,
        saltVal, hashRounds, hashLength, 'sha512').toString(`hex`);
	let sql = 'select * from student where user_id=? and password = ?';
	conn.query(sql,[username,pass],function(err,result)
	{
		if(err)
			res.send(err);
		else
		{
			if (result.length === 0)
			{
				console.log('results of the query',result);
				res.send('<p>Your password or username are incorrect<br> <a href="login.html">Login </a> here </p> ');	
			}
			else
				res.send(`<p>You have logged in successfully ${username}</p>`);
		} 
	});
});



app.listen(Number(process.env.PORT) || 3000);