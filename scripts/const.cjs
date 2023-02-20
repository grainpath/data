const ASSETS_BASE_ADDR = "../assets";

const MONGO_DATABASE = "grainpath";
const MONGO_GRAIN_COLLECTION = "grain";
const MONGO_INDEX_COLLECTION = "index";
const MONGO_CONNECTION_STRING = process.env.GRAINPATH_DBM_CONN;

/**
 * Extracted value should have lehgth at least `MIN` chars.
 */
const KEYWORD_LENGTH_LIMIT_MIN = 3;

/**
 * Extracted value should have lehgth at most `MAX` chars.
 */
const KEYWORD_LENGTH_LIMIT_MAX = 25;

/**
 * All extracted keywords should comply with the pattern.
 */
const KEYWORD_SNAKE_CASE_PATTERN = /^[a-z]+(?:[_][a-z]+)*$/;

const isValidKeyword = (keyword) => {
  return (new RegExp(KEYWORD_SNAKE_CASE_PATTERN)).test(keyword)
    && keyword.length >= KEYWORD_LENGTH_LIMIT_MIN
    && keyword.length <= KEYWORD_LENGTH_LIMIT_MAX
}

module.exports = {
  ASSETS_BASE_ADDR: ASSETS_BASE_ADDR,
  MONGO_DATABASE: MONGO_DATABASE,
  MONGO_GRAIN_COLLECTION: MONGO_GRAIN_COLLECTION,
  MONGO_INDEX_COLLECTION: MONGO_INDEX_COLLECTION,
  MONGO_CONNECTION_STRING: MONGO_CONNECTION_STRING,
  isValidKeyword: isValidKeyword
};
