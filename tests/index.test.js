const { default: axios } = require("axios");
const BACKEND_URL = "http://localhost:3000"
const WS_URL = "ws://localhost:3001"
describe("Authentication",()=>{
    test("User is able to sign up only once",async () =>{
        const username = "kirat"+Math.random();
        const password = "123456";
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type:"admin"
        }) 
        expect(response.status).toBe(200)
        const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type:"admin"
        }) 
        expect(updatedResponse.status).toBe(400)
    });
    test("Signup request fails if username is empty",async()=>{
        const username = "";
        const password = "123456";
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            password,
        });
        expected(response.status).toBe(400);
    })
})