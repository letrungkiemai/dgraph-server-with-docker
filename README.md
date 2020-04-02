## Playground

A simple nodejs server connected to dgraph

To spin up:

`docker build -t ai/dgraph-api .`

`docker-compose up`

Connect:

`localhost:4000/ ` will create schema and populate data

`localhost:4000/alice` returns all nodes named Alice

`localhost:4000/people` return all people nodes
