import fs from 'fs';
import { once } from 'events';
import {promisify} from 'util';
import childProcess from 'child_process';

const exec = promisify(childProcess.exec);

var record = (queryResult) => {
    return queryResult.records.shift();
}

async function queryAllAccounts(conn) {
    let accounts = [];
    let qr = await conn.query("select id, name from Account");
    accounts = accounts.concat(qr.records);
    // console.log(qr);
    while (qr.done === false) {
        /* eslint no-await-in-loop: */

        qr = await conn.queryMore(qr.nextRecordsUrl);
        accounts = accounts.concat(qr.records);
    }
    return accounts;
}

async function queryAllAccountsWithLimit({ conn, argv }) {
    let accounts = [];
    let qr = await conn.query(
        `select id, name from Account limit ${argv.limit}`
    );
    accounts = accounts.concat(qr.records);
    // console.log(qr);
    while (qr.done === false) {
        qr = await conn.queryMore(qr.nextRecordsUrl);
        accounts = accounts.concat(qr.records);
    }
    return accounts;
}

// for testing, get a login running using sfdx
let loginWithSfdx = async ({sfdx, argv, jsforce}) => {
    let which = {json: true}
    if (argv && argv.targetusername) {
        which.targetusername =  argv.targetusername
    }
    const org = await sfdx.force.org.display(which);
    let conn = new jsforce.Connection(org);
    conn.bulk.pollTimeout = 6 * 60 * 1000; // Bulk timeout can be specified globally on the connection object
    conn.bulk.pollInterval = 15  * 1000; // seconds

    conn.org = record(await conn.query("select id, NamespacePrefix from Organization"));
    conn.namespace = (conn.org.NamespacePrefix || "PDLM");
    // console.log(org.instanceUrl, org.username, conn.namespace)
    return conn;
}

// output a query result showing only errors
let printResults = (what, results) => {
    results.forEach((r) => {
        //console.log(r)
        if (!r.success) {
            console.log(r); // print only those which are fails
        }
    });
    console.log(`loaded ${what} :`, results.length);
}

/**
 * provide a simple interface to write out a CSV file
 * and wait for it to flush to disk
 */

let writeFile = async ({ content, file }) => {
    // output the resulting file CSV
    const filehandle = fs.createWriteStream(file);
    filehandle.write(content);
    filehandle.end();
    await once(filehandle,'finish') // waits until the file is finished
};

/**
 * run a diff and return the result, fail if we see an exception
 * the calling test can check the stderr, stdout
 */

let compareFiles = async (a, b) => {
    let resp;
    try {
        resp = await exec(`diff -w ${a} ${b}`);
    } catch( e ) {
        console.error(e.cmd, e.stdout)
        resp = { stdout: e.stdout, stderr: e.stderr}
    }
    return resp;
}


async function bulkDel({ conn, records, table }) {
    console.log(`delete ${table} ${records.length}`);
    if (records.length === 0 || records[0] === undefined) {
        return;
    }
    const results = await conn.bulk.load(table, "delete", { concurrencyMode: 'Serial' }, records);
    const errs = results.filter((r) => !r.success);
    if (errs.length > 0) {
        console.log(errs);
    }
}

// Define the exports object
const testOnlyExports = {
    bulkDel,
    compareFiles,
    writeFile,
    printResults,
    record,
    queryAllAccounts,
    queryAllAccountsWithLimit,
    loginWithSfdx
};

// Export everything if in test environment, otherwise export nothing
export default (process.env.NODE_ENV === 'test' || process.env.MOCHA_TEST) ? testOnlyExports : {};
