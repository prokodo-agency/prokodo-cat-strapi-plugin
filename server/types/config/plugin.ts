
export type PluginSettingsSchemaFieldsSeoMetaSocial = {
    contentTypeName: string; // The content type of component (e.g., 'seo.metaSocial')
    socialNetwork: string; // Field for SEO social network (e.g., Facebook or Twitter)
    title: string; // Field for SEO social title
    description: string; // Field for SEO social description
    imageUrl: string; // Field for SEO social image
}

export type PluginSettingsSchemaFieldsSeo = {
    contentTypeName: string;
    metaTitle: string; // Field for SEO meta title
    metaDescription: string; // Field for SEO meta description
    metaImage: string; // Field for SEO meta image
    metaSocial?: PluginSettingsSchemaFieldsSeoMetaSocial;
    keywords: string; // Field for SEO keywords
}

export type PluginSettingsSchemaFieldsCategory = {
    contentTypeName: string; // Relation field for category
    name: string; // Name field of category
}

export type PluginSettingsMailchimpOAuth = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export type PluginSettingsOAuth = {
    mailchimp?: PluginSettingsMailchimpOAuth;
}

export type PluginSettingsSchema = {
    contentTypes: {
        article: string; // The content type for articles (e.g., 'api::article.article')
        category?: string; // The content type for categories (e.g., 'api::category.category')
    };
    fields: {
        title: string; // Field for the article title
        slug: string; // Field for the article slug
        description: string; // Field for the article description
        cover: string; // Field for the article cover image
        blocks: string; // Field for the article blocks (dynamic zone)
        category?: PluginSettingsSchemaFieldsCategory;
        author?: string; // Relation field for authors
        publishedAt: string; // Field for published date
        seo?: PluginSettingsSchemaFieldsSeo;
    };
    dynamicZone: {
        blocks: Array<{
            component: string; // Component identifier (e.g., 'sections.content-area')
            fields: {
                title: string; // Field for block title
                subTitle: string; // Field for block subtitle
                content: string; // Field for block content
                image: string; // Field for block image
            };
        }>;
    };
}

export interface PluginSettings {
    auth?: PluginSettingsOAuth,
    schema: PluginSettingsSchema
}
  