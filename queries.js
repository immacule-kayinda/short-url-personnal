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
