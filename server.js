const cors = require("cors");
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "Bookstore",
});

connection.beginTransaction((err) => {
  if (err) throw err;
  console.log("Connected to the MySQL database."); // transaction

  const createAuthorsTableQuery = `
    CREATE TABLE IF NOT EXISTS Authors (
      author_id INT PRIMARY KEY AUTO_INCREMENT,
      author_name VARCHAR(255) NOT NULL,
      birth_year INT,
      INDEX author_id_index(author_id) //index and performance
    );
  `;

  connection.query(createAuthorsTableQuery, (err) => {
    if (err) {
      connection.rollback(() => {
        throw err;
      });
    }

    const insertAuthorsDataQuery = `
    INSERT INTO Authors (author_name, birth_year) VALUES
      ('Satyajit Ray', 1980),
      ('Anurag Behar', 1975),
      ('Perumal Murugan', 1990),
      ('Pyre', 2014),
      ('East of Eden', 2005),
      ('Number the Stars', 2012);
  `;

    connection.query(insertAuthorsDataQuery, (err) => {
      if (err) {
        connection.rollback(() => {
          throw err;
        });
      }

      const selectAuthorsQuery = "SELECT * FROM Authors";
      connection.query(selectAuthorsQuery, (err, authors) => {
        if (err) throw err;
        console.log("Authors Table:");
        console.log(authors);
        const deleteAuthorQuery =
          'DELETE FROM Authors WHERE author_name = "Satyajit Ray"';
        connection.query(deleteAuthorQuery, (err) => {
          if (err) {
            connection.rollback(() => {
              throw err;
            });
          }
          const createBooksTableQuery = `
            CREATE TABLE IF NOT EXISTS Books (
              book_id INT PRIMARY KEY AUTO_INCREMENT,
              title VARCHAR(255) NOT NULL UNIQUE,
              author_id INT,
              publication_year INT,
              FOREIGN KEY (author_id) REFERENCES Authors(author_id)
              INDEX author_id_index(author_id)  //index and performance
            );
          `;
          connection.query(createBooksTableQuery, (err) => {
            if (err) {
              connection.rollback(() => {
                throw err;
              });
            }

            // ------------Insert data into Books table------------
            const insertBooksDataQuery = `
            INSERT INTO Books (title, author_id, publication_year) VALUES
              ('DifferentTitle', 1, 1995),
              ('Book2Chhatrapati Shivaji Maharaj', 2, 2000),
              ('As the Wheel Turns', 3, 1984),
              ('The Whispers by Ashley Audrain', 1, 1995),
              ('All the Gold Stars by Rainesford Stauffe', 2, 2000),
              ('Banyan Moon by Thao Thai', 3, 1984);
          `;
            connection.query(insertBooksDataQuery, (err, books) => {
              if (err) {
                connection.rollback(() => {
                  throw err;
                });
              }
              console.log(books);

              // ------------Retrieve authors whose names start with the letter 'J'------------
              const selectAuthorsWithJQuery =
                'SELECT * FROM Authors WHERE author_name LIKE "A%"';
              connection.query(selectAuthorsWithJQuery, (err, authorsWithJ) => {
                if (err) throw err;
                console.log("Authors whose names start with J:");
                console.log(authorsWithJ);

                // ------------Display books in alphabetical order by title------------
                const selectBooksOrderByTitleQuery =
                  "SELECT * FROM Books ORDER BY title";
                connection.query(
                  selectBooksOrderByTitleQuery,
                  (err, booksOrderedByTitle) => {
                    if (err) throw err;
                    console.log("Books ordered by title:");
                    console.log(booksOrderedByTitle);

                    const createViewQuery = `
                        CREATE VIEW AuthorBookDetails AS
                        SELECT Authors.author_id, Authors.author_name, Authors.birth_year, Books.book_id, Books.title, Books.publication_year
                        FROM Authors
                        LEFT JOIN Books ON Authors.author_id = Books.author_id;
                      `;

                    connection.query(createViewQuery, (err) => {
                      if (err) {
                        connection.rollback(() => {
                          console.error("Error creating view:", err);
                          throw err;
                        });
                      }

                      console.log(
                        "View AuthorBookDetails created successfully."
                      );

                      // ------------Query the created view to retrieve author details along with book titles------------
                      const selectViewQuery = "SELECT * FROM AuthorBookDetails";
                      connection.query(selectViewQuery, (err, results) => {
                        if (err) {
                          connection.rollback(() => {
                            //rollback is restore the values
                            console.error("Error querying view:", err);
                            throw err;
                          });
                        }

                        console.log("AuthorBookDetails View Results:");
                        console.log(results);

                        // ------------stored procedures------------
                        const getbooksauthor = ` 
                        DELIMITER $$
                        CREATE PROCEDURE GetBooksAuthors(IN authorName VARCHAR(255))
                        BEGIN
                        SELECT book.title, book.publication_year FROM books
                        JOIN authors ON books.author_id = authors.authors_id
                        WHERE authors.author_name = authorName;
                        
                        END $$
                        DELIMITER;
                         `;

                        connection.query(getbooksauthor, (err) => {
                          if (err) {
                            connection.rollback(() => {
                              throw err;
                            });
                          }

                          const authorName = "Satyajit Ray";
                          const callProcudureQuery = `CALL getbooksauthor('${authorName}')`;

                          connection.query(callProcudureQuery, (err, data) => {
                            if (err) {
                              connection.rollback(() => {
                                throw err;
                              });
                            }
                            console.log(`Book written by('${authorName}')`);
                            console.log(data);

                            // ------------Transaction(Rollback)------------
                            const updateAuthorQuery = `
                              UPDATE Authors
                              SET birth_year = 2000
                              WHERE author_name = 'Satyajit Ray';
                            `;

                            connection.query(updateAuthorQuery, (err) => {
                              if (err) {
                                return connection.rollback(() => {
                                  throw err;
                                });
                              }

                              const deleteBookQuery = `
                              DELETE FROM Books
                              WHERE title = 'DifferentTitle';
                            `;
                              connection.query(deleteBookQuery, (err) => {
                                if (err) {
                                  return connection.rollback(() => {
                                    throw err;
                                  });
                                }

                                // commit is end the data
                                connection.commit((err) => {
                                  if (err) {
                                    connection.rollback(() => {
                                      throw err;
                                    });
                                  }
                                  connection.end((err) => {
                                    if (err) throw err;
                                    console.log("Connection closed.");
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  }
                );
              });
            });
          });
        });
      });
    });
  });
});
