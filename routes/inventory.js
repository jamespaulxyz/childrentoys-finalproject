const express = require("express")
const router = express.Router()

const multer = require("multer")
const upload = multer({ dest: "uploads/" })

const {
  getAllItems,
  getItem,
  getItemStockHistory,
  createItem,
  editItem,
  editItemWithImage,
  recordItemStock,
} = require("../utils/db")

router.get("/", async (req, res) => {
  const inventoryItems = await getAllItems()

  res.render("inventory/index", {
    inventoryItems,
  })
})

router.get("/create", (req, res) => {
  res.render("inventory/create")
})

router.post("/", upload.single("image"), async (req, res) => {
  const { name, description, price } = req.body

  const imageFile = req.file

  if (!imageFile) {
    res.status(400).json({
      message: "Missing or invalid image file",
    })
    return
  }

  await createItem(name, description, price, imageFile)

  res.redirect(`/inventory`)
})

router.get("/:itemId/show", async (req, res) => {
  const { itemId } = req.params

  const item = await getItem(itemId)
  const stockHistory = await getItemStockHistory(itemId)

  res.render("inventory/show", {
    item,
    stockHistory,
  })
})

router.get("/:itemId/record", (req, res) => {
  const { itemId } = req.params

  res.render("inventory/record", {
    itemId,
  })
})

router.post("/:itemId/record", async (req, res) => {
  const { amount, operation } = req.body
  const { itemId } = req.params

  await recordItemStock(itemId, amount, operation)

  res.redirect(`/inventory/${itemId}/show`)
})

router.get("/:itemId/edit", async (req, res) => {
  const { itemId } = req.params
  const item = await getItem(itemId)

  res.render("inventory/edit", { item })
})

router.post("/:itemId/update", upload.single("image"), async (req, res) => {
  const { itemId } = req.params
  const { name, description, price } = req.body
  const imageFile = req.file

  if (imageFile)
    await editItemWithImage(itemId, name, description, price, imageFile)
  else await editItem(itemId, name, description, price)

  res.redirect(`/inventory/${itemId}/show`)
})

module.exports = router
