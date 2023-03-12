'use strict';

const { Contract } = require('fabric-contract-api');
const { toDate } = require('../utils/timestamp');

class Car extends Contract {


    async node() {
        return ('Successfully Instantiated Car Chaincode');
    }

    async createCar(ctx, args) {

        let submitTx;
        const argsJson = JSON.parse(args);
        const keys = Object.keys(argsJson);
        const len = keys.length
        if (ctx.clientIdentity.getID() !== 'x509::/OU=client+OU=org1+OU=department1/CN=Manufacturer::/C=US/ST=California/L=San Francisco/O=org1.example.com/CN=ca.org1.example.com') {
            return ({ success: false, message: 'Only manufacturer can sell the car' });
        }
        if (len != 4) {
            return ({ success: false, message: 'Incorrect number of arguments. Expecting 4 arguments.' });
        }
        const carAsBytes = await ctx.stub.getState(argsJson.carId);
        if (carAsBytes.length !== 0) {
            return ({ success: false, message: `Car with ID ${argsJson.carId} already exist` });
        }
        const car = {
            docType: argsJson.docType,
            id: argsJson.carId,
            manufacturer: argsJson.manufacturer,
            model: argsJson.model,
            owner: 'Manufacturer',
            state: 'CREATED',
            txId: ctx.stub.getTxID(),
            createdAt: toDate(ctx.stub.getTxTimestamp()),
            updatedAt: toDate(ctx.stub.getTxTimestamp())
        };
        submitTx = await ctx.stub.putState(argsJson.carId, Buffer.from(JSON.stringify(car)));
        if (submitTx != null) {
            return ({ success: true, message: "New car details with ID " + argsJson.carId + " has been successfully created into the blockchain with Transaction ID " + ctx.stub.getTxID() });
        }
        else {
            return ({ success: false, message: "Error while submitting the request" });
        }
    }

    async deliverToDealer(ctx, args) {
        let submitTx;
        const argsJson = JSON.parse(args);
        const keys = Object.keys(argsJson);
        const len = keys.length
        if (ctx.clientIdentity.getID() !== 'x509::/OU=client+OU=org1+OU=department1/CN=Manufacturer::/C=US/ST=California/L=San Francisco/O=org1.example.com/CN=ca.org1.example.com') {
            return ({ success: false, message: 'Only manufacturer can deliver car to the Dealer' });
        }
        if (len != 1) {
            return ({ success: false, message: 'Incorrect number of arguments. Expecting 1 arguments.' });
        }
        const carAsBytes = await ctx.stub.getState(argsJson.carId);
        if (!carAsBytes || carAsBytes.length === 0) {
            return ({ success: false, message: `Car with ID ${argsJson.carId} does not exist` });
        }

        const car = JSON.parse(carAsBytes.toString());
        if (car.state !== 'CREATED') {
            return ({ success: false, message: `Car with ID ${argsJson.carId} is not in CREATED state` });
        }
        car.state = 'READY_FOR_SALE';
        car.owner = 'Dealer'            
        car.updatedAt = toDate(ctx.stub.getTxTimestamp())

        submitTx = await ctx.stub.putState(argsJson.carId, Buffer.from(JSON.stringify(car)));
        if (submitTx != null) {
            return ({ success: true, message: "Car has been successfully updated into the blockchain with Transaction ID " + ctx.stub.getTxID() });
        }
        else {
            return ({ success: false, message: "Error while submitting the request" });
        }
    }

    async sellToCustomer(ctx, args) {
        let submitTx;
        const argsJson = JSON.parse(args);
        const keys = Object.keys(argsJson);
        const len = keys.length
        if (ctx.clientIdentity.getID() !== 'x509::/OU=client+OU=org2+OU=department1/CN=Dealer::/C=US/ST=California/L=San Francisco/O=org2.example.com/CN=ca.org2.example.com') {
            return ({ success: false, message: 'Only Dealer can sell the car' });
        }

        if (len != 2) {
            return ({ success: false, message: 'Incorrect number of arguments. Expecting 2 arguments.' });
        }
        const carAsBytes = await ctx.stub.getState(argsJson.carId);
        if (!carAsBytes || carAsBytes.length === 0) {
            return ({ success: false, message: `Car with ID ${argsJson.carId} does not exist` });
        }
        const car = JSON.parse(carAsBytes.toString());
        if (car.state !== 'READY_FOR_SALE') {
            return ({ success: false, message: `Car with ID ${argsJson.carId} is not in READY_FOR_SALE state` });
        }

        car.owner = argsJson.owner;
        car.state = 'SOLD';
        car.updatedAt = toDate(ctx.stub.getTxTimestamp())
        submitTx = await ctx.stub.putState(argsJson.carId, Buffer.from(JSON.stringify(car)));
        if (submitTx != null) {
            return ({ success: true, message: "Car has been successfully sold and has been updated into the blockchain with Transaction ID " + ctx.stub.getTxID() });
        }
        else {
            return ({ success: false, message: "Error while submitting the request" });
        }
    }

    async getCarById(ctx, args) {

        const argsJson = JSON.parse(args);
        const keys = Object.keys(argsJson);
        const len = keys.length
        if (len != 2) {
            return ({ success: false, message: 'Incorrect number of arguments. Expecting 2 arguments.' });
        }
        const iterator = await ctx.stub.getQueryResult("{\"selector\":{\"docType\":\"" + argsJson.docType + "\",\"id\":\"" + argsJson.carId + "\"}}");
        if (iterator == null) {
            return ({ success: false, message: "Error in fetching details of the car" });
        }
        let results = {};
        const res = await iterator.next();
        if (res.value && res.value.value.toString()) {
            const Key = res.value.key;
            let Record;
            try {
                Record = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
                console.log(err);
                Record = res.value.value.toString('utf8');
            }
            results = { Key, Record };
        }
        if (res.done) {
            await iterator.close();
            return ({ success: true, message: results });
        }
    }

    async getHistoryByCarId(ctx, args) {

        const argsJson = JSON.parse(args);
        const keys = Object.keys(argsJson);
        const len = keys.length
        // To check if the number of arguments are correct
        if (len != 1) {
            return ({ success: false, message: 'Incorrect number of arguments. Expecting 1 arguments.' });
        }
        console.log('Car id is', argsJson.carId);
        const iterator = await ctx.stub.getHistoryForKey(argsJson.carId);
        const result = [];
        while (true) {
            let res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const txValue = JSON.parse(res.value.value.toString('utf8'));
                result.push(txValue);
            }
            if (res.done) {
                await iterator.close();
                return ({ success: true, message: result });
            }
        }
    }
}

module.exports = Car;
