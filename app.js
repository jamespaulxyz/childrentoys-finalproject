require("dotenv").config()
const admin = require("firebase-admin")

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
  }),
})

const express = require("express")
const app = express()

app.set("view engine", "ejs")
app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))

const apiRoutes = require("./routes/api")
const inventoryRoutes = require("./routes/inventory")

app.use("/inventory", inventoryRoutes)
app.use("/api", apiRoutes)

app.get("/", (req, res) => {
  res.render("index")
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Listening on port ${port} ...`)
})
