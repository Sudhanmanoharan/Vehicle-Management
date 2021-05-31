const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
logger.level = 'debug';


const getErrorMessage = (field) => {
    var response = {
        status: 'Failure',
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

const commonResponse = (status, message) => {
    var response = {
        status: status,
        message: message
    };
    return response;
}

module.exports = {
    getErrorMessage: getErrorMessage,
    logger: logger,
    commonResponse: commonResponse
}