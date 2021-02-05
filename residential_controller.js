let elevatorID = 1
let floorRequestButtonID = 1
let callButtonID = 1


class Column {
    //----------ATTRIBUTES----------//
    constructor(_id, _status, _amountOfFloors, _amountOfElevators) {
        this.ID = _id
        this.status = _status
        this.amountOfFloors = _amountOfFloors
        this.amountOfElevators = _amountOfElevators
        this.elevatorsList = []
        this.callButtonsList = []


        this.createElevators(_amountOfFloors, _amountOfElevators)
        this.createCallButtons(_amountOfFloors)

        console.log("Column:", this.ID)
        console.log("Floors:", this.amountOfFloors)
        console.log("Elevators:", this.amountOfElevators)
    }

    //----------METHODS----------//

    createCallButtons(_amountOfFloors) {
        let buttonFloor = 1

        for (let i = 0; i < _amountOfFloors; i++) {
            if (buttonFloor < _amountOfFloors) {
                let callButton = new CallButton(callButtonID, 'off', buttonFloor, 'up')
                this.callButtonsList.push(callButton)
                callButtonID++
            }

            if (buttonFloor >= 2) {
                let callButton = new CallButton(callButtonID, 'off', buttonFloor, 'down')
                this.callButtonsList.push(callButton)
                callButtonID++
            }
            buttonFloor++
        }
    }

    createElevators(_amountOfFloors, _amountOfElevators) {
        for (let i = 0; i < _amountOfElevators; i++) {
            let elevator = new Elevator(elevatorID, 'idle', _amountOfFloors, 1)
            this.elevatorsList.push(elevator)
            elevatorID++
        }
    }

    //Simulate when a user press a button outside the elevator//
    requestElevator(_floor, _direction) {
        console.log("||-PASSENGER REQUESTS PICKUP AT FLOOR " + _floor + " TO GO " + _direction + "-||");
        let elevator = this.findElevator(_floor, _direction)
        elevator.floorRequestList.push(_floor)
        elevator.sortFloorList()
        console.log()
        console.log("ELEVATOR " + elevator.ID + " MOVES FROM FLOOR " + elevator.currentFloor + " TO GO TO FLOOR " + _floor)
        elevator.move()
        elevator.operateDoors()
        return elevator
    };

    //We use a score system depending on the current elevators state. Since the bestScore and the referenceGap are 
    //higher values than what could be possibly calculated, the first elevator will always become the default bestElevator, 
    //before being compared with to other elevators. If two elevators get the same score, the nearest one is prioritized.

    findElevator(requestedFloor, requestedDirection) {
        let bestElevatorInformations = {
            bestElevator: null,
            bestScore: 5,
            referenceGap: 10000000
        }

        this.elevatorsList.forEach(elevator => {
            //The elevator is at my floor and going in the direction I want//
            if (requestedFloor == elevator.currentFloor && elevator.status == 'stopped' && requestedDirection == elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(1, elevator, bestElevatorInformations, requestedFloor)
            }
            //The elevator is lower than me, is coming up and I want to go up//
            else if (requestedFloor > elevator.currentFloor && elevator.direction == 'up' && requestedDirection == elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(2, elevator, bestElevatorInformations, requestedFloor)
            }
            //The elevator is higher than me, is coming down and I want to go down//
            else if (requestedFloor < elevator.currentFloor && elevator.direction == 'down' && requestedDirection == elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(2, elevator, bestElevatorInformations, requestedFloor)
            }
            //The elevator is idle//
            else if (elevator.status == 'idle') {
                bestElevatorInformations = this.checkIfElevatorIsBetter(3, elevator, bestElevatorInformations, requestedFloor)
            }
            //The elevator is not available, but still could take the call nothing else better is found//
            else {
                bestElevatorInformations = this.checkIfElevatorIsBetter(4, elevator, bestElevatorInformations, requestedFloor)
            }
            let bestElevator = bestElevatorInformations.bestElevator
            let bestScore = bestElevatorInformations.bestScore
            let referenceGap = bestElevatorInformations.referenceGap
        });
        console.log();
        console.log(">>[ELEVATOR TO BE SENT]:");
        console.log(bestElevatorInformations.bestElevator);
        return bestElevatorInformations.bestElevator
    }

