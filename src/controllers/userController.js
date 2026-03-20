const User = require("../models/User");

// ================================
// BULK CREATE USERS
// ================================
exports.bulkCreate = async (req, res) => {
  try {
    const users = req.body;

    // Validate input
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a non-empty array",
      });
    }

    if(users.length === 0){
      return res.status(400).json({error:'Array cannot be empty'});
    }

    const validUsers = [];
    const validationErrors = [];

    // 🔍 Pre-validation step (NO DB HIT)
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      try {
        const doc = new User(user);
        await doc.validate(); // mongoose schema validation

        validUsers.push(user);
      } catch (err) {
        validationErrors.push({
          index: i,
          errors: Object.values(err.errors).map((e) => e.message),
        });
      }
    }

    if(validUsers.length === 0){
      return res.status(400).json({
        message:'All records failed',
        validationErrors
      })
    }


    const result = await User.insertMany(users, {
      ordered: false,   // continue on error
      rawResult: true,  // gives detailed result
    });

    return res.status(201).json({
      success: true,
      message: "Users inserted successfully",
      insertedCount: result.length,
     validationErrors,
    });

  } catch (error) {
    // Handle partial failures
    if (error.writeErrors) {
      return res.status(207).json({
        success: false,
        message: "Partial success",
        insertedCount: error.result?.nInserted || 0,
        errors: error.writeErrors.map((err) => ({
          index: err.index,
          message: err.errmsg,
        })),
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================================
// BULK UPDATE USERS
// ================================
exports.bulkUpdate = async (req,res)=>{
  try{
    const userData = req.body;

    if(!Array.isArray(userData)){
      return res.json(400).json({error:'Request body must be a json'})
    }

    if (userData.length === 0){
      return res.json(400).json({error:'Array ceannot be empty'})
    }

    const bulkOperations = [];
    const failedOpations = [];

    userData.forEach((data,index)=>{
      const identifier = data.email | data.phone | data._id;
      
      const filter = {};
      if(data.email) filter.email = data.email;
      else if (data.phone) filter.phone = data.phone;
      else if (data._id) filter._id = data._id;

      const updateData = {...data};
      delete updateData._id;

      updateData.updatedAt = new Date();

      bulkOperations.push({
        updateOne:{
          filter:filter,
          update:{ $set: updateData },
          upsert: false
        }
      })
    })

    if(bulkOperations.length === 0){
      return res.json(400).json({
        message:'No valide update to perform',
        failedOpations
      })
    }

    const result = await User.bulkWrite(bulkOperations,{ordered: false});

    res.status(200).json({
      message:'Bulk Update proceed',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      failedOpations
    })

  } catch(err){
    console.log('Bulk Update Error',err);
    res.status(500).json({error:'Internal Server Error'})
  }
}