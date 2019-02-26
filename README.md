Nodejs binlog tracer
==

Simple http and websocket server written in Nodejs to tap into a
mysql replication log and print to a webpage using websocket events.

    ./npm install
    ./npm start

Env vars
===

PORT       : port for server and websocket to listen on
MYSQL_HOST : host with mysql binlog with ROW logs enabled
MYSQL_PORT : port to mysql host
MYSQL_USER : username with replication permissions
MYSQL_PASS : password of above
