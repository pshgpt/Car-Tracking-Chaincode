"use strict";

const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, X509WalletMixin, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

module.exports = {
    name: "adapter",

    settings: {},

    dependencies: [],

    actions: {

        createUser: {
            async handler(ctx) {
                const username = ctx.params.userName;
                const orgName = ctx.params.orgName;
                const roleValue = ctx.params.roleValue;
                const enrollAdminResponse = await this.enrollAdmin(orgName)
                if (enrollAdminResponse) {
                    return await this.registerUser(username, orgName, roleValue)
                }
            }
        },

        invoke: {
            async handler(ctx) {
                return await this.invoke("mychannel", "mycc", ctx.params.fcn, ctx.params.args, ctx.params.userName, ctx.params.orgName)
            }
        },

        query: {
            async handler(ctx) {
                return await this.query("mychannel", "mycc", ctx.params.fcn, ctx.params.args, ctx.params.userName, ctx.params.orgName)
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
                const adminOrg = "admin" + orgName;
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

        async registerUser(username, orgName, roleValue) {
            const ccpPath = path.resolve(__dirname, '..', 'artifacts', orgName.toLowerCase() + '.yaml');
            try {
                const adminOrg = "admin" + orgName;
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
                // let affiliation = orgName.toLowerCase() + '.department1';
                // const affiliationService = caClient.newAffiliationService();
                // const registeredAffiliations = await affiliationService.getAll(adminIdentity);
                // if(!registeredAffiliations.result.affiliations.some(x => x.name == orgName.toLowerCase())) {
                // 		console.log('Register new affiliations: %s ', affiliation);
                // 		await affiliationService.create({name: affiliation, force: true}, adminIdentity);
                // 	}

                // Register the user, enroll the user, and import the new identity into the wallet.
                const secret = await ca.register({ affiliation: (orgName.toLowerCase()) + '.department1', enrollmentID: username, role: 'client', attrs: [{ name: 'role', value: roleValue, ecert: true }] }, adminIdentity);
                const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret, attr_reqs: [{ name: 'role', optional: false }] });
                const userIdentity = X509WalletMixin.createIdentity(orgName + 'MSP', enrollment.certificate, enrollment.key.toBytes());
                await wallet.import(username, userIdentity);
                return ({ success: true, message: `Successfully registered and enrolled user ${username} and imported it into the wallet` });
            } catch (error) {
                console.error(`Failed to register user ${username}: ${error}`);
                return error;
            }
        },

        async invoke(channelName, chaincodeName, fcn, args, username, orgName) {
            const ccpPath = path.resolve(__dirname, '..', 'artifacts', orgName.toLowerCase() + '.yaml');
            const gateway = new Gateway();
            try {
                if (gateway !== null) {
                    // Create a new file system based wallet for managing identities.
                    const walletPath = path.join(process.cwd(), 'wallet');
                    const wallet = new FileSystemWallet(walletPath);
                    console.log(`Wallet path: ${walletPath}`);

                    const userExists = await wallet.exists(username);
                    if (!userExists) {
                        console.log('An identity for the user "user1" does not exist in the wallet');
                        console.log('Run the registerUser.js application before retrying');
                        return ({ success: false, message: `An identity for the user ${username} does not exist in the wallet. Please register the user first.` });
                    }
                    await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });
                    // Get the network (channel) our contract is deployed to.
                    const network = await gateway.getNetwork(channelName);

                    // Get the contract from the network.
                    const contract = network.getContract(chaincodeName);

                    // Create and Submit the specified transaction.
                    const transaction = contract.createTransaction(fcn);
                    return JSON.parse((await transaction.submit(JSON.stringify(args))));
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
                if (gateway !== null) {
                    // Create a new file system based wallet for managing identities.
                    const walletPath = path.join(process.cwd(), 'wallet');
                    const wallet = new FileSystemWallet(walletPath);
                    console.log(`Wallet path: ${walletPath}`);

                    // Check to see if we've already enrolled the user.
                    const userExists = await wallet.exists(username);
                    if (!userExists) {
                        console.log('An identity for the user "user1" does not exist in the wallet');
                        console.log('Run the registerUser.js application before retrying');
                        return ({ success: false, message: `An identity for the user ${username} does not exist in the wallet. Please register the user first.` });
                    }

                    // Create a new gateway for connecting to our peer node.
                    await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });

                    // Get the network (channel) our contract is deployed to.
                    const network = await gateway.getNetwork(channelName);

                    // Get the contract from the network.
                    const contract = network.getContract(chaincodeName);

                    // Create and Submit the specified transaction.
                    const transaction = contract.createTransaction(fcn);
                    const result = await transaction.evaluate(JSON.stringify(args));
                    return JSON.parse(result);
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
