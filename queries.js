const db = require("./db");

function createLink(link) {
  try {
    db.query(
      `INSERT INTO public.links(
        url_shortened, base_url, qr_generated, is_deleted, visitors, id_user
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
    `,
      [
        link.url,
        link.base_url,
        link.qr,
        link.is_deleted,
        link.metrics.visited,
        link.userId,
      ]
    );
  } catch (error) {}
}


function createUser(user) {
    try {
      db.query(
        `INSERT INTO public.users(
            nom, postnom, username, password)
            VALUES ($1, $2, $3, $4,);`,
        [user.firstName, user.lastName, user.username, user.password]
      );
    } catch (error) {}
  }
