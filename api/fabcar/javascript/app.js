"use strict"
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const expressJWT = require('express-jwt');
const jwt = require('jsonwebtoken');
const bearerToken = require('express-bearer-token');
const cors = require('cors');
const util = require('util');
const http = require('http');
const constants = require('./config/constants.json')

const host = process.env.HOST || constants.host;
const port = process.env.PORT || constants.port;

const commonUtils = require('./lib/commonUtils');
const authService = require('./lib/authentication');
const invokeHLF = require('./lib/invokeHLF');

app.options('*', cors());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.set('secret', constants.jwtSecretKey);
app.use(expressJWT({
    secret: constants.jwtSecretKey,
    algorithms: ['HS256']
}).unless({
    path: ['/users', '/users/login', '/users/register']
}));
app.use(bearerToken());

app.use((req, res, next) => {
    // if (err.name === 'UnauthorizedError') {
    //     return res.status(403).send({
    //         success: false,
    //         message: 'Failed to authenticate token. Make sure to include the ' +
    //             'token returned from /users call in the authorization header ' +
    //             ' as a Bearer token'
    //     });
    // }
    commonUtils.logger.debug('New req for %s', req.originalUrl);
    if (req.originalUrl.indexOf('/users') >= 0 || req.originalUrl.indexOf('/users/login') >= 0 || req.originalUrl.indexOf('/users/register') >= 0) {
        return next();
    }
    var token = req.token;
    jwt.verify(token, app.get('secret'), { algorithms: ['sha1', 'RS256', 'HS256'] }, (err, decoded) => {
        console.log("coming inside the verify --> ")
        try {
            if (err) {
                console.log(`Error ================:${err}`)
                res.send({
                    success: false,
                    message: 'Failed to authenticate token. Make sure to include the ' +
                        'token returned from /users call in the authorization header ' +
                        ' as a Bearer token'
                });
                return;
            } else {
                req.username = decoded.username;
                req.orgname = decoded.orgName;
                commonUtils.logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgName));
                return next();
            }

        } catch (err) {
            res.send({
                success: false,
                message: err
            });
            return;
        }
    });
});

/** * Enroll User 
    * EnrollAdmin if not exist  */
app.post('/users/register', async (req, res) => {
    var username = req.body.username;
    var orgName = req.body.orgName;
    if (!username) {
        res.json(commonUtils.getErrorMessage('username'));
        return;
    }
    if (!orgName) {
        res.json(commonUtils.getErrorMessage('orgName'));
        return;
    }
    var token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
        username: username,
        orgName: orgName,
        algorithm: 'HS256'
    }, app.get('secret'));

    let response = await authService.userRegister(username, orgName);
    if (response && typeof response !== 'string') {
        commonUtils.logger.debug('Successfully registered the username %s for organization %s', username, orgName);
        response.token = token;
        res.json(response);
    } else {
        commonUtils.logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
        res.json({ success: false, message: response });
    }
});

/** User login and get token */
app.post('/users/login', async (req, res) => {
    var username = req.body.username;
    var orgName = req.body.orgName;
    if (!username) {
        res.json(commonUtils.getErrorMessage('username'));
        return;
    }
    if (!orgName) {
        res.json(commonUtils.getErrorMessage('orgName'));
        return;
    }
    var token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
        username: username,
        orgName: orgName,
        algorithm: 'HS256'
    }, app.get('secret'));

    let isUserRegistered = await authService.isUserRegistered(username, orgName);
    if (isUserRegistered) {
        res.json({ success: 'Success', message: { token: token } });

    } else {
        res.json({ success: 'Failure', message: `User with username ${username} is not registered with ${orgName}, Please register first.` });
    }

})

/** Invoke transaction on chaincode */
app.post('/channel/:channelName/chaincodes/:chaincodeName', async (req, res) => {
    try {
        commonUtils.logger.info("*************** Invoke Trancation Start **************");
        var channelName = req.params.channelName;
        var chaincodeName = req.params.chaincodeName;
        var functionName = req.body.functionName;
        var transient = req.body.transient;
        var args = req.body.args;

        let message = await invokeHLF.invokeTransaction(channelName, chaincodeName, functionName, args, req.username, req.orgname, transient);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);
        commonUtils.logger.info("*************** Invoke Trancation End **************");
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/users', async (req, res) => {

});


var server = http.createServer(app).listen(port, function () { commonUtils.logger.fatal(`Server started on ${port}`) });
commonUtils.logger.info('****************** SERVER STARTED ************************');
commonUtils.logger.info('***************  http://%s:%s  ******************', host, port);
server.timeout = 240000;



/**
    ERROR Handling
    Security
    Mongo DB
*/





