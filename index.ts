require('dotenv').config()

import express from "express";
import { orchestrateRouter } from "./routes/orchestrate"
import { exampleRouter } from "./routes/example";
import { compensateRouter } from "./routes/compensate";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./docs/swagger.json"

const app = express();
const port = process?.env?.port || 8888;

// const TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImF1dGgiOiJST0xFX0FETUlOLFJPTEVfVVNFUiIsImV4cCI6MTcwMDU5MzQwM30.MtlA8ZYOSW_hqDDghNAIAp8mf14XjSBs0DFOedHCDUAeyRg7SmznI4HOSHfh7Ksy3bybGtqR1FNrUKt1FaBYIA";

// // Microservices endpoints
// const service1URL = 'http://localhost:8080/api';

// const headers = {
//   'Content-Type': 'application/json',
//   'Authorization': `Bearer ${TOKEN}`
// };

app.use(express.json());

app.use("/api/orchestrate", orchestrateRouter);

app.use("/api/examples", exampleRouter);

app.use("/api/compensate", compensateRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
