import { API_URL, API_URL_POST, RES_PER_PAGE, KEY } from "./config.js";
// import { getJSON, sendJSON } from "./helpers.js";
import { AJAX } from "./helpers.js";

export const state = {
  recipe: {},
  search: {
    query: "",
    results: [],
    page: 1,
    resultsPerPage: RES_PER_PAGE,
  },
  bookmarks: [],
};
/**
 * Creates object of the recipe
 * @function
 *
 */

const createRecipeObject = function (data) {
  const { recipe } = data;
  const dataId = data._links.self.href.slice(71);

  return {
    id: dataId, //First ingredient's Id on Id
    calories: recipe.calories, //use instead of id
    title: recipe.label,
    source: recipe.source,
    sourceUrl: recipe.url,
    image: recipe.image,
    cookingTime: recipe.totalTime,
    ingredients: recipe.ingredients,
    servings: recipe.yield,
    publisher: recipe.source,
    ...(recipe.key && { key: recipe.key }),
  };
};

/**
 * Loads the recipe
 * @async
 */

export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}${id}`);
    console.log(data);
    state.recipe = createRecipeObject(data);

    // const res = await fetch(
    //   "https://api.edamam.com/api/recipes/v2?type=public&q=pizza&app_id=c7479dab&app_key=7a7d75d365703f9c3f545ff53fd2819a&health=alcohol-free&calories=1200&time=130&nutrients%5BENERC_KCAL%5D=1000"
    // );

    if (state.bookmarks.some((bookmark) => bookmark.id === id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;

    console.log(state.bookmarks);
  } catch (err) {
    // Temporary error handling

    throw Error(err);
  }
};

/** Helper function for loadSearchResults */

function loadSearchResultsRecipe(rec) {
  return {
    id: rec._links.self.href.slice(38),
    title: rec.recipe.label,
    publisher: rec.recipe.source,
    image: rec.recipe.image,
    ...(rec.key && { key: rec.key }),
  };
}

/**
 * Loads search results
 * @async
 * @param {string} query Query for searching the recipes 
 */

export async function loadSearchResults(query) {
  try {
    state.search.query = query;
    const data = await AJAX(
      `${API_URL}?type=public&q=${query}&app_id=c7479dab&app_key=${KEY}`
    );
    console.log(data);

    state.search.results = data.hits.map(loadSearchResultsRecipe);
    if (!data._links) return;
    let data1 = await AJAX(data._links.next.href);
    state.search.results.push(...data1.hits.map(loadSearchResultsRecipe));
    if (!data1._links) return;
    let data2 = await AJAX(data1._links.next.href);
    console.log(data2);
    state.search.results.push(...data2.hits.map(loadSearchResultsRecipe));
    state.search.page = 1;

    // _links  url for next page of the search result
  } catch (err) {
    console.error(`${err}💥💥💥💥`);
    throw Error(err);
  }
}
/** This function makes number for pagination  */

export function getSearchResultsPage(page = state.search.page) {
  state.search.page = page;
  const start = (page - 1) * state.search.resultsPerPage; //0;
  const end = page * state.search.resultsPerPage; //9;

  return state.search.results.slice(start, end);
}

/**
 * Updates the servings
 * @function
 */
export function updateServings(newServings) {
  state.recipe.ingredients.forEach((ing) => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
    // newQt = oldQt * newServings / oldServings // 2 * 8 / 4 * 4
  });

  state.recipe.servings = newServings;
}

const persistBookmarks = function () {
  localStorage.setItem("bookmarks", JSON.stringify(state.bookmarks));
};
/** Add bookmark */
export const addBookmark = function (recipe) {
  // Add bookmark
  console.log(recipe);
  state.bookmarks.push(recipe);

  // Mark current recipe as bookmarked
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;

  persistBookmarks();
};
/**
 * 
 * @param {string} id Removes bookmark from the bookmarks object
 */

export const deleteBookmark = function (id) {
  // Delete bookmark
  const index = state.bookmarks.findIndex((el) => el.id === id);
  state.bookmarks.splice(index, 1);

  // Mark current recipe as NOT bookmarked
  if (id === state.recipe.id) state.recipe.bookmarked = false;
  persistBookmarks();
};

const init = function () {
  const storage = localStorage.getItem("bookmarks");
  if (storage) state.bookmarks = JSON.parse(storage);
};
init();

const clearBookmarks = function () {
  localStorage.clear("bookmarks");
};
// clearBookmarks();
/**
 * 
 * @async
 * @param {Object} newRecipe Add new recipe 
 */

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter((entry) => entry[0].startsWith("ingredient") && entry[1] !== "")
      .map((ing) => {
        const ingArr = ing[1].split(",").map((el) => el.trim());
        // const ingArr = ing[1].replaceAll(" ", "").split(",");
        if (ingArr.length !== 3)
          throw new Error(
            "Wrong ingredient format! Please use the correct format :)"
          );
        const [quantity, unit, description] = ingArr;
        return { quantity: quantity ? +quantity : null, unit, description };
      });

    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image: newRecipe.image,
      publisher: newRecipe.publisher,
      cookingTime: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };

    const data = await AJAX(
      `${API_URL}?&app_id=c7479dab&app_key=${KEY}`,
      recipe
    );
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};
