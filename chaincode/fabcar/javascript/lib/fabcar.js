'use strict';

const { Contract } = require('fabric-contract-api');

class FabCar extends Contract {

    async InitLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const cars = [
            {
                color: 'blue',
                make: 'Toyota',
                model: 'Prius',
                owner: 'Tomoko',
            },
            {
                color: 'red',
                make: 'Ford',
                model: 'Mustang',
                owner: 'Brad',
            },
            {
                color: 'green',
                make: 'Hyundai',
                model: 'Tucson',
                owner: 'Jin Soo',
            },
            {
                color: 'yellow',
                make: 'Volkswagen',
                model: 'Passat',
                owner: 'Max',
            },
            {
                color: 'black',
                make: 'Tesla',
                model: 'S',
                owner: 'Adriana',
            },
            {
                color: 'purple',
                make: 'Peugeot',
                model: '205',
                owner: 'Michel',
            },
            {
                color: 'white',
                make: 'Chery',
                model: 'S22L',
                owner: 'Aarav',
            },
            {
                color: 'violet',
                make: 'Fiat',
                model: 'Punto',
                owner: 'Pari',
            },
            {
                color: 'indigo',
                make: 'Tata',
                model: 'Nano',
                owner: 'Valeria',
            },
            {
                color: 'brown',
                make: 'Holden',
                model: 'Barina',
                owner: 'Shotaro',
            },
        ];
        for (let i = 0; i < cars.length; i++) {
            cars[i].docType = 'car';
            await ctx.stub.putState('CAR' + i, Buffer.from(JSON.stringify(cars[i])));
            console.info('Added <--> ', cars[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async createCar(ctx, carNumber, make, model, color, owner) {
        console.info('============= START : Create Car ===========');

        const car = {
            "color": color,
            "make": make,
            "model": model,
            "owner": owner,
        };

        await ctx.stub.putState(carNumber, Buffer.from(JSON.stringify(car)));
        console.info('============= END : Create Car ===========');
        return `${carNumber} added successfully`;
    }

    async QueryCar(ctx, carNumber) {
        console.info('============= START : Query Car ===========');
        const carAsBytes = await ctx.stub.getState(carNumber); // get the car from chaincode state
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${carNumber} does not exist`);
        }
        console.info('============= END : Query Car ===========');
        return carAsBytes.toString();
    }

    async QueryAllCars(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const { key, value } of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async UpdateCar(ctx, carNumber, make, model, color, owner) {
        console.info('============= START : Update Car ===========');
        const carAsBytes = await this.QueryCar(ctx, carNumber);
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${carNumber} does not exist`);
        }
        const car = {
            "color": color,
            "make": make,
            "model": model,
            "owner": owner,
        };
        await ctx.stub.putState(carNumber, Buffer.from(JSON.stringify(car)));
        console.info('============= END : Update Car ===========');
        return `${carNumber} udapted successfully`;
    }

    async ChangeCarOwner(ctx, carNumber, newOwner) {
        console.info('============= START : changeCarOwner ===========');

        const carAsBytes = await ctx.stub.getState(carNumber); // get the car from chaincode state
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${carNumber} does not exist`);
        }
        const car = JSON.parse(carAsBytes.toString());
        car.owner = newOwner;

        await ctx.stub.putState(carNumber, Buffer.from(JSON.stringify(car)));
        console.info('============= END : changeCarOwner ===========');
        return `${carNumber} owner name changed successfully`;
    }

    async DeleteCar(ctx, carNumber) {
        console.info('============= START : Delete Car ===========');
        const carAsBytes = await this.QueryCar(ctx, carNumber);
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${carNumber} does not exist`);
        }
        await ctx.stub.deleteState(carNumber);
        console.info('============= END : Delete Car ===========');
        return `${carNumber} car deleted successfully`;
    }

    async CreatePrivateCar(ctx) {
        console.info('============= START : Create Private Car ===========');

        var transMap = ctx.stub.getTransient();
        var carDataAsBytes = transMap.get('car').toString('utf8');
        var parse = JSON.parse(carDataAsBytes)
        var carCollection = await ctx.stub.getPrivateData("collectionCars", parse.key);

        if (!carCollection) {
            return "Error : Car Key already exists in priavte data Already Exists." + carCollection.Error();
        }
        const car = {
            "color": parse.color,
            "make": parse.make,
            "model": parse.model,
            "owner": parse.owner,
        };

        var carAsBytes = Buffer.from(JSON.stringify(car));
        var privateDataStatus = await ctx.stub.putPrivateData("collectionCars", parse.key, carAsBytes);

        if (!privateDataStatus) {
            return " Error : Put Private Data Collection Error" + privateDataStatus.Error();
        }

        var carPrivateDetails = { "owner": parse.owner, "price": parse.price };
        var carPrivateDetailsAsBytes = Buffer.from(JSON.stringify(carPrivateDetails));
        var privateCollectionStatus = await ctx.stub.putPrivateData("collectionCarPrivateDetails", parse.key, carPrivateDetailsAsBytes);

        if (!privateCollectionStatus) {
            return " Error Put Private Data Collection Error " + privateCollectionStatus.Error();
        }

        console.info('============= END : Create Private Car ===========');
        return `${parse.key} Private Car Data Added Successfully`;
    }

    async ReadPrivateCar(ctx, carNumber) {
        console.info('============= START : Read Private Car ===========');

        var carAsBytes = await ctx.stub.getPrivateData("collectionCarPrivateDetails", carNumber);

        if (!carAsBytes) {
            return "Error : Car Number does note exists in private data collection." + carAsBytes.Error();
        }
        console.info('============= END : Read Private Car ===========');

        return JSON.parse(carAsBytes.toString());
    }

    async UpdatePrivateCar(ctx) {
        console.info('============= START : Update Private Car ===========');

        var transMap = ctx.stub.getTransient();

        if (!transMap) {
            return " Error : Get Transient State Error " + transMap.Error();
        }

        var carDataAsBytes = JSON.parse(transMap.get('car'));

        var carPrivateDetails = { "owner": carDataAsBytes.owner, "price": carDataAsBytes.price };
        var carPrivateDetailsAsBytes = Buffer.from(JSON.stringify(carPrivateDetails));
        var privateCollectionStatus = await ctx.stub.putPrivateData("collectionCarPrivateDetails", carDataAsBytes.key, carPrivateDetailsAsBytes);

        if (!privateCollectionStatus) {
            return " Error Put Private Data Collection Error" + privateCollectionStatus.Error();
        }

        console.info('============= END : Update Private Car ===========');
        return `${carDataAsBytes.key} Private Car Data Updated Successfully`;
    }

    async GetHistoryForAsset(ctx, args) {
        console.info('============= START : Get History For Asset  Car ===========');

        let iterator = await ctx.stub.getHistoryForKey(args);
        let result = [];
        let res = await iterator.next();
        while (!res.done) {
            if (res.value) {
                console.info(`found state update with value: ${res.value.value.toString('utf8')}`);
                const obj = JSON.parse(res.value.value.toString('utf8'));
                result.push(obj);
            }
            res = await iterator.next();
        }
        await iterator.close();
        console.info('============= END : Get History For Asset  Car ===========');
        return result;
    }

    async RestictedMethod(ctx, carNumber) {
        console.info('============= START : Resticted Asset Car ===========');

        var cid = ctx.clientIdentity.assertAttributeValue("role", "approver");
        var getAttr = ctx.clientIdentity.getAttributeValue("role");

        if (cid == false) {
            return "Only user with role as APPROVER have access to this method!";
        } else if (getAttr != "approver") {
            return "Only user with role as APPROVER have access to this method!";
        }

        var carAsBytes = await ctx.stub.getState(carNumber);
        if (!carAsBytes || carAsBytes.length === 0) {
            return (`${carNumber} does not exist`);
        }

        console.info('============= END : Resticted Asset Car ===========');
        return JSON.parse(carAsBytes.toString());
    }

}

module.exports = FabCar;