    checkIfElevatorIsBetter(scoreToCheck, newElevator, bestElevatorInformations, floor) {
        if (scoreToCheck < bestElevatorInformations.bestScore) {
            bestElevatorInformations.bestScore = scoreToCheck
            bestElevatorInformations.bestElevator = newElevator
            bestElevatorInformations.referenceGap = Math.abs(newElevator.currentFloor - floor)
        } else if (bestElevatorInformations.bestScore == scoreToCheck) {
            let gap = Math.abs(newElevator.currentFloor - floor)
            if (bestElevatorInformations.referenceGap > gap) {
                bestElevatorInformations.bestScore = scoreToCheck
                bestElevatorInformations.bestElevator = newElevator
                bestElevatorInformations.referenceGap = gap
            }
        }
        return bestElevatorInformations
    }
}

class Elevator {
    //----------ATTRIBUTES----------//
    constructor(_id, _status, _amountOfFloors, _currentFloor) {
        this.ID = _id
        this.status = _status
        this.amountOfFloors = _amountOfFloors
        this.currentFloor = _currentFloor
        this.direction;
        this.door = new Door(_id, 'closed')
        this.floorRequestButtonsList = []
        this.floorRequestList = []

        this.createFloorRequestButtons(_amountOfFloors)
    }

    //----------METHODS----------//

    createFloorRequestButtons(_amountOfFloors) {
        let buttonFloor = 1
        for (let i = 0; i < _amountOfFloors; i++) {
            let floorRequestButton = new FloorRequestButton(floorRequestButtonID, 'off', buttonFloor)
            this.floorRequestButtonsList.push(floorRequestButton)
            buttonFloor++
            floorRequestButtonID++
        }
    }

    //Simulate when a user press a button inside the elevator//
    requestFloor(_floor) {
        console.log();
        console.log("||-PASSENGER NOW INSIDE ELEVATOR REQUESTS TO GO TO FLOOR " + _floor + "-||");
        this.floorRequestList.push(_floor)
        this.sortFloorList()
        console.log()
        console.log("ELEVATOR " + this.ID + " MOVES FROM FLOOR " + this.currentFloor + " TO GO TO FLOOR " + _floor)
        this.move()
        this.operateDoors()
    }

    move() {
        while (this.floorRequestList.length != 0) {
            let destination = this.floorRequestList[0]
            this.status = 'moving'
            if (this.currentFloor < destination) {
                this.direction = 'up'
                while (this.currentFloor < destination) {
                    this.currentFloor++
                }
            } else if (this.currentFloor > destination) {
                this.direction = 'down'
                while (this.currentFloor > destination) {
                    this.currentFloor--
                }
            }
            this.status = 'stopped'
            this.floorRequestList.shift()
        }
        this.status = 'idle'
    }

    sortFloorList() {
        if (this.direction == 'up') {
            this.floorRequestList.sort(function (a, b) { return a - b });
        } else {
            this.floorRequestList.sort(function (a, b) { return b - a });
        }
    }

    operateDoors() {
        this.doorStatus = 'opened'
        //WAIT 5 SECONDS//
        if (!this.overweight) {
            this.door.status = 'closing'
            if (!this.door.obstruction) {
                this.door.status = 'closed'
            } else {
                this.door.obstruction = false
                this.operateDoors()
            }
        } else {
            while (this.overweight) {
                this.overweight = false
            }
            this.operateDoors()
        }
    }
}

class CallButton {
    constructor(_id, _status, _floor, _direction) {
        this.ID = _id
        this.status = _status
        this.floor = _floor
        this.direction = _direction
    }
}

class FloorRequestButton {
    constructor(_id, _status, _floor) {
        this.ID = _id
        this.status = _status
        this.floor = _floor
    }
}

class Door {
    constructor(_id, _status) {
        this.ID = _id
        this.status = _status
    }
}


//SCENARIO TERMINAL SIMULATIONS

//-----INSTRUCTIONS-----//

