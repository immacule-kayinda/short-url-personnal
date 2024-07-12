const db = require("./db");

async function linkList(username) {
  try {
    const userId = await db.query("SELECT * FROM public.users WHERE id=$1", [
      username,
    ]);
    const result = await db.query(
      "SELECT * FROM public.links WHERE user_id=$1",
      [userId]
    );
    return result.rows;
  } catch (err) {
    console.error(err);
  }
}

async function createLink(link) {
  try {
    const result = await db.query(
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
        link.username,
      ]
    );
  } catch (error) {}
}

const createUser = async (body) => {
  const { firstname, lastname, username, password, confirmPassword, email } =
    body;
  if (!firstname || !lastname || !username || !password || !email) {
    console.log(request);
    throw new Error("Tous les champs requis doivent être fournis.");
  }
  try {
    const result = await db.query(
      `INSERT INTO public.users(
            nom, postnom, username, password, email)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
      [firstname, lastname, username, password, email]
    );
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  createLink,
  createUser,
};
