const mysql = require("mysql2");

const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    port: 3306,
    password: 'root',
    database: 'userinfo'
 });

 db.connect((err) =>{
   if (err) {
      console.error("DB connection failed:");
      console.error(err.message);
      return;
   }
   else{
      console.log('Looking good the database connected')
   }
})

module.exports = db;