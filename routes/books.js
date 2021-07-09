const express = require("express");
const router = new express.Router();
const Book = require("../models/book");
const ExpressError = require('../expressError');

const { validate } = require('jsonschema');
const bookSchemaPost = require('../schema/bookSchemaPost');
const bookSchemaPut = require('../schema/bookSchemaPut');

/** GET / => {books: [book, ...]}  */

router.get("/", async (req, res, next) => {
  try {
    const books = await Book.findAll();
    return res.json({ books });
  } catch (e) {
    return next(e);
  }
});

/** GET /[id]  => {book: book} */

router.get("/:id", async (req, res, next) => {
  try {
    const book = await Book.findOne(req.params.id);
    return res.json({ book });
  } catch (e) {
    return next(e);
  }
});

/** POST /   bookData => {book: newBook}  */

router.post("/", async (req, res, next) => {
  try {
    const validation = validate(req.body, bookSchemaPost);
    if (!validation.valid) {
      return next(new ExpressError(validation.errors.map(e => e.stack), 400));
    }
    const book = await Book.create(req.body);
    return res.status(201).json({ book });
  } catch (e) {
    return next(e);
  };
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put("/:isbn", async (req, res, next) => {
  try {
    if (req.body.isbn) {
      return next(new ExpressError("Not allowed to alter ISBN", 400));
    }
    const validation = validate(req.body, bookSchemaPut);
    if (!validation.valid) {
      return next(new ExpressError(validation.errors.map(e => e.stack), 400));
    }
    const book = await Book.update(req.params.isbn, req.body);
    return res.json({ book });
  } catch (e) {
    return next(e);
  };
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async (req, res, next) => {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
