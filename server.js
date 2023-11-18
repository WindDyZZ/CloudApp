
// this use in case can not run 'npm start' command

const express = require('express');
const app = express();
const port = 3000;

// Set EJS as the view engine and specify the 'views' folder
app.set('view engine', 'ejs');
app.set('views', 'views');

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Define a route to render the 'home.ejs' file
app.get('/', (req, res) => {
  res.render('cart'); // Pass data to the EJS file
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});



// npm install express ejs
// node server.js
