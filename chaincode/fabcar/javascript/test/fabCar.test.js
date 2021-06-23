'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const Fabcar = require('../lib/fabcar.js');

let assert = sinon.assert;
chai.use(sinonChai);

describe('Fab Car Funtionality Tests Cases', () => {
    let transactionContext, chaincodeStub, car;

    beforeEach(() => {
        transactionContext = new Context();
        chaincodeStub = sinon.createStubInstance(ChaincodeStub);
        transactionContext.setChaincodeStub(chaincodeStub);

        chaincodeStub.putState.callsFake((key, value) => {
            if (!chaincodeStub.states) {
                chaincodeStub.states = {};
            }
            chaincodeStub.states[key] = value;
        });

        chaincodeStub.getState.callsFake(async (key) => {
            let ret;
            if (chaincodeStub.states) {
                ret = chaincodeStub.states[key];
            }
            return Promise.resolve(ret);
        });

        chaincodeStub.deleteState.callsFake(async (key) => {
            if (chaincodeStub.states) {
                delete chaincodeStub.states[key];
            }
            return Promise.resolve(key);
        });
       
        car = {
            color: 'blue',
            make: 'Toyota',
            model: 'Prius',
            owner: 'Tomoko'
        };
    });

    describe('Test InitLedger', () => {
        it('should return error on InitLedger', async () => {
            chaincodeStub.putState.rejects('failed inserting key');
            let fabCar = new Fabcar();
            try {
                await fabCar.InitLedger(transactionContext);
                assert.fail('InitLedger should have failed');
            } catch (err) {
                expect(err.name).to.equal('failed inserting key');
            }
        });

        it('should return success on InitLedger', async () => {
            let fabCar = new Fabcar();
            await fabCar.InitLedger(transactionContext);
            let ret = JSON.parse((await chaincodeStub.getState('CAR0')).toString());
            expect(ret).to.eql(Object.assign({ docType: 'car' }, car));
        });
    });

    describe('Test CreateCar', () => {
        it('should return success on CreateAsset', async () => {
            let fabCar = new Fabcar();
            await fabCar.createCar(transactionContext, 'CAR0', car.make, car.model, car.color, car.owner);

            let ret = JSON.parse((await chaincodeStub.getState('CAR0')).toString());
            expect(ret).to.eql(car);
        });
    });

    describe('Test ReadCar', () => {
        it('should return success on ReadCar', async () => {
            let fabCar = new Fabcar();
            await fabCar.createCar(transactionContext, 'CAR0', car.make, car.model, car.color, car.owner);

            let ret = JSON.parse(await chaincodeStub.getState('CAR0'));
            expect(ret).to.eql(car);
        });
    });

    describe('Test UpdateCar', () => {
        it('should return success on UpdateCar', async () => {
            let fabCar = new Fabcar();
            await fabCar.createCar(transactionContext, 'CAR0', car.make, car.model, car.color, car.owner);

            await fabCar.UpdateCar(transactionContext, 'CAR0', car.make, car.model, car.color, 'Sudhan Manoharan');
            let ret = JSON.parse(await chaincodeStub.getState('CAR0'));
            let expected = {
                color: 'blue',
                make: 'Toyota',
                model: 'Prius',
                owner: 'Sudhan Manoharan'
            };
            expect(ret).to.eql(expected);
        });
    });

    describe('Test DeleteCar', () => {
        it('should return success on DeleteCar', async () => {
            let fabCar = new Fabcar();
            await fabCar.createCar(transactionContext, 'CAR0', car.make, car.model, car.color, car.owner);

            await fabCar.DeleteCar(transactionContext, 'CAR0');
            let ret = await chaincodeStub.getState('CAR0');
            expect(ret).to.equal(undefined);
        });
    });

});