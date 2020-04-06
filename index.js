const dgraph = require("dgraph-js");
const grpc = require("grpc");
// Add this to the VERY top of the first file loaded in your app
const apm = require('elastic-apm-node').start({
    // Override service name from package.json
    // Allowed characters: a-z, A-Z, 0-9, -, _, and space
    serviceName: 'ai-simple-server',

    // Use if APM Server requires a token
    secretToken: 'changeme',

    // Set custom APM Server URL (default: http://localhost:8200)
    serverUrl: 'secret',
})
var express = require('express');

// Create a client stub.
function newClientStub() {
    return new dgraph.DgraphClientStub("172.18.0.1:9080", grpc.credentials.createInsecure());
}

// Create a client.
function newClient(clientStub) {
    return new dgraph.DgraphClient(clientStub);
}

// Drop All - discard all data and start from a clean slate.
async function dropAll(dgraphClient) {
    const op = new dgraph.Operation();
    op.setDropAll(true);
    await dgraphClient.alter(op);
}

// Set schema.
async function setSchema(dgraphClient) {
    const schema = `
        name: string @index(exact) .
        age: int .
        married: bool .
        loc: geo .
        dob: datetime .
        friend: [uid] @reverse .
    `;
    const op = new dgraph.Operation();
    op.setSchema(schema);
    await dgraphClient.alter(op);
}

// Create data using JSON.
async function createData(dgraphClient) {
    // Create a new transaction.
    const txn = dgraphClient.newTxn();
    try {
        // Create data.
        const p = {
            uid: "_:alice",
            name: "Alice",
            age: 26,
            married: true,
            loc: {
                type: "Point",
                coordinates: [1.1, 2],
            },
            dob: new Date(1980, 1, 1, 23, 0, 0, 0),
            friend: [
                {
                    name: "Bob",
                    age: 24,
                },
                {
                    name: "Charlie",
                    age: 29,
                }
            ],
            school: [
                {
                    name: "Crown Public School",
                }
            ]
        };

        // Run mutation.
        const mu = new dgraph.Mutation();
        mu.setSetJson(p);
        const response = await txn.mutate(mu);

        // Commit transaction.
        await txn.commit();

        // Get uid of the outermost object (person named "Alice").
        // Response#getUidsMap() returns a map from blank node names to uids.
        // For a json mutation, blank node label is used for the name of the created nodes.
        console.log(`Created person named "Alice" with uid = ${response.getUidsMap().get("alice")}\n`);

        console.log("All created nodes (map from blank node names to uids):");
        response.getUidsMap().forEach((uid, key) => console.log(`${key} => ${uid}`));
        console.log();
    } finally {
        // Clean up. Calling this after txn.commit() is a no-op
        // and hence safe.
        await txn.discard();
    }
}

// Query for data.
async function queryData(dgraphClient) {
    // Run query.
    const query = `query all($a: string) {
        all(func: eq(name, $a)) {
            uid
            name
            age
            married
            loc
            dob
            friend {
                name
                age
            }
            school {
                name
            }
        }
    }`;
    const vars = { $a: "Alice" };
    const res = await dgraphClient.newTxn().queryWithVars(query, vars);
    const ppl = res.getJson();

    return ppl;
}

async function queryAll(dgraphClient) {
    const query = ` query {
            ppl(func: has(name)) {
              name
              age
            }  
    }`;
    const res = await dgraphClient.newTxn().queryWithVars(query);
    const ppl = res.getJson();

    return ppl;
}

var app = express();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.get('/', async function (req, res) {
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    await dropAll(dgraphClient);
    await setSchema(dgraphClient);
    await createData(dgraphClient);
    // Close the client stub.
    dgraphClientStub.close();
    res.send({ status: "Done!" });
})


app.get('/alice', async function (req, res) {
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    var ppl = await queryData(dgraphClient);
    // Close the client stub.
    dgraphClientStub.close();
    res.send(ppl.all);
})

app.get('/people', async function (req, res) {
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    var ppl = await queryAll(dgraphClient);
    // Close the client stub.
    dgraphClientStub.close();
    res.send(ppl.ppl);
})

var server = app.listen(4000, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})
