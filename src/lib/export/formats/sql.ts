import { Export, ExportOptions } from "@/lib/export";
import { DBConnection, TableOrView, TableFilter } from '@/lib/db/client'
import knexlib from 'knex'

interface OutputOptionsSql {
  createTable: boolean,
  schema: boolean
}
export class SqlExporter extends Export {
  readonly format: string = 'sql'
  readonly knexTypes: any = {
    "cockroachdb": "pg",
    "mariadb": "mysql2",
    "mysql": "mysql2",
    "postgresql": "pg",
    "sqlite": "sqlite3",
    "sqlserver": "mssql"
  }
  knex: any = null

  constructor(
    filePath: string,
    connection: DBConnection,
    table: TableOrView,
    filters: TableFilter[] | any[],
    options: ExportOptions,
    outputOptions: OutputOptionsSql
  ) {
    super(filePath, connection, table, filters, options, outputOptions)

    if (!this.connection.connectionType || !this.knexTypes[this.connection.connectionType]) {
      throw new Error("SQL export not supported on connectiont type " + this.connection.connectionType)
    }

    this.knex = knexlib({ client: this.knexTypes[this.connection.connectionType] || undefined })
  }

  async getHeader(firstRow: any) {
    if (this.outputOptions.createTable) {
      const schema = this.table.schema && this.outputOptions.schema ? this.table.schema : ''
      return this.connection.getTableCreateScript(this.table.name, schema)
    }
  }

  async getFooter() {}

  formatChunk(data: any): string[] {
    const formattedChunk = []

    for (const row of data) {
      let knex = this.knex(this.table.name)

      if (this.outputOptions.schema && this.table.schema) {
        knex = knex.withSchema(this.table.schema)
      }

      const content = knex.insert(row).toQuery()
      formattedChunk.push(content)
    }

    return formattedChunk
  }
}