'use strict';

const { Wallets, Gateway, DefaultEventHandlerStrategies } = require('fabric-network');
const commonUtils = require('./commonUtils');
const HLFService = require('./hlfService');

/** Create car, update car, update owner, delete car */
const invokeTransaction = async (channelName, chaincodeName, chanincodeFun, args, username, userOrg) => {
    try {
        /** Load the network configuration */
        let ccp = await HLFService.getCCP(userOrg);

        /** Create a new file system based wallet for managing identities. */
        const walletPath = await HLFService.getWalletPath(userOrg)
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        /** Get the userIdentity details from the wallet. */
        let identity = await wallet.get(username);
        if (!identity) {
            commonUtils.logger.error(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        /** Create a new gateway for connecting to our peer node. */
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        const network = await gateway.getNetwork(channelName);  // Get the network (channel) our contract is deployed to.
        const contract = network.getContract(chaincodeName);    // Get the contract from the network. 

        var result;
        var message;
        switch (chanincodeFun) {
            case "createCar":
                result = await contract.submitTransaction(chanincodeFun, args[0], args[1], args[2], args[3], args[4]);
                message = `Successfully added the car asset with key ${args[0]}`;
                break;
            case "changeCarOwner":
                result = await contract.submitTransaction(chanincodeFun, args[0], args[1]);
                message = `Successfully changed car owner with key ${args[0]}`;
                break;
            case "UpdateCar":
                result = await contract.submitTransaction(chanincodeFun, args[0], args[1], args[2], args[3], args[4]);
                message = `Successfully updated the car asset with key ${args[0]}`;
                break;
            case "DeleteCar":
                result = await contract.submitTransaction(chanincodeFun, args[0]);
                message = `Successfully deleted the car asset with key ${args[0]}`;
                break;
            case "QueryCar":
                result = await contract.evaluateTransaction(chanincodeFun, args[0]);
                message = `Successfully query the car asset with key ${args[0]}`;
                break;
            case "QueryAllCars":
                result = await contract.evaluateTransaction(chanincodeFun);
                message = `Successfully all query the car asset`;
                break;
            default:
                commonUtils.logger.fatal(`function is not avaiable ${chanincodeFun}`)
                return `function is not avaiable ${chanincodeFun}`;
        }
        await gateway.disconnect();

        let response = {
            message: message,
            result: result.toString()
        }

        return response;
    } catch (error) {
        commonUtils.logger.error(`Failed to submit transaction: ${error}`);
    }
}

module.exports = {
    invokeTransaction: invokeTransaction
}