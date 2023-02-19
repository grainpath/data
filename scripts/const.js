export const ASSETS_BASE_ADDR = "../assets";

export const MONGO_DATABASE = "grainpath";
export const MONGO_GRAIN_COLLECTION = "grain";
export const MONGO_INDEX_COLLECTION = "index";
export const MONGO_CONNECTION_STRING = process.env.GRAINPATH_DBM_CONN;

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

export const isValidKeyword = (keyword) => {
  return (new RegExp(KEYWORD_SNAKE_CASE_PATTERN)).test(keyword)
    && keyword.length >= KEYWORD_LENGTH_LIMIT_MIN
    && keyword.length <= KEYWORD_LENGTH_LIMIT_MAX
}
