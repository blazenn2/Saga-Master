# SAGA MASTER

Saga Master is a Saga Orchestrator whose sole purpose is to manage transactions between microservices. It follows Saga Framework and can be easily integration into an existing environment without major architectural constraints.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/blazenn2/Saga-Master
    cd yourproject
    ```

2. Install dependencies:
    ```bash
    npm install -f
    ```

3. Set up environment variables:
    Create a `.env` file in the root directory of your project and add the necessary environment variables. You can refer to `.env.example` for the required variables.


To build Docker Image use the following command:
    ```bash
    docker build -t saga-master -f dockerfile .
    ```

The dockerfile contains all the necessary environment variables. Adjust it accordingly to your requirements.

## Usage

1. Start the server:
    ```bash
    npm start
    ```

2. The server will be running at:
    ```
    http://localhost:8888
    ```

To run the Docker Image, use the below command:
    ```
    docker run -it --rm --name saga-master -p {port_mapping} saga-master:latest
    ```

## API Endpoints

### Setup

#### Create Setup
- **URL:** `/setup`
- **Method:** `POST`
- **Description:** Sets up the saga master.
- **Example_Body:**
    ```json
   {
    "url": "create-payment-intend",
    "setup": [
            {
                "communicateType": "REST",
                "apiType": "POST",
                "apiUrl": "http://localhost:8080/api/invoices",
                "compensateApiUrl": "http://localhost:8080/api/invoices",
                "compensateApiType": "DELETE",
                "compensatePathVariable": "id",
                "serviceName": "order",
                "sendResponseToAPI": false,
                "triggerCompensate": true
            },
            {
                "communicateType": "REST",
                "apiType": "POST",
                "apiUrl": "http://localhost:8000/api/products",
                "compensateApiUrl": "http://localhost:8000/api/products",
                "compensateApiType": "DELETE",
                "compensatePathVariable": "id",
                "serviceName": "inventory",
                "sendResponseToAPI": true,
                "triggerCompensate": true
            },
            {
                "communicateType": "REST",
                "apiType": "POST",
                "apiUrl": "http://localhost/payment-php/create-payment.php",
                "compensateApiUrl": "http://localhost/payment-php/create-payment-rollback.php",
                "compensateApiType": "POST",
                "compensatePathVariable": "paymentId",
                "serviceName": "payment",
                "sendResponseToAPI": true,
                "triggerCompensate": true
            },
            {
                "communicateType": "REST",
                "apiType": "POST",
                "apiUrl": "http://localhost:8089/notifications",
                "compensateApiUrl": "",
                "serviceName": "notify",
                "sendResponseToAPI": true,
                "triggerCompensate": false
            }
        ]
    }
    ```

#### Update Setup
- **URL:** `/setup/:url`
- **Method:** `PUT`
- **Description:** Updates an existing setup.

#### Delete Setup
- **URL:** `/setup/:url`
- **Method:** `DELETE`
- **Description:** Deletes an existing setup.

#### Get Setup
- **URL:** `/setup`
- **Method:** `GET`
- **Description:** Retrieves the current setup.

### Orchestrator

#### Trigger Orchestrator
- **URL:** `/trigger/:url`
- **Method:** `POST`
- **Description:** Triggers the orchestrator against the setup done in the setup process.

## Configuration

Configuration options can be set using environment variables. Below are the key configuration options:

- `PORT`: Port number on which the server will run (default: `8888`).
<!-- - `DB_URI`: URI of the database.
- `JWT_SECRET`: Secret key for JWT authentication.
- `NODE_ENV`: Environment (development, production). -->

<!-- ## Running Tests

1. Run unit tests:
    ```bash
    npm test
    ```

2. Run linting:
    ```bash
    npm run lint
    ``` -->

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.