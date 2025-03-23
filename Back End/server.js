const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
app.use(express.json());

const apiRoutes = require('./routes/apiRoutes');

app.use('/api',apiRoutes);

const PORT = 3000;
app.listen(PORT,() =>{
    console.log(`Server is running on http://localhost:${PORT}`);
    
});