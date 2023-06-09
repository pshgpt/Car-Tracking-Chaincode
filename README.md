# Car-Tracking-Chaincode


createCar(ctx, args): This method is used by the manufacturer to create a new car record. It takes four arguments: docType (document type), carId, manufacturer, and model. The method checks that the client creating the car is the manufacturer, and that the correct number of arguments have been supplied. If these checks pass, the method creates a new car object with the given properties, sets the owner to the manufacturer, and the state to "CREATED". The car object is then stored in the blockchain.


deliverToDealer(ctx, args): This method is used by the manufacturer to indicate that a car has been delivered to a dealer. It takes one argument: carId. The method checks that the client is the manufacturer, that the correct number of arguments have been supplied, and that the car is in the "CREATED" state. If these checks pass, the method updates the car object's state to "READY_FOR_SALE" and sets the owner to the dealer.


sellToCustomer(ctx, args): This method is used by the dealer to sell a car to a customer. It takes two arguments: carId and owner. The method checks that the client is the dealer, that the correct number of arguments have been supplied, and that the car is in the "READY_FOR_SALE" state. If these checks pass, the method updates the car object's state to "SOLD" and sets the owner to the customer.


getCarById(ctx, args): This method is used to retrieve a car object by its ID. It takes two arguments: docType and carId. The method checks that the correct number of arguments have been supplied, and returns the car object if it exists in the blockchain.


getHistoryByCarId(ctx, args): This method is used to retrieve the history of a car object by its ID. It takes one arguments: carId. The method checks that the correct number of arguments have been supplied, and returns the history of the car object if it exists in the blockchain.
