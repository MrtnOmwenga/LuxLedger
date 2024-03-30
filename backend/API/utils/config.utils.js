import dotenv from 'dotenv';
dotenv.config();

const { PORT } = process.env;
const { SECRET } = process.env;
const { PRODUCT_INFORMATION } = process.env;
const { LOT_INFORMATION } = process.env;
const { ESCROW } = process.env;

/*
module.exports = {
  PORT,
  SECRET,
  PRODUCT_INFORMATION,
  LOT_INFORMATION,
  ESCROW
};
*/

export default {
  PORT,
  SECRET,
  PRODUCT_INFORMATION,
  LOT_INFORMATION,
  ESCROW
};