const express = require("express")
const router = express.Router()

const { getItemWithCurrentStock } = require("../utils/db")

router.get("/inventory/:itemId", async (req, res) => {
  const { itemId } = req.params
  const item = await getItemWithCurrentStock(itemId)

  res.json({
    message: "Item found",
    item,
  })
})

module.exports = router
