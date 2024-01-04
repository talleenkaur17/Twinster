const app=require("./app");
const { connectDatabse } = require("./config/database");
connectDatabse();

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);

});