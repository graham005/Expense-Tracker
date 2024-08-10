const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');


const app = express();
const PORT = 3001;
app.use(cors())
dotenv.config()


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUnitialized: true,
    cookie: {secure: false}
}));


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
    
})

db.connect((err) => {
    if(err) console.log("Error connecting to MYSQL")

    console.log("Connected to MYSQL: ", db.threadId);

    db.query('CREATE DATABASE IF NOT EXISTS expense_tracker', (err, result) =>{
        if(err) return console.log(err)
        
        console.log("Database expense_tracker created/checked")

        db.changeUser({database: 'expense_tracker'}, (err, result) =>{
            if(err) return console.log(err)

            console.log("expense_tracker is in use");
        })

        const usersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                username VARCHAR(50) NOT NULL,
                password  VARCHAR(255) NOT NULL
            )
        `;
        db.query(usersTable, (err, result) => {
            if(err) return console.log(err)
            
            console.log("User table created/checked");
        })
        const transaction = `
                CREATE TABLE IF NOT EXISTS transactions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    amount DECIMAL(10, 2) NOT NULL,
                    category VARCHAR(255) NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES Users(id)
                )
            `;
            db.query(transaction, (err, result) => {
                if(err) return console.log(err)

                console.log('Transaction table created or already exists...')
            })
    } )

})

//user registration 
app.post('/api/register', async(req, res)=> {
    try{
        const users =  'SELECT* FROM users WHERE email = ?'
        //check if user exists 
        db.query(users, [req.body.email], (err, data)=>{
            if(data.length > 0) return res.status(400).json("User already exists");

            const salt = bcrypt.genSaltSync(10)
            const hashedPassword = bcrypt.hashSync(req.body.password, salt)

            const newUser = 'INSERT INTO users(email,username,password) VALUES (?)'
            value = [ req.body.email, req.body.username, hashedPassword ]

            db.query(newUser, [value], (err, data) => {
                if(err){
                    if (err.code === 'ER_DUP_ENTRY'){
                        return res.status(400).json('Username already exists');
                    }
                }

                return res.status(200).json("user created successfully")
            })
        })
    }
    catch(err){
        res.status(500).json("Internal Server Error")
    }
})

//user login 
app.post('/api/login', async(req, res) => {
    try{
        const users = 'SELECT * FROM users WHERE email = ?'
        db.query(users, [req.body.email], (err, data) => {
            if(data.length === 0) return res.status(404).json("User not found!")

            const user = data[0];
            const isPasswordValid = bcrypt.compareSync(req.body.password, user.password)

            if(!isPasswordValid) return res.status(400).json("Invalid email or password!")

            req.session.userId = user.id
            return res.status(200).json("Login Successful")
        })
    }
    catch(err){
        res.status(500).json("Internal Server Error")
    }
})

// Logout User
app.post('/api/logout', (req,res) =>{
    req.session.destroy();
    res.json({message: 'Logged out successfully'});
});

// Middleware for authentication 
const isAuthenticated = (req, res, next) => {
    if(req.session.userId){
        return next();
    }
    res.status(401).json('Unauthorized')
}

//Get all transactions for logged-in user
app.get('/api/transactions', isAuthenticated, (req, res) => {
    const sql = 'SELECT * FROM transactions WHERE user_id = ?';
    db.query(sql, [res.session.userId], (err,results) => {
        if(err) throw err;
        res.json(results);
    });
});

// Add a transaction
app.post('/api/transactions', isAuthenticated, (req, res) => {
    const newTransaction = {
        user_id: req.session.userId,
        category: req.body.category,
        amount: req.body.amount
    };
    const sql = 'INSERT INTO transactions SET ?';
    db.query(sql, newTransaction, (err, results) => {
        if(err) throw err;
        res.json({id: result.insetId, ...newTransaction });
    });
});

// Delete a transactions
app.delete('api/transactions/:id', isAuthenticated, (req, res) => {
    const sql = 'DELETE FROM transactions WHERE id = ? AND user_id = ?';
    db.query(sql, [req.params.id, req.session.userId], (err,result) => {
        if(err) throw err;
        if(result.affectedRows === 0){
            return res.status(404).json('Transaction not found')
        };
        res.json('Transaction deleted')
    })
})

app.listen(PORT, ()=> {
    console.log(`Server running on port ${PORT}`);
})

