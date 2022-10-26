const admin = require("firebase-admin")
const db = admin.firestore()
const storage = admin.storage()

async function getAllItems() {
  const inventoryItemsRef = db.collection("items")
  const snapshot = await inventoryItemsRef.get()
  const inventoryItems = []

  if (!snapshot.empty) {
    snapshot.forEach(async (document) => {
      inventoryItems.push({
        id: document.id,
        ...document.data(),
      })
    })
  }

  const inventoryItemsWithStock = inventoryItems.map(async (item) => {
    const stockHistoryRef = db
      .collection("items")
      .doc(item.id)
      .collection("stockHistory")

    const stockHistorySnapshot = await stockHistoryRef.get()
    const stockHistory = []

    if (!stockHistorySnapshot.empty)
      stockHistorySnapshot.forEach((document) => {
        stockHistory.push({
          id: document.id,
          ...document.data(),
        })
      })

    const currentStock = stockHistory.reduce((prev, current) => {
      if (current.operation === "add") return prev + current.amount
      else if (current.operation === "remove") return prev - current.amount
      else return prev
    }, 0)

    return {
      ...item,
      currentStock,
    }
  })

  return await Promise.all(inventoryItemsWithStock)
}

async function getItem(itemId) {
  const itemRef = db.collection("items").doc(itemId)
  const itemDoc = await itemRef.get()

  return {
    id: itemDoc.id,
    ...itemDoc.data(),
  }
}

async function getItemWithCurrentStock(itemId) {
  const itemRef = db.collection("items").doc(itemId)
  const itemDoc = await itemRef.get()

  const stockHistoryRef = db
    .collection("items")
    .doc(itemId)
    .collection("stockHistory")

  const stockHistorySnapshot = await stockHistoryRef
    .orderBy("createdAt", "asc")
    .get()
  const stockHistory = []

  if (!stockHistorySnapshot.empty)
    stockHistorySnapshot.forEach((document) => {
      stockHistory.push({
        id: document.id,
        ...document.data(),
      })
    })

  const currentStock = stockHistory.reduce((prev, current) => {
    if (current.operation === "add") return prev + current.amount
    else if (current.operation === "remove") return prev - current.amount
    else return prev
  }, 0)

  return {
    id: itemDoc.id,
    ...itemDoc.data(),
    currentStock,
  }
}

async function getItemStockHistory(itemId) {
  const stockHistoryRef = db
    .collection("items")
    .doc(itemId)
    .collection("stockHistory")

  const stockHistorySnapshot = await stockHistoryRef
    .orderBy("createdAt", "asc")
    .get()
  const stockHistory = []

  if (!stockHistorySnapshot.empty)
    stockHistorySnapshot.forEach((document) => {
      stockHistory.push({
        id: document.id,
        ...document.data(),
      })
    })

  return stockHistory
}

async function createItem(name, description, price, imageFile) {
  const itemRef = db.collection("items").doc()

  const bucket = storage.bucket(
    `gs://${process.env.FIREBASE_ADMIN_PROJECT_ID}.appspot.com`
  )
  await bucket.upload(imageFile.path, {
    destination: `itemImages/${itemRef.id}`,
  })

  const d = new Date()
  const date = new Date(d.setFullYear(d.getFullYear() + 200)).toString()

  const file = bucket.file(`itemImages/${itemRef.id}`)
  const signedUrls = await file.getSignedUrl({
    action: "read",
    expires: date,
  })

  await itemRef.set({
    name,
    description,
    price,
    image: [signedUrls[0]],
  })
}

async function editItem(itemId, name, description, price) {
  const itemRef = db.collection("items").doc(itemId)
  await itemRef.set(
    {
      name,
      description,
      price,
    },
    {
      merge: true,
    }
  )
}

async function editItemWithImage(itemId, name, description, price, imageFile) {
  const bucket = storage.bucket(
    `gs://${process.env.FIREBASE_ADMIN_PROJECT_ID}.appspot.com`
  )
  await bucket.upload(imageFile.path, {
    destination: `itemImages/${itemId}`,
  })

  const d = new Date()
  const date = new Date(d.setFullYear(d.getFullYear() + 200)).toString()

  const file = bucket.file(`itemImages/${itemId}`)
  const signedUrls = await file.getSignedUrl({
    action: "read",
    expires: date,
  })

  const itemRef = db.collection("items").doc(itemId)
  await itemRef.set(
    {
      name,
      description,
      price,
      image: [signedUrls[0]],
    },
    {
      merge: true,
    }
  )
}

async function recordItemStock(itemId, amount, operation) {
  await db
    .collection("items")
    .doc(itemId)
    .collection("stockHistory")
    .doc()
    .set({
      operation,
      amount: parseInt(amount),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
}

module.exports = {
  getAllItems,
  getItem,
  getItemStockHistory,
  getItemWithCurrentStock,
  createItem,
  editItem,
  editItemWithImage,
  recordItemStock,
}
