import express from "express" ;
import isAuthenticate from "../middleware/isAuthenticate.js"

import{sendMessage,getMessage} from "../controllers/chating.controller.js"
const router=express.Router();

router.route("/:id/send").post(isAuthenticate,sendMessage);
router.route("/:id/all").get(isAuthenticate,getMessage);

export default router;