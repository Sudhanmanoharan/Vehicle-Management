package main

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing a car
type SmartContract struct {
	contractapi.Contract
}

// Car describes basic details of what makes up a car
type Car struct {
	Make   string `json:"make"`
	Model  string `json:"model"`
	Colour string `json:"colour"`
	Owner  string `json:"owner"`
}

// QueryResult structure used for handling result of query
type QueryResult struct {
	Key    string `json:"Key"`
	Record *Car
}

// InitLedger adds a base set of cars to the ledger
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) (string, error) {
	cars := []Car{
		Car{Make: "Toyota", Model: "Prius", Colour: "blue", Owner: "Tomoko"},
		Car{Make: "Ford", Model: "Mustang", Colour: "red", Owner: "Brad"},
		Car{Make: "Hyundai", Model: "Tucson", Colour: "green", Owner: "Jin Soo"},
		Car{Make: "Volkswagen", Model: "Passat", Colour: "yellow", Owner: "Max"},
		Car{Make: "Tesla", Model: "S", Colour: "black", Owner: "Adriana"},
		Car{Make: "Peugeot", Model: "205", Colour: "purple", Owner: "Michel"},
		Car{Make: "Chery", Model: "S22L", Colour: "white", Owner: "Aarav"},
		Car{Make: "Fiat", Model: "Punto", Colour: "violet", Owner: "Pari"},
		Car{Make: "Tata", Model: "Nano", Colour: "indigo", Owner: "Valeria"},
		Car{Make: "Holden", Model: "Barina", Colour: "brown", Owner: "Shotaro"},
	}

	for i, car := range cars {
		carAsBytes, _ := json.Marshal(car)
		err := ctx.GetStub().PutState("CAR"+strconv.Itoa(i), carAsBytes)

		if err != nil {
			return "Error while adding to Word State DB", fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
	}

	return "Inserted successfully", nil
}

// CreateCar adds a new car to the world state with given details
func (s *SmartContract) CreateCar(ctx contractapi.TransactionContextInterface, carNumber string, make string, model string, colour string, owner string) (string, error) {
	exists, err := s.QueryCar(ctx, carNumber)

	if err == nil {
		return "", fmt.Errorf("the car %s already exists", err.Error())
	}

	if exists != nil {
		return "", fmt.Errorf("the car %s already exists", carNumber)
	}

	car := Car{
		Make:   make,
		Model:  model,
		Colour: colour,
		Owner:  owner,
	}
	carAsBytes, _ := json.Marshal(car)
	result := ctx.GetStub().PutState(carNumber, carAsBytes)
	if result != nil {
		return "Error while adding to Word State DB", fmt.Errorf("Failed to put to world state. %s", result.Error())
	}
	return "Inserted successfully", nil
}

// QueryCar returns the car stored in the world state with given id
func (s *SmartContract) QueryCar(ctx contractapi.TransactionContextInterface, carNumber string) (*Car, error) {
	carAsBytes, err := ctx.GetStub().GetState(carNumber)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if carAsBytes == nil {
		return nil, fmt.Errorf("%s does not exist", carNumber)
	}

	car := new(Car)
	_ = json.Unmarshal(carAsBytes, car)

	return car, nil
}

// QueryAllCars returns all cars found in world state
func (s *SmartContract) QueryAllCars(ctx contractapi.TransactionContextInterface) ([]QueryResult, error) {
	startKey := ""
	endKey := ""

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []QueryResult{}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		car := new(Car)
		_ = json.Unmarshal(queryResponse.Value, car)

		queryResult := QueryResult{Key: queryResponse.Key, Record: car}
		results = append(results, queryResult)
	}

	return results, nil
}

// UpdateCar updates an existing asset in the world state with provided parameters.
func (s *SmartContract) UpdateCar(ctx contractapi.TransactionContextInterface, carNumber string, make string, model string, colour string, owner string) (string, error) {
	exists, err := s.QueryCar(ctx, carNumber)
	if err != nil {
		return "", err
	}

	if exists == nil {
		return "", fmt.Errorf("the car %s does not exist", carNumber)
	}

	car := Car{
		Make:   make,
		Model:  model,
		Colour: colour,
		Owner:  owner,
	}

	carAsBytes, err := json.Marshal(car)
	if err != nil {
		return "", err
	}

	updateCar := ctx.GetStub().PutState(carNumber, carAsBytes)

	if updateCar != nil {
		return "Error while updating the car", fmt.Errorf("Failed to update in world state. %s", updateCar.Error())
	}

	return "Car updated successfully", nil
}

// ChangeCarOwner updates the owner field of car with given id in world state
func (s *SmartContract) ChangeCarOwner(ctx contractapi.TransactionContextInterface, carNumber string, newOwner string) (string, error) {
	car, err := s.QueryCar(ctx, carNumber)

	if err != nil {
		return "", err
	}

	car.Owner = newOwner

	carAsBytes, _ := json.Marshal(car)

	changeOwner := ctx.GetStub().PutState(carNumber, carAsBytes)

	if changeOwner != nil {
		return "Error while change car ownership", fmt.Errorf("Failed to update in world state. %s", changeOwner.Error())
	}

	return "Ownership updated successfully", nil
}

// DeleteCar deletes an given car from the world state.
func (s *SmartContract) DeleteCar(ctx contractapi.TransactionContextInterface, carNumber string) (string, error) {
	car, err := s.QueryCar(ctx, carNumber)
	if err != nil {
		return "", err
	}
	if car == nil {
		return "Error ", fmt.Errorf("the car %s does not exist", carNumber)
	}

	carStatus := ctx.GetStub().DelState(carNumber)

	if carStatus != nil {
		return "Error while deleting car", fmt.Errorf("Failed to delete to world state. %s", carStatus.Error())
	}

	return "Car Deleted Successfully", nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(new(SmartContract))
	if err != nil {
		fmt.Printf("Error create fabcar chaincode: %s", err.Error())
		return
	}
	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting fabcar chaincode: %s", err.Error())
	}
}
