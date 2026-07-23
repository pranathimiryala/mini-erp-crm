/*import fs from 'fs';
import path from 'path';
import pool from '../config/database';

const runMigrations = async () => {
  let connection;

  try {
    console.log('🔄 Running database migrations...');

    const migrationPath = path.join(
      __dirname,
      'migrations',
      '001_initial_schema.sql'
    );

    let sql = fs.readFileSync(migrationPath, 'utf8');

    // Remove SQL comments
    sql = sql.replace(/^--.*$/gm, '');

    // Split SQL statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    connection = await pool.getConnection();

    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const statement of statements) {
      try {
        await connection.query(statement);
        console.log('✅ Executed');
      } catch (err: any) {
        console.log('⚠️ Skipped:', err.code);
      }
    }

    // Enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    connection.release();

    console.log('🎉 Migration completed successfully');
    process.exit(0);

  } catch (err) {
    if (connection) connection.release();
    console.error(err);
    process.exit(1);
  }
};

runMigrations();*/
import fs from 'fs';
import path from 'path';
import pool from '../config/database';

const runMigrations = async () => {
  let connection;

  try {
    console.log('🔄 Running database migrations...');

    const migrationPath = path.join(
      __dirname,
      'migrations',
      '001_initial_schema.sql'
    );

    let sql = fs.readFileSync(migrationPath, 'utf8');

    // Remove SQL comments
    sql = sql.replace(/^--.*$/gm, '');

    // Split into individual SQL statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    connection = await pool.getConnection();

    console.log('🔓 Disabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const statement of statements) {
      try {
        await connection.query(statement);
        console.log(
          `✅ ${statement.substring(0, 60).replace(/\n/g, ' ')}...`
        );
      } catch (err: any) {
        console.error('\n======================================');
        console.error('❌ Migration Failed');
        console.error('--------------------------------------');
        console.error('SQL Statement:\n');
        console.error(statement);
        console.error('\nError Code :', err.code);
        console.error('Error Msg  :', err.sqlMessage || err.message);
        console.error('======================================\n');

        throw err;
      }
    }

    console.log('🔒 Enabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    connection.release();

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);

  } catch (err) {
    if (connection) {
      try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      } catch {}

      connection.release();
    }

    console.error('❌ Migration stopped.');
    process.exit(1);
  }
};

runMigrations();