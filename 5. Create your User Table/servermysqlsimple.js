process.loadEnvFile(__dirname + "/.env"); //loads variables from .env into process.env (built into Node 20.12+)

const express = require("express"); //imports the express module
const app = express(); //creates the express application object
app.use(express.static("public"));//register public as the directory for static files

const mysql = require("mysql2"); //uses new mysql package
const conn = mysql.createConnection(
{
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	port: Number(process.env.DB_PORT)
});

conn.connect(function(err)
{
	if(err)
		console.log("Couldnt connect to MySQL",err);
	else
		console.log("Database connection established");
	
});
app.listen(Number(process.env.PORT) || 3000);