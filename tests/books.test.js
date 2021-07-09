/** Integration tests for books route */


process.env.NODE_ENV = "test"

const request = require("supertest");


const app = require("../app");
const db = require("../db");


// isbn of sample book
let book_isbn;


beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO books 
    (isbn, amazon_url, author, language, pages, publisher, title, year)   
      VALUES
      (
        '0987654321',
        'http://a.co/eobPtX2',
        'Matthew Lane',
        'english',
        264,
        'Princeton University Press',
        'Power-Up: Unlocking the Hidden Mathematics in Video Games',
        2017
      ) 
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn
});


describe("POST /books", () => {
  test("Creates a new book", async () => {
    const response = await request(app)
      .post(`/books`)
      .send({
        isbn: '1234567890',
        amazon_url: "http://a.co/aoeUhT1",
        author: "Testerson Test",
        language: "english",
        pages: 999,
        publisher: "Princeton University Press",
        title: "Another Test Book",
        year: 2021
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("Prevents creating book without required title", async () => {
    const response = await request(app)
      .post(`/books`)
      .send({ year: 2017 });
    expect(response.statusCode).toBe(400);
  });
});


describe("GET /books", () => {
  test("Gets a list of 1 book", async () => {
    const response = await request(app).get(`/books`);
    const books = response.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("amazon_url");
  });
});


describe("GET /books/:isbn", () => {
  test("Gets a single book", async () => {
    const response = await request(app)
      .get(`/books/${book_isbn}`)
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(book_isbn);
  });

  test("Responds with 404 if can't find book in question", async () => {
    const response = await request(app)
      .get(`/books/999`)
    expect(response.statusCode).toBe(404);
  });
});


describe("PUT /books/:id", () => {
  test("Updates a single book", async () => {
    const response = await request(app)
      .put(`/books/${book_isbn}`)
      .send({
        amazon_url: "https://taco.com",
        author: "mctest",
        language: "english",
        pages: 1000,
        publisher: "yeah right",
        title: "UPDATED BOOK",
        year: 2000
      });
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.title).toBe("UPDATED BOOK");
  });

  test("Prevents a bad book update", async () => {
    const response = await request(app)
      .put(`/books/${book_isbn}`)
      .send({
        isbn: "32794782",
        badField: "DO NOT ADD ME!",
        amazon_url: "https://taco.com",
        author: "mctest",
        language: "english",
        pages: 1000,
        publisher: "yeah right",
        title: "UPDATED BOOK",
        year: 2000
      });
    expect(response.statusCode).toBe(400);
  });

  test("Responds 404 if can't find book in question", async () => {
    // delete book first
    await request(app)
      .delete(`/books/${book_isbn}`)
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.statusCode).toBe(404);
  });
});


describe("DELETE /books/:id", () => {
  test("Deletes a single a book", async () => {
    const response = await request(app)
      .delete(`/books/${book_isbn}`)
    expect(response.body).toEqual({ message: "Book deleted" });
  });
});


afterEach(async () => {
  await db.query("DELETE FROM BOOKS");
});


afterAll(async () => {
  await db.end()
});
