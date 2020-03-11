const moment = require('moment-timezone');

const BaseQuery = require('./BaseQuery');
const BaseFilter = require('./BaseFilter');

// const GRANULARITY_TO_INTERVAL = {
//   day: (date) => `EXTRACT(year from ${date})||'-'||EXTRACT(month from ${date})||'-'||EXTRACT(day from ${date})||'T00:00:00.000'`,
//   week: (date) => `DATE_FORMAT(date_add('1900-01-01', interval TIMESTAMPDIFF(WEEK, '1900-01-01', ${date}) WEEK), '%Y-%m-%dT00:00:00.000')`,
//   hour: (date) => `DATE_FORMAT(${date}, '%Y-%m-%dT%H:00:00.000')`,
//   minute: (date) => `DATE_FORMAT(${date}, '%Y-%m-%dT%H:%i:00.000')`,
//   second: (date) => `DATE_FORMAT(${date}, '%Y-%m-%dT%H:%i:%S.000')`,
//   month: (date) => `DATE_FORMAT(${date}, '%Y-%m-01T00:00:00.000')`,
//   year: (date) => `DATE_FORMAT(${date}, '%Y-01-01T00:00:00.000')`
// };

const GRANULARITY_TO_INTERVAL = {
  day: (date) => `${date}`,
  week: (date) => `${date}`,
  hour: (date) => `${date}`,
  minute: (date) => `${date}`,
  second: (date) => `${date}`,
  month: (date) => `${date}`,
  year: (date) => `${date}`
};

class FirebirdFilter extends BaseFilter {
  likeIgnoreCase(column, not) {
    return `${column}${not ? ' NOT' : ''} LIKE CONCAT('%', ?, '%')`;
  }
}

class FirebirdQuery extends BaseQuery {
  /**
   * "LIMIT" on Firebird it's very illegal
   */
  groupByDimensionLimit() {
    const limit = this.rowLimit && parseInt(this.rowLimit, 10) || 10000

    if (this.offset) {
      const from = parseInt(this.offset, 10)
      const to = from + limit
      return ` ROWS ${from} TO ${to}`
    }

    return ` ROWS ${limit}`
  }

  escapeColumnName(name) {
    return `"${name}"`;
  }

  convertTz(field) {
    // Needs timezone
    return `CAST(${field} AS DATE)`;
  }

  timeStampCast(value) {
    // Needs timezone
    return `CAST(${value} AS TIMESTAMP)`;
  }

  inDbTimeZone(date) {
    return this.inIntegrationTimeZone(date).clone().utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS);
  }

  dateTimeCast(value) {
    return `CAST(${value} AS TIMESTAMP)`;
  }

  subtractInterval(date, interval) {
    return `DATE_SUB(${date}, INTERVAL ${interval})`;
  }

  addInterval(date, interval) {
    return `DATE_ADD(${date}, INTERVAL ${interval})`;
  }

  timeGroupedColumn(granularity, dimension) {
    return GRANULARITY_TO_INTERVAL[granularity](dimension);
  }

  seriesSql(timeDimension) {
    const values = timeDimension.timeSeries().map(
      ([from, to]) => `select '${from}' f, '${to}' t`
    ).join(' UNION ALL ');
    return `SELECT TIMESTAMP(dates.f) date_from, TIMESTAMP(dates.t) date_to FROM (${values}) AS dates`;
  }

  concatStringsSql(strings) {
    return `CONCAT(${strings.join(", ")})`;
  }

  unixTimestampSql() {
    return `UNIX_TIMESTAMP()`;
  }
}

module.exports = FirebirdQuery;
