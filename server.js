import express from "express";
const app = express();
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { contacts, nextId } from "./data.js";
const PORT = 3000;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Address Book API",
      version: "1.0.0",
      description: "Address Book API",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ["./server.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         firstName:
 *           type: string
 *           example: Alan
 *         lastName:
 *           type: string
 *           example: Turing
 *         email:
 *           type: string
 *           format: email
 *           example: alan.turing@auring.com
 *         phone:
 *           type: string
 *           example: 1234567890
 *         tag:
 *           type: string
 *           example: Work
 *     ContactCreate:
 *       type: object
 *       required:
 *         - firstName
 *         - email
 *       properties:
 *         firstName:
 *           type: string
 *           example: Alan
 *         lastName:
 *           type: string
 *           example: Turing
 *         email:
 *           type: string
 *           format: email
 *           example: alan.turing@auring.com
 *         phone:
 *           type: string
 *           example: 1234567890
 *         tag:
 *           type: string
 *           example: Work
 *     ContactUpdate:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         tag:
 *           type: string
 */

app.get("/", (req, res) => {
  res.send("go to /api-docs for api documentation");
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Kişi listesini getirir
 *     description: İsteğe bağlı olarak q sorgu parametresi ile kişi araması yapılabilir.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: false
 *         description: İsim, soyisim, e-posta veya etiket ile arama yapar
 *     responses:
 *       200:
 *         description: Kişi listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Contact'
 */
app.get("/api/contacts", (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : "";

  if (query) {
    const searchResults = contacts.filter(
      (contact) =>
        contact.firstName.toLowerCase().includes(query) ||
        contact.lastName.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.tag.toLowerCase().includes(query)
    );
    return res.json(searchResults);
  }

  res.json(contacts);
});

/**
 * @swagger
 * /api/contacts/{id}:
 *   get:
 *     summary: ID'ye göre kişi getirir
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Kişi bulundu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       404:
 *         description: Kişi bulunamadı
 */
app.get("/api/contacts/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const contact = contacts.find((c) => c.id === id);

  if (!contact) {
    return res.status(404).send("Contact not found.");
  }
  res.json(contact);
});

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: Yeni kişi oluşturur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactCreate'
 *     responses:
 *       201:
 *         description: Oluşturulan kişi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Zorunlu alanlar eksik
 */
app.post("/api/contacts", (req, res) => {
  const { firstName, lastName, email, phone, tag } = req.body;

  if (!firstName || !email) {
    return res.status(400).send("First Name and Email are required.");
  }

  const newContact = {
    id: nextId++,
    firstName,
    lastName,
    email,
    phone: phone || "",
    tag: tag || "General",
  };

  contacts.push(newContact);
  res.status(201).json(newContact);
});

/**
 * @swagger
 * /api/contacts/{id}:
 *   put:
 *     summary: Kişiyi günceller
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactUpdate'
 *     responses:
 *       200:
 *         description: Güncellenen kişi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Güncellemek için en az bir alan gerekli
 *       404:
 *         description: Kişi bulunamadı
 */
app.put("/api/contacts/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const contactIndex = contacts.findIndex((c) => c.id === id);

  if (contactIndex === -1) {
    return res.status(404).send("Contact not found.");
  }

  const { firstName, lastName, email, phone, tag } = req.body;

  if (!firstName && !lastName && !email && !phone && !tag) {
    return res.status(400).send("At least one field is required for update.");
  }

  const existingContact = contacts[contactIndex];

  existingContact.firstName = firstName || existingContact.firstName;
  existingContact.lastName = lastName || existingContact.lastName;
  existingContact.email = email || existingContact.email;
  existingContact.phone = phone || existingContact.phone;
  existingContact.tag = tag || existingContact.tag;

  contacts[contactIndex] = existingContact;

  res.json(existingContact);
});

/**
 * @swagger
 * /api/contacts/{id}:
 *   delete:
 *     summary: Kişiyi siler
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Başarıyla silindi
 *       404:
 *         description: Kişi bulunamadı
 */
app.delete("/api/contacts/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = contacts.length;

  contacts = contacts.filter((c) => c.id !== id);

  if (contacts.length === initialLength) {
    return res.status(404).send("Contact not found.");
  }

  res.status(204).send();
});

export default app;
