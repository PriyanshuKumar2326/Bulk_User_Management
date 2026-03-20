const express = require("express");
const router = express.Router();


const userController = require("../controllers/userController");

router.post('/bulk-create',userController.bulkCreate);
router.post('/bulk-update',userController.bulkUpdate);

module.exports = router;