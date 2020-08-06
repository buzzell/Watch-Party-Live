const express = require("express");
const path = require("path");
const routes = require('./routes')(express);

var app = express();
if(process.env.NODE_ENV === 'production') {
    const enforce = require('express-sslify');
    app.use(enforce.HTTPS({ trustProtoHeader: true }))
}
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use("/", routes);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error',{err:err});
});

module.exports = app;