const mysql = require('mysql');

const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    port: '3306',
    password: 'root',
    database: 'userinfo'
 });

 db.connect((err) =>{
    if(err){
       console.log("go back and check the connection details. Something is wrong.")
   } 
    else{
       console.log('Looking good the database connected')
   }
})

module.exports = db;