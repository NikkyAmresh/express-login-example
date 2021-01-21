import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mysql = require('mysql');

class dbConnection{

    /**
     * @param {string | mysql.ConnectionConfig} dbConfig
     */
    constructor(dbConfig) {
        this.con = mysql.createConnection(dbConfig);
    }

    status(){
        return new Promise((resolve,reject)=>{
            this.con.connect((err)=>{
                if(err){
                    reject("ERROR");
                }else{
                    resolve("CONNECTED")
                }
            })
        });
    }

    connection(){
        return this.con;
    }

}

export default dbConnection;