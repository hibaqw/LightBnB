const properties = require('./json/properties.json');
const users = require('./json/users.json');
//establish database connection
const { Pool } = require('pg');
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});
pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {console.log(response)})
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  return pool
    .query(`SELECT * FROM users WHERE users.email LIKE $1`, [email])
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
}

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {

  return pool
    .query(`SELECT * FROM users WHERE users.id = $1`, [id])
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
  


}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  
return pool.query( `INSERT INTO 
  users(name, email, password)
VALUES
  ($1, $2, $3)
RETURNING *
`, [user.name, user.email, user.password])
.then(result => result.rows)
.catch(err => console.log(err.stack));
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const query= `SELECT reservations.*, properties.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2`
  return pool.query(query, [guest_id, limit])
              .then(result => {return result.rows}
                )
              .catch((err) => {
                console.log(err.message);
              });

}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
 
  const queryParmas = [];

  //2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  FULL OUTER JOIN property_reviews ON properties.id = property_reviews.property_id
  `;

  //3
  if (options.city) {
    queryParmas.push(`%${options.city}%`);
    queryString += `WHERE city ILIKE $${queryParmas.length}`;
  }

  if (options.owner_id) {
    queryParmas.push(options.owner_id);
    queryString += `AND owner_id = $${queryParmas.length}`;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParmas.push(parseInt(options.minimum_price_per_night));
    queryString += `AND cost_per_night >= $${queryParmas.length}`;
    queryParmas.push(parseInt(options.maximum_price_per_night));
    queryString += `AND cost_per_night <= $${queryParmas.length}`;
  }

  //4
  queryString += `GROUP BY properties.id `;
  if (options.minimum_rating) {
    queryParmas.push(parseInt(options.minimum_rating));
    queryString += `HAVING avg(rating) >= $${queryParmas.length}`;
  }
  queryParmas.push(limit);
  queryString +=  `ORDER BY cost_per_night
  LIMIT $${queryParmas.length};
`;
  return pool.query(queryString, queryParmas)
    .then(result => result.rows)
    .catch(err => err.stack);
}


exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
