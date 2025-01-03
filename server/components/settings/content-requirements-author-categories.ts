export default {
    "collectionName": "components_prokodo_cat_author_categories",
    "info": {
      "name": "Author-Category",
      "icon": "user-tag",
      "description": "Represents an author and their associated category."
    },
    "attributes": {
      "authorId": {
        "type": "integer",
        "required": true,
        "description": "ID of the author from the user-defined author content type."
      },
      "categoryId": {
        "type": "integer",
        "required": false,
        "description": "ID of the category from the user-defined category content type."
      }
    }
  }
  