const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'merchant',
  password: 'mer1234',
  database: 'warehouse'
});
module.exports=pool;