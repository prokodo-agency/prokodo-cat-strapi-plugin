export default {
    "collectionName": "components_prokodo_cat_settings_content_requirements",
    "info": {
        "singularName": "content-requirements",
        "pluralName": "content-requirements",
        "displayName": "Content Requirements",
        "description": "Defines the requirements for generated content."
    },
    "attributes": {
        "domain": {
            "type": "string",
            "required": true,
            "minLength": 3,
            "regex": "^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            "errorMessage": {
                "required": "Domain is required.",
                "minLength": "Domain must be at least 3 characters long.",
                "regex": "Invalid domain format. Expected format like 'example.com'."
            }
        },
        "plagiarize_max_retries": {
            "type": "integer",
            "required": true,
            "min": 1,
            "max": 10,
            "default": 3,
            "errorMessage": {
                "required": "plagiarize_max_retries is required.",
                "min": "plagiarize_max_retries must be at least 1.",
                "max": "plagiarize_max_retries cannot exceed 10."
            }
        },
        "textModel": {
            "type": "enumeration",
            "enum": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4"],
            "required": true,
            "default": "gpt-4o",
            "errorMessage": {
                "required": "textModel is required.",
                "enum": "Invalid textModel selected."
            }
        },
        "contentLength": {
            "type": "integer",
            "required": true,
            "min": 1,
            "max": 2500,
            "default": 1000,
            "errorMessage": {
                "required": "contentLength is required.",
                "min": "contentLength must be at least 1.",
                "max": "contentLength cannot exceed 2500."
            }
        },
        "contentLengthExact": {
            "type": "boolean",
            "default": false,
            "description": "Determines if the content length should be exact."
        },
        "defaultAuthors": {
            "type": "component",
            "repeatable": true,
            "component": "prokodo-cat.settings.content-requirements-author-categories",
            "required": false,
            "description": "List of authors and their associated categories."
        }
    }
}
