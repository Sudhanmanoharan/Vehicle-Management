package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

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

type carPrivateDetails struct {
	Owner string `json:"owner"`
	Price string `json:"price"`
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

// CreatePrivateCar Car for Owner and Price.
func (s *SmartContract) CreatePrivateCar(ctx contractapi.TransactionContextInterface, args []string) (string, error) {

	type carTransientInput struct {
		Make  string `json:"make"` //the fieldtags are needed to keep case from bouncing around
		Model string `json:"model"`
		Color string `json:"color"`
		Owner string `json:"owner"`
		Price string `json:"price"`
		Key   string `json:"key"`
	}

	if len(args) != 0 {
		return " Error ", fmt.Errorf("Incorrect number of arguments. Private marble data must be passed in transient map")
	}

	transMap, err := ctx.GetStub().GetTransient()

	if err != nil {
		return " Error ", fmt.Errorf("Get Transient State Error")
	}

	carDataAsBytes, _ := transMap["car"]

	var carInput carTransientInput
	_ = json.Unmarshal(carDataAsBytes, &carInput)

	carAsBytes, err := ctx.GetStub().GetPrivateData("collectionCars", carInput.Key)

	if err != nil {
		return " Error ", fmt.Errorf("Get Private Data Collection Error")
	} else if carAsBytes != nil {
		return "Car Key already exists in priavte data ", fmt.Errorf("Already Exists. %s", carInput.Key)
	}

	var car = Car{Make: carInput.Make, Model: carInput.Model, Colour: carInput.Color, Owner: carInput.Owner}

	carAsBytes, err = json.Marshal(car)
	if err != nil {
		return "", err
	}

	privateDataStatus := ctx.GetStub().PutPrivateData("collectionCars", carInput.Key, carAsBytes)

	if privateDataStatus != nil {
		return " Error ", fmt.Errorf("Put Private Data Collection Error %s", privateDataStatus.Error())
	}

	carPrivateDetails := &carPrivateDetails{Owner: carInput.Owner, Price: carInput.Price}

	carPrivateDetailsAsBytes, err := json.Marshal(carPrivateDetails)
	if err != nil {
		return "", err
	}

	privateCollectionStatus := ctx.GetStub().PutPrivateData("collectionCarPrivateDetails", carInput.Key, carPrivateDetailsAsBytes)

	if privateCollectionStatus != nil {
		return " Error ", fmt.Errorf("Put Private Data Collection Error %s", privateCollectionStatus.Error())
	}

	return "Private Car Data Added Successfully", nil
}

// ReadCarPrivateDetails Car for Owner and Price.
func (s *SmartContract) ReadCarPrivateDetails(ctx contractapi.TransactionContextInterface, args []string) (*carPrivateDetails, error) {

	if len(args) != 1 {
		return nil, fmt.Errorf("Incorrect number of arguments. Expecting 1")
	}

	carAsBytes, err := ctx.GetStub().GetPrivateData("collectionCarPrivateDetails", args[0])

	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get private details for " + args[0] + ": " + err.Error() + "\"}"
		return nil, fmt.Errorf(jsonResp)
	} else if carAsBytes == nil {
		jsonResp := "{\"Error\":\"Marble private details does not exist: " + args[0] + "\"}"
		return nil, fmt.Errorf(jsonResp)
	}

	carPrivateDetails := new(carPrivateDetails)
	_ = json.Unmarshal(carAsBytes, carPrivateDetails)

	return carPrivateDetails, nil
}

// UpdatePrivateData Car for Owner and Price.
func (s *SmartContract) UpdatePrivateData(ctx contractapi.TransactionContextInterface, args []string) (string, error) {

	type carTransientInput struct {
		Owner string `json:"owner"`
		Price string `json:"price"`
		Key   string `json:"key"`
	}

	if len(args) != 0 {
		return "", fmt.Errorf("Incorrect number of arguments. Private marble data must be passed in transient map")
	}

	transMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return "", fmt.Errorf("Error getting transient: " + err.Error())
	}

	carDataAsBytes, status := transMap["car"]
	if !status {
		return "", fmt.Errorf("car must be a key in the transient map")
	}

	if len(carDataAsBytes) == 0 {
		return "", fmt.Errorf("car value in the transient map must be a non-empty JSON string")
	}

	var carInput carTransientInput
	_ = json.Unmarshal(carDataAsBytes, &carInput)

	if err != nil {
		return "", fmt.Errorf("Failed to decode JSON of: " + string(carDataAsBytes) + "Error is : " + err.Error())
	}

	carPrivateDetails := &carPrivateDetails{Owner: carInput.Owner, Price: carInput.Price}

	carPrivateDetailsAsBytes, err := json.Marshal(carPrivateDetails)
	if err != nil {
		return "", fmt.Errorf(err.Error())
	}

	updatePrivateStatus := ctx.GetStub().PutPrivateData("collectionCarPrivateDetails", carInput.Key, carPrivateDetailsAsBytes)
	if updatePrivateStatus != nil {
		return "", fmt.Errorf(updatePrivateStatus.Error())
	}

	return " Private Car Data Updated Successfully", nil

}

// GetHistoryForAsset for any a key.
func (s *SmartContract) GetHistoryForAsset(ctx contractapi.TransactionContextInterface, args []string) (string, error) {

	if len(args) < 1 {
		return "", fmt.Errorf("Incorrect number of arguments. Expecting 1")
	}

	carName := args[0]

	resultsIterator, err := ctx.GetStub().GetHistoryForKey(carName)
	if err != nil {
		return "", fmt.Errorf(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing historic values for the marble
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return "", fmt.Errorf(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Value\":")
		// if it was a delete operation on given key, then we need to set the
		//corresponding value null. Else, we will write the response.Value
		//as-is (as the Value itself a JSON marble)
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"Timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"IsDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(response.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- getHistoryForAsset returning:\n%s\n", buffer.String())

	return string(buffer.Bytes()), nil
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
