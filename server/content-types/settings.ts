export default {
    "kind": "collectionType",
    "collectionName": "prokodo_cat_settings",
    "info": {
        singularName: "setting",
        pluralName: "settings",
        displayName: "Settings",
        description: "Stores plugin settings for content automation"
    },
    attributes: {
        frequency: {
            type: "enumeration",
            enum: ["daily", "weekly"],
            required: true,
            default: "daily"
        },
        newsletter_schedule: {
            type: "time",
            required: true
        },
        newsletter_day: {
            type: "enumeration",
            enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            required: false
        },
        timezone: {
            type: "string",
            required: true,
            default: "UTC",
            regex: "^(?:Etc\\/UTC|(?:America|Europe|Asia|Australia|Africa|Pacific|Indian|Atlantic)\\/[A-Za-z_]+)$",
            description: "IANA timezone string, e.g., 'America/New_York'"
        },
        mailchimp_account: {
            type: "relation",
            relation: "oneToOne",
            target: "plugin::prokodo-cat.mailchimp-account",
            required: false,
            configurable: true,
            description: "Associated Mailchimp Account",
        },
        content_requirements: {
            type: "component",
            repeatable: false,
            component: "prokodo-cat.settings.content-requirements"
        }
    }
}
