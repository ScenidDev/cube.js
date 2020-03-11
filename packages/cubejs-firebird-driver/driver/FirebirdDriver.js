const Firebird = require('node-firebird');
const BaseDriver = require('@cubejs-backend/query-orchestrator/driver/BaseDriver');

class FirebirdDriver extends BaseDriver {
  constructor(config) {
    super();
    this.config = {
      host: process.env.CUBEJS_DB_HOST,
      port: process.env.CUBEJS_DB_PORT,
      database: process.env.CUBEJS_DB_NAME,
      user: process.env.CUBEJS_DB_USER,
      password: process.env.CUBEJS_DB_PASS,
      ...config
    };
    this.pool = Firebird.pool(8, this.config);
  }

  async testConnection() {
    try {
      return await this.query('SELECT 1 from RDB$DATABASE');
    } finally {
      await this.release();
    }
  }

  async getConnection() {
    return new Promise((resolve, reject) => {
      this.pool.get((err, db) => {
        if (err) reject(err)
        resolve(db)
      })
    })
  }

  async runQuery(query, values = []) {
    const conn = await this.getConnection();

    return new Promise((resolve, reject) => {
      conn.query(query, values, (err, result) => {
        console.log('THIS', query)
        console.log(result)
        console.log(err)
        console.log('-----------------------------')
        if (err) reject(err);
        resolve(result);
      })
    })
  }

  async query(query, values) {
    // await this.runQuery(`SET TIME ZONE '${this.config.storeTimezone || '+00:00'}'`);
    const res = await this.runQuery(query, values);
    console.log('res', res);

    return res
  }

  async release() {
    await this.pool.destroy();
  }
}

module.exports = FirebirdDriver;
