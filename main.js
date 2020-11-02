// load libraries
const express = require('express')
const handlebars = require('express-handlebars')
// get the driver with promise support
const mysql = require('mysql2/promise')

// SQL
const SQL_FIND_BY_NAME = 'select * from apps where name like ? limit ?'

// configure PORT
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

// create the database conneciton pool
const pool = mysql.createPool({
    host: process.env.BD_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'playstore',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 4,
    timezone: '+08:00'
})

const startApp = async (app, pool) => {
    try {
        // accquire a connection from the connection pool
        const conn = await pool.getConnection()

        console.info('Pinging database')
        await conn.ping()

        // release the connection
        conn.release()

        app.listen(PORT, () => {
            console.info(`Application started on Port ${PORT} at ${new Date()}`)
        })
    } catch(e) {
        console.error('Cannot ping database: ', e)
    }
}

// create an instance
const app = express()

// configure handlebars
app.engine('hbs', handlebars({ defaultLayout: 'default.hbs'}))
app.set('view engine', 'hbs')

// configure apps
app.get('/', (req, resp) => {
    resp.status(200)
    resp.type('text/html')
    resp.render('index')
})

app.get('/search', 
    async (req, resp) => {
        const search = req.query.search
        //console.info(search)

        // acquire a connection from the pool
        const conn = await pool.getConnection()

        try {
            // perform the query
            
            //const results = await conn.query(SQL_FIND_BY_NAME, [ `%${search}%`, 10])
            //const recs = results[0]
            const [ recs, _ ] = await conn.query(SQL_FIND_BY_NAME, [ `%${search}%`, 10])

            console.info('recs = ', recs)
            
            resp.status(200)
            resp.type('text/html')
            resp.render('result', {
                search, recs
            
            })

        } catch(e) {
            console.error('Error = ', e)
        } finally {
            // release connection
            conn.release()
        }
})

// start server
startApp(app, pool)