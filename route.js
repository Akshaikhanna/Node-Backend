const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "Bookstore",
  multipleStatements: true,
});

con.connect((err) => {
  if (err) {
    console.error("Invalid Database connection");
    return;
  }
  console.log("Database connected");

  // ----------basic level----------
  app.get("/authors", (req, res) => {
    con.query("SELECT * FROM authors", (err, data) => {
      if (err) {
        console.error("Error fetching authors", err);
        res.status(500).send("Internal Server Error");
        return;
      }
      res.json(data);
    });
  });

  app.get("/books", (req, res) => {
    con.query("SELECT * FROM books", (err, data) => {
      if (err) {
        console.error("Error fetching books", err);
        res.status(500).send("Internal Server Error");
        return;
      }
      res.json(data);
    });
  });

  app.get("/authors/:id", (req, res) => {
    const authorId = req.params.id;
    con.query(
      "SELECT * FROM authors WHERE author_id = ?",
      [authorId],
      (err, data) => {
        if (err) {
          console.error("Error fetching author", err);
          res.status(500).send("Internal Server Error");
          return;
        }
        res.send(data);
      }
    );
  });

  app.get("/books/byAuthor/:authorId", (req, res) => {
    const authorId = req.params.authorId;
    con.query(
      "SELECT * FROM books WHERE author_id = ?",
      [authorId],
      (err, data) => {
        if (err) {
          console.error("Error fetching books by author", err);
          res.status(500).send("Internal Server Error");
          return;
        }
        res.json(data);
      }
    );
  });

  // ----------filter with letter A-----------
  app.get("/getA", (req, res) => {
    const q = "SELECT * FROM authors WHERE author_name LIKE ? ";

    con.query(q, ["A%"], (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      } else {
        res.json(data);
        console.log("Data got Name starting with A");
      }
    });
  });

  // ----------orderby ascending order----------
  app.get("/books/sortedByTitle", (req, res) => {
    con.query("SELECT * FROM books ORDER BY title", (err, data) => {
      if (err) {
        console.error("Error fetching books", err);
        res.status(500).send("Internal Server Error");
        return;
      }
      res.json(data);
    });
  });

  // app.delete("/authors/deleteAuthor1", (req, res) => {
  //   const authorName = "Author1";
  //   con.query(
  //     "DELETE FROM authors WHERE author_name = ?",
  //     [authorName],
  //     (err, results) => {
  //       if (err) {
  //         console.error("Error deleting author", err);
  //         res.status(500).send("Internal Server Error");
  //         return;
  //       }
  //       if (results.affectedRows === 0) {
  //         res.status(404).send("Author not found for deletion");
  //       } else {
  //         res.status(200).send("Author deleted successfully");
  //       }
  //     }
  //   );
  // });

  //  delete..................

  app.delete("/delete", (req, res) => {
    const authorIdToDelete = 8;
    const deleteAuthorQuery = "DELETE FROM authors WHERE author_id = ?";

    con.query(deleteAuthorQuery, [authorIdToDelete], (err, data) => {
      if (err) {
        console.error("Error deleting author", err);
        res.json({ error: "Error deleting author" });
      } else {
        res.json({ success: "Author deleted successfully" });
        res.send(data);
        console.log("Deleted successfully");
      }
    });
  });

  // ----------intermediate level----------
  // ----------update----------
  app.put("/update/:authorId", (req, res) => {
    const authorToUpdate = req.params.authorId;
    const newBirthYear = req.body.newBirthYear;
    console.log("AuthorId", authorToUpdate);
    console.log("newBirthYear", newBirthYear);
    if (!newBirthYear) {
      console.log("New birth year is missing in the request body");
      res.status(400).send({ message: "New birth year is required" });
      return;
    }
    const updateAuthorQuery =
      "UPDATE authors SET birth_year = ? WHERE author_id = ?";
    con.query(
      updateAuthorQuery,
      [newBirthYear, authorToUpdate],
      (err, data) => {
        if (err) {
          console.error("Error in update", err);
          res.status(500).send("Internal server error");
        } else {
          if (data.affectedRows === 1) {
            res.send(data);
            res.status(200).send("Author is successfully updated");
          } else {
            res.status(404).send("Author is not found");
          }
        }
      }
    );
  });

  // ----------joins table----------
  app.get("/bookwithauthor", (req, res) => {
    const joinquery =
      "SELECT books.title AS book_title, authors.author_name FROM books " +
      "JOIN authors ON books.author_id = authors.author_id";
    con.query(joinquery, (err, data) => {
      if (err) {
        console.error("Error fetching data", err);
        res.status(500).send("Internal server error");
        return;
      }
      res.json(data);
    });
  });

  // ----------conditional selections----------
  app.get("/bookpublished", (req, res) => {
    const publishedquery = "SELECT * FROM books WHERE publication_year < 2010";
    con.query(publishedquery, (err, data) => {
      if (err) {
        console.error("Error published data", err);
        res.status(500).send("Internal server error");
        return;
      }
      res.json(data);
    });
  });

  // ----------Aggregrate function avg----------
  // ----------avg----------
  app.get("/bookavg", (req, res) => {
    const avgquery =
      "SELECT AVG(publication_year) AS average_publication_year FROM books";
    con.query(avgquery, (err, data) => {
      if (err) {
        console.error("Error calculation of the books");
        res.status(500).send("Internal server error");
        return;
      }
      res.json(data);
    });
  });

  // ----------subquery IN----------
  app.get("/subquerywithin", (req, res) => {
    const subquery =
      "SELECT author_id FROM authors WHERE birth_year >= 1990 AND birth_year < 2000 ";
    const query = "SELECT * FROM books WHERE author_id IN (" + subquery + ")";
    con.query(query, (err, data) => {
      if (err) {
        console.error("Error in the subquery", err);
        res.status(500).send("Internal server error");
        return;
      }
      res.json(data);
    });
  });

  // ----------updating with join----------
  app.put("/updatePublicationYear/:authorId", (req, res) => {
    console.log("Request Body", req.body);
    const authorToUpdate = req.params.authorId;
    const newPublicationYear = req.body.newPublicationYear;

    console.log("AuthorId", authorToUpdate);
    console.log("newPublicationYear", newPublicationYear);

    if (!newPublicationYear) {
      console.log("New publication year is missing in the request body");
      res.status(400).send({ message: "New publication year is required" });
      return;
    }
    const updatePublicationYearQuery =
      "UPDATE books " + "SET publication_year = ? " + "WHERE author_id = ?";
    con.query(
      updatePublicationYearQuery,
      [newPublicationYear, authorToUpdate],
      (err, data) => {
        if (err) {
          console.error("Error in update", err);
          res.status(500).send("Internal server error");
        } else {
          if (data.affectedRows === 0) {
            res.status(404).send("Author not found or no books by the author");
          } else {
            res.status(200).send("Publication year updated successfully");
          }
        }
      }
    );
  });

  // ----------group by and having----------
  app.get("/authors/moreThanTwoBooks", (req, res) => {
    const query =
      "SELECT authors.author_id, authors.author_name, COUNT(books.book_id) AS book_count " +
      "FROM authors " +
      "JOIN books ON authors.author_id = books.author_id " +
      "GROUP BY authors.author_id " +
      "HAVING book_count > 2";

    con.query(query, (err, data) => {
      if (err) {
        console.error("Error fetching authors with more than two books", err);
        res.status(500).send("Internal Server Error");
        return;
      }
      res.json(data);
    });
  });

  // ----------limit and offset----------
  app.get("/limitoffset", (req, res) => {
    const limit = 4; //no.of rows to be displayed
    const offset = 1; //no.of rows to be skipped
    const limitoffsetquery = "SELECT * FROM authors LIMIT ? OFFSET ?";
    con.query(limitoffsetquery, [limit, offset], (err, data) => {
      if (err) {
        console.error("Error in the limit and offset");
        res.status(500).send("Internal server error");
        return;
      }
      res.send(data);
    });
  });

  // advanced level
  // ----------subquery----------
  app.get("/subquery", (req, res) => {
    const subquery =
      "SELECT author_id FROM books WHERE publication_year < 1990";
    const query = "SELECT * FROM authors WHERE author_id IN (" + subquery + ")";
    con.query(query, (err, data) => {
      if (err) {
        console.error("Error in subquery", err);
        res.status(500).send("Internal server error");
        return;
      }
      res.send(data);
    });
  });

  // ----------indexing----------
  app.get("/indexing", (req, res) => {
    const indexquery = "CREATE INDEX author_id_index ON books(author_id)";
    con.query(indexquery, (err, data) => {
      if (err) {
        console.error("Error in the index", err);
        res.status(500).send("Internal server error");
      }
      res.status(200).send(data);
    });
  });

  // ----------view----------
  app.get("/view", (req, res) => {
    const viewquery = "SELECT * FROM AuthorBookDetails";
    con.query(viewquery, (err, data) => {
      if (err) {
        console.error("Error in the view", err);
        res.status(500).send("Internal server error");
      }
      res.send(data);
    });
  });

  // ----------stored procedures----------
  app.get("/storedprocedures", (req, res) => {
    const authorName = req.params.authorName;
    const callProcudureQuery = `CALL GetBooksByAuthor('${authorName}')`;

    con.query(callProcudureQuery, (err, data) => {
      if (err) {
        return res.status(500).send("Internal server error");
      }
      res.json({
        author: authorName,
        books: data[0],
      });
    });
  });

  // ----------Transaction(Rollback)----------
  app.put("/updateAuthor/:authorName", (req, res) => {
    const authorName = req.params.authorName;
    const newBirthYear = req.body.birthYear;

    con.beginTransaction((err) => {
      if (err) {
        res.status(500).json({ error: "Error beginning transaction" });
        throw err;
      }
      const updateAuthorQuery = `
        UPDATE Authors
        SET birth_year = ?
        WHERE author_name = ?;
      `;
      con.query(updateAuthorQuery, [newBirthYear, authorName], (err) => {
        if (err) {
          connection.rollback(() => {
            res.status(500).json({ error: "Error updating author" });
            throw err;
          });
        }
        con.commit((err) => {
          if (err) {
            con.rollback(() => {
              res.status(500).json({ error: "Error committing transaction" });
              throw err;
            });
          }
          res.json({ message: "Author updated successfully" });
        });
      });
    });
  });

  app.delete("/deleteBook/:bookTitle", (req, res) => {
    const bookTitle = req.params.bookTitle;
    con.beginTransaction((err) => {
      if (err) {
        res.status(500).json({ error: "Error beginning transaction" });
        throw err;
      }
      const deleteBookQuery = `
        DELETE FROM Books
        WHERE title = ?;
      `;
      con.query(deleteBookQuery, [bookTitle], (err) => {
        if (err) {
          connection.rollback(() => {
            res.status(500).json({ error: "Error deleting book" });
            throw err;
          });
        }
        con.commit((err) => {
          if (err) {
            con.rollback(() => {
              res.status(500).json({ error: "Error committing transaction" });
              throw err;
            });
          }
          res.json({ message: "Book deleted successfully" });
        });
      });
    });
  });

  // ----------created a port----------
  const port = 8080;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
