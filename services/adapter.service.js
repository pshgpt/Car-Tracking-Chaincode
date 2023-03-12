"use strict";

const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, X509WalletMixin, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const { stringify } = require('querystring');

module.exports = {
    name: "adapter",

    settings: {},

    dependencies: [],

    actions: {

        createUser: {
            async handler(ctx) {
                let username = ctx.params.userName;
                let orgName = ctx.params.orgName;
                let enrollAdminResponse = await this.enrollAdmin(orgName)
                if (enrollAdminResponse) {
                    let registerUserResponse = await this.registerUser(username, orgName)
                    return registerUserResponse;
                }
            }
        },

        invoke: {
            async handler(ctx) {
                let chaincodeCode = await this.invoke("mychannel", "mycc", ctx.params.fcn, ctx.params.args, ctx.params.userName, ctx.params.orgName)
                return chaincodeCode
            }
        },

        query: {
            async handler(ctx) {
                let chaincodeCode = await this.query("mychannel", "mycc", ctx.params.fcn, ctx.params.args, ctx.params.userName, ctx.params.orgName)
                return chaincodeCode

            }
        }
    },

    events: {},

    methods: {
        async enrollAdmin(orgName) {
            const ccpPath = path.resolve(__dirname, '..', 'artifacts', orgName.toLowerCase() + '.yaml');
            const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
            const ccp = yaml.safeLoad(ccpJSON);

            try {
                var adminOrg = "admin" + orgName;
                // Create a new CA client for interacting with the CA.
                const caInfo = ccp.certificateAuthorities['ca-' + orgName.toLowerCase()];
                const caTLSCACerts = caInfo.tlsCACerts.pem;
                const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

                // Create a new file system based wallet for managing identities.
                const walletPath = path.join(process.cwd(), 'wallet');
                const wallet = new FileSystemWallet(walletPath);
                console.log(`Wallet path: ${walletPath}`);

                // Check to see if we've already enrolled the admin user.
                const adminExists = await wallet.exists(adminOrg);
                if (adminExists) {
                    console.log('An identity for the admin user "admin" already exists in the wallet');
                    return true;
                }

                // Enroll the admin user, and import the new identity into the wallet.
                const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
                const identity = X509WalletMixin.createIdentity(orgName + 'MSP', enrollment.certificate, enrollment.key.toBytes());
                await wallet.import(adminOrg, identity);
                console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
                return true;

            } catch (error) {
                console.error(`Failed to enroll admin user "admin": ${error}`);
                return error;
            }
        },

        async registerUser(username, orgName) {
            const ccpPath = path.resolve(__dirname, '..', 'artifacts', orgName.toLowerCase() + '.yaml');
            try {
                var adminOrg = "admin" + orgName;
                const walletPath = path.join(process.cwd(), 'wallet');
                const wallet = new FileSystemWallet(walletPath);
                console.log(`Wallet path: ${walletPath}`);

                // Check to see if we've already enrolled the user.
                const userExists = await wallet.exists(username);
                if (userExists) {
                    console.log('An identity for the user "user1" already exists in the wallet');
                    return true;
                }

                // Check to see if we've already enrolled the admin user.
                const adminExists = await wallet.exists(adminOrg);
                if (!adminExists) {
                    console.log('An identity for the admin user "admin" does not exist in the wallet');
                    console.log('Run the enrollAdmin.js application before retrying');
                    return false;
                }

                // Create a new gateway for connecting to our peer node.
                const gateway = new Gateway();
                await gateway.connect(ccpPath, { wallet, identity: adminOrg, discovery: { enabled: true, asLocalhost: true } });

                // Get the CA client object from the gateway for interacting with the CA.
                const ca = gateway.getClient().getCertificateAuthority();
                const adminIdentity = gateway.getCurrentIdentity();

                // Register the user, enroll the user, and import the new identity into the wallet.
                const secret = await ca.register({ affiliation: (orgName.toLowerCase()) + '.department1', enrollmentID: username, role: 'client' }, adminIdentity);
                const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret });
                const userIdentity = X509WalletMixin.createIdentity(orgName + 'MSP', enrollment.certificate, enrollment.key.toBytes());
                await wallet.import(username, userIdentity);
                console.log('Successfully registered and enrolled admin user "user1" and imported it into the wallet');
                return true

            } catch (error) {
                console.error(`Failed to register user "user1": ${error}`);
                return error;
            }
        },

        async invoke(channelName, chaincodeName, fcn, args, username, orgName) {
            const ccpPath = path.resolve(__dirname, '..', 'artifacts', orgName.toLowerCase() + '.yaml');
            const gateway = new Gateway();
            try {
                if (gateway != null) {
                    // Create a new file system based wallet for managing identities.
                    const walletPath = path.join(process.cwd(), 'wallet');
                    const wallet = new FileSystemWallet(walletPath);
                    console.log(`Wallet path: ${walletPath}`);

                    const userExists = await wallet.exists(username);
                    if (!userExists) {
                        console.log('An identity for the user "user1" does not exist in the wallet');
                        console.log('Run the registerUser.js application before retrying');
                        return;
                    }
                    await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });
                    // Get the network (channel) our contract is deployed to.
                    const network = await gateway.getNetwork(channelName);

                    // Get the contract from the network.
                    const contract = network.getContract(chaincodeName);

                    // Create and Submit the specified transaction.
                    const transaction = contract.createTransaction(fcn);
                    return JSON.parse((await transaction.submit(JSON.stringify(args))).toString());
                    //return ("Transaction has been successfully submitted with transaction id " + transaction._transactionId._transaction_id);
                }
                else {
                    console.error("No gayeway initialized")
                }
            } catch (error) {
                console.error(`Failed to submit transaction: ${error}`);
                return error
            } finally {
                await gateway.disconnect();
            }
        },
        
        async query(channelName, chaincodeName, fcn, args, username, orgName) {
            const ccpPath = path.resolve(__dirname, '..', 'artifacts', orgName.toLowerCase() + '.yaml');
            const gateway = new Gateway();
            try {
                if (gateway != null) {
                    // Create a new file system based wallet for managing identities.
                    const walletPath = path.join(process.cwd(), 'wallet');
                    const wallet = new FileSystemWallet(walletPath);
                    console.log(`Wallet path: ${walletPath}`);

                    // Check to see if we've already enrolled the user.
                    const userExists = await wallet.exists(username);
                    if (!userExists) {
                        console.log('An identity for the user "user1" does not exist in the wallet');
                        console.log('Run the registerUser.js application before retrying');
                        return;
                    }

                    // Create a new gateway for connecting to our peer node.
                    await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });

                    // Get the network (channel) our contract is deployed to.
                    const network = await gateway.getNetwork(channelName);

                    // Get the contract from the network.
                    const contract = network.getContract(chaincodeName);

                    // Create and Submit the specified transaction.
                    const transaction = contract.createTransaction(fcn);
                    var result = await transaction.evaluate(JSON.stringify(args));
                    return JSON.parse(result.toString());

                } else {
                    console.error("No gateway initialized");
                }
            } catch (error) {
                console.error(`Failed to submit transaction: ${error}`);
                return error
            } finally {
                await gateway.disconnect();
            }
        }
    },

    created() { },

    async started() { },

    async stopped() { }
};
