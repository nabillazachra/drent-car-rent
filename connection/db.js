const mysql = require('mysql');

const connectionPool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_car_rent',
});

module.exports = connectionPool;