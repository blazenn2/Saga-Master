import express from "express";
import {
  orchestrateRouter
} from "./routes/orchestrate"

const app = express();
const port = 8888;

// const TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImF1dGgiOiJST0xFX0FETUlOLFJPTEVfVVNFUiIsImV4cCI6MTcwMDU5MzQwM30.MtlA8ZYOSW_hqDDghNAIAp8mf14XjSBs0DFOedHCDUAeyRg7SmznI4HOSHfh7Ksy3bybGtqR1FNrUKt1FaBYIA";

// // Microservices endpoints
// const service1URL = 'http://localhost:8080/api';

// const headers = {
//   'Content-Type': 'application/json',
//   'Authorization': `Bearer ${TOKEN}`
// };

app.use(express.json());

app.use("/api/orchestrate", orchestrateRouter)

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
