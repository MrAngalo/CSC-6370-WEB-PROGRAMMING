const express = require("express"); 
const crypt = require("crypto");
const app = express(); 
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mysql = require("mysql2");
const pass = process.env.ROOTPASS; //My db password is stored in an environment variable called pass
const conn = mysql.createConnection({host:"localhost",user:"root",password:pass,database:"paws",port:3306});

app.use(express.urlencoded({ extended: true })); 
app.use(express.static("public")); 
app.use(cookieParser());


app.use(session({
  secret: process.env.SESSION_SECRET, // Used to sign the session ID cookie
  resave: false,                    // Prevents resaving unchanged sessions
  saveUninitialized: false,         // Prevents storing empty, uninitialized sessions
  cookie: { 
    maxAge: 60000 * 60,             // Cookie expiry in milliseconds (1 hour)
    httpOnly: true,                 // Protects against XSS attacks
    secure: false                   // Set to true if using HTTPS
  }
}));

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

app.get("/profile",function(req,res)
{
	if (!req.session.user)
		res.send('You are not logged in. Please <a href="login.html">Login here</p>.');
	else 
	{
		res.send(`Hi ${req.session.user.user_id}. Your gpa is ${req.session.user.gpa}. <br><a href="/logout">Logout</a><p>`);
	}
	
});

app.get("/logout",function(req,res)
{
	req.session.destroy((err)=> 
	{
		if (err) res.send("Error logging out");
		else res.send('Logged out successfully! <a href="login.html">Login Here</a>');
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
			{
				req.session.user={user_id:username,gpa:result[0].gpa};
				res.send(`<p>You have logged in successfully ${username}.<br> Visit your <a href="/profile">Profile</a></p>`); 
			}
		} 
	});
});



app.listen(3000);