//TO SIMULATE A SCENARIO IN THE TERMINAL, SIMPLY UNCOMMENT (REMOVE THE #) THE DESIRED FUNCTION AT THE BOTTOM OF THE FILE (EXAMPLE: scenario1())//

//___________________________________________________________________________________________________________________________________________//


//----------------------SCENARIO 1---------------------//

//Elevator 1 is Idle at floor 2
//Elevator 2 is Idle at floor 6
//Someone is on floor 3 and wants to go to the 7th floor.
//Elevator 1 is expected to be sent.


function scenario1() {
    console.log()
    console.log("______________________________________________________________________________________________")
    console.log()
    console.log("--------------------SCENARIO #1--------------------")
    console.log()
    console.log("-----[REQUEST #1]-----")
    console.log()
    let column = new Column(1, 'online', 10, 2)
    column.elevatorsList[0].currentFloor = 2
    column.elevatorsList[1].currentFloor = 6
    console.log()
    let elevator = column.requestElevator(3, 'up')
    elevator.requestFloor(7)
    console.log()
    console.log("______________________________________________________________________________________________")
    console.log()
}



//----------------------SCENARIO 2---------------------//

//Elevator 1 is Idle at floor 10
//Elevator 2 is idle at floor 3
//Someone is on the 1st floor and requests the 6th floor.
//Elevator 2 should be sent.
//2 minutes later, someone else is on the 3rd floor and requests the 5th floor. Elevator 2 should be sent.
//Finally, a third person is at floor 9 and wants to go down to the 2nd floor.
//Elevator 1 should be sent.


function scenario2() {
    console.log()
    console.log("______________________________________________________________________________________________")
    console.log()
    console.log("--------------------SCENARIO #2--------------------")
    let column = new Column(1, 'online', 10, 2)
    column.elevatorsList[0].currentFloor = 10
    column.elevatorsList[1].currentFloor = 3
    console.log()
    console.log("-----[REQUEST #1]-----")
    console.log()
    let elevator = column.requestElevator(1, 'up')
    elevator.requestFloor(6)
    console.log()
    console.log()
    console.log("-----[REQUEST #2]-----")
    console.log()
    console.log()
    column.elevatorsList[1].currentFloor = 6
    elevator = column.requestElevator(3, 'up')
    elevator.requestFloor(5)
    console.log()
    console.log()
    console.log("-----[REQUEST #3]-----")
    console.log()
    console.log()
    elevator = column.requestElevator(9, 'down')
    elevator.requestFloor(2)
    console.log()
    console.log("______________________________________________________________________________________________")
    console.log()
}




//----------------------SCENARIO 3---------------------//

//Elevator A is Idle at floor 10
//Elevator B is Moving from floor 3 to floor 6
//Someone is on floor 3 and requests the 2nd floor.
//Elevator A should be sent.
//5 minutes later, someone else is on the 10th floor and wants to go to the 3rd. Elevator B should be sent.


function scenario3() {
    console.log()
    console.log("______________________________________________________________________________________________")
    console.log()
    console.log("--------------------SCENARIO #3--------------------")
    let column = new Column(1, 'online', 10, 2)
    column.elevatorsList[0].currentFloor = 10
    column.elevatorsList[1].currentFloor = 3
    column.elevatorsList[1].status = 'moving'
    console.log()
    console.log("-----[REQUEST #1]-----")
    console.log()
    let elevator = column.requestElevator(3, 'down')
    elevator.requestFloor(2)
    console.log()
    console.log("-----[REQUEST #2]-----")
    console.log()
    column.elevatorsList[1].currentFloor = 6
    column.elevatorsList[1].status = 'idle'
    elevator = column.requestElevator(10, 'down')
    elevator.requestFloor(3)
    console.log()
    console.log("______________________________________________________________________________________________")
    console.log()
}

//TO SIMULATE A SCENARIO IN THE TERMINAL, SIMPLY UNCOMMENT (REMOVE THE "//") THE DESIRED FUNCTION

//scenario1()
//scenario2()
//scenario3()


module.exports = { Column, Elevator, CallButton, FloorRequestButton, Door }

