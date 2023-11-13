const express = require('express');
const app = express();
const path = require('path');
const router = require('./routing/route1');

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
app.use(router);
app.use(express.static(path.join(__dirname,'public')))

app.listen(80,()=>{
    console.log('Start server');
})