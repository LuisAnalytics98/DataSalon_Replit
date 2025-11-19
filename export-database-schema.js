// Script to export database schema from current database
// This will help you see the current structure in your Replit/Neon database

import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env.local first, then .env
config({ path: join(__dirname, '.env.local') });
config({ path: join(__dirname, '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.log('\n💡 Options:');
  console.log('   1. Set DATABASE_URL in .env.local (for Supabase)');
  console.log('   2. Or set your Replit/Neon DATABASE_URL temporarily');
  console.log('   3. Or run this from Replit where DATABASE_URL is set');
  process.exit(1);
}

console.log('📊 Exporting Database Schema...\n');
console.log(`Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

const pool = new Pool({ connectionString: databaseUrl });

async function exportSchema() {
  try {
    // Get all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const { rows: tables } = await pool.query(tablesQuery);
    
    console.log(`Found ${tables.length} tables:\n`);
    
    const schema = {
      tables: [],
      exports: []
    };

    for (const { table_name } of tables) {
      console.log(`📋 Table: ${table_name}`);
      
      // Get table structure
      const structureQuery = `
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          udt_name
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `;

      const { rows: columns } = await pool.query(structureQuery, [table_name]);
      
      const tableInfo = {
        name: table_name,
        columns: columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          maxLength: col.character_maximum_length,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          udt: col.udt_name
        }))
      };

      schema.tables.push(tableInfo);

      // Get constraints (primary keys, foreign keys, unique)
      const constraintsQuery = `
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = $1;
      `;

      const { rows: constraints } = await pool.query(constraintsQuery, [table_name]);
      tableInfo.constraints = constraints;

      // Get indexes
      const indexesQuery = `
        SELECT
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = $1;
      `;

      const { rows: indexes } = await pool.query(indexesQuery, [table_name]);
      tableInfo.indexes = indexes;

      // Get row count
      const countQuery = `SELECT COUNT(*) as count FROM ${table_name};`;
      const { rows: [{ count }] } = await pool.query(countQuery);
      tableInfo.rowCount = parseInt(count);

      console.log(`   Columns: ${columns.length}`);
      console.log(`   Rows: ${count}`);
      console.log(`   Constraints: ${constraints.length}`);
      console.log(`   Indexes: ${indexes.length}\n`);
    }

    // Save to JSON file
    const outputFile = 'database-export.json';
    fs.writeFileSync(outputFile, JSON.stringify(schema, null, 2));
    console.log(`✅ Schema exported to: ${outputFile}`);

    // Generate SQL CREATE statements
    let sqlOutput = '-- Exported Database Schema\n';
    sqlOutput += `-- Generated: ${new Date().toISOString()}\n\n`;

    for (const table of schema.tables) {
      sqlOutput += `-- Table: ${table.name} (${table.rowCount} rows)\n`;
      sqlOutput += `CREATE TABLE IF NOT EXISTS "${table.name}" (\n`;
      
      const columnDefs = table.columns.map(col => {
        let def = `  "${col.name}" ${col.udt.toUpperCase()}`;
        if (col.maxLength) {
          def += `(${col.maxLength})`;
        }
        if (!col.nullable) {
          def += ' NOT NULL';
        }
        if (col.default) {
          def += ` DEFAULT ${col.default}`;
        }
        return def;
      });

      sqlOutput += columnDefs.join(',\n');
      sqlOutput += '\n);\n\n';
    }

    const sqlFile = 'database-export.sql';
    fs.writeFileSync(sqlFile, sqlOutput);
    console.log(`✅ SQL export saved to: ${sqlFile}`);

    console.log('\n📝 Summary:');
    console.log(`   Total tables: ${schema.tables.length}`);
    console.log(`   Total rows: ${schema.tables.reduce((sum, t) => sum + t.rowCount, 0)}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ Error exporting schema:', error.message);
    await pool.end();
    process.exit(1);
  }
}

exportSchema();

