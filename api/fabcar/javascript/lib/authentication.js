
'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const commonUtils = require('./commonUtils');
const HLFService = require('./hlfService');

const enrollAdmin = async (userOrg, ccp) => {
    try {
        /** Create a new CA client for interacting with the CA. */
        const caInfo = await HLFService.getCaInfo(userOrg, ccp);
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        /** Create a new file system based wallet for managing identities. */
        const walletPath = await HLFService.getWalletPath(userOrg);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        commonUtils.logger.debug(`Wallet path: ${walletPath}`);

        /** Check to see if we've already enrolled the admin user. */
        const identity = await wallet.get('admin');
        if (identity) {
            commonUtils.logger.debug('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        /** Enroll the admin user, and import the new identity into the wallet. */
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = await HLFService.createX509Identity(userOrg, enrollment);
        await wallet.put('admin', x509Identity);
        commonUtils.logger.debug('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        commonUtils.logger.error(`Failed to enroll admin user "admin": ${error}`);
        return error;
    }
}

const userRegister = async (username, userOrg) => {
    /** Load the network configuration */
    let ccp = await HLFService.getCCP(userOrg);

    /** Create a new CA client for interacting with the CA. */
    const caURL = await HLFService.getCAUrl(userOrg, ccp);
    const ca = new FabricCAServices(caURL);

    /** Create a new file system based wallet for managing identities. */
    const walletPath = await HLFService.getWalletPath(userOrg)
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    /** Check to see if we've already enrolled the user. */
    const userIdentity = await wallet.get(username);
    if (userIdentity) {
        commonUtils.logger.debug(`An identity for the user ${username} already exists in the wallet`);
        return commonUtils.commonResponse("Success", `An identity for the user ${username} already exists in the wallet`);
    }

    /** Check to see if we've already enrolled the admin user. */
    let adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
        commonUtils.logger.debug('An identity for the admin user "admin" does not exist in the wallet');
        await enrollAdmin(userOrg, ccp);
        adminIdentity = await wallet.get('admin');
        commonUtils.logger.debug("Admin Enrolled Successfully")
    }

    /** Build a user object for authenticating with the CA */
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');
    const secret = await ca.register({ affiliation: await HLFService.getAffiliation(userOrg), enrollmentID: username, role: 'client' }, adminUser);

    /** Register the user, enroll the user, and import the new identity into the wallet. */
    const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret });
    const x509Identity = await HLFService.createX509Identity(userOrg, enrollment);
    await wallet.put(username, x509Identity);
    commonUtils.logger.debug(`Successfully registered and enrolled admin user ${username} and imported it into the wallet`);

    return commonUtils.commonResponse("Success", username + ' enrolled Successfully');
}

const isUserRegistered = async (username, userOrg) => {
    const walletPath = await HLFService.getWalletPath(userOrg)
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const userIdentity = await wallet.get(username);
    if (userIdentity) {
        commonUtils.logger.fatal(`An identity for the user ${username} exists in the wallet`);
        return true
    }
    return false
}

module.exports = {
    userRegister: userRegister,
    isUserRegistered: isUserRegistered
}