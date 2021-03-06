const { paginate } = require('gatsby-awesome-pagination');

const _ = require(`lodash`);
const Promise = require(`bluebird`);
const path = require(`path`);
const slash = require(`slash`);
const transliteration = require('transliteration');

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions;
  const { type } = node.internal;
  if (type === 'recipes') {
    const slugFragment = transliteration.slugify(node.title);
    const slug = `${slugFragment}`;
    createNodeField({
      node,
      name: `slug`,
      value: slug
    });
    createNodeField({
      node,
      name: `path`,
      value: `/${slug}`
    });
    createNodeField({
      node,
      name: `type`,
      value: type
    });
  }
};
exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;
  return new Promise((resolve, reject) => {
    graphql(
      `
        {
          allRecipes(limit: 100) {
            edges {
              node {
                id
                fields {
                  path
                  type
                }
              }
            }
          }
        }
      `
    ).then(result => {
      if (result.errors) {
        reject(result.errors);
      }
      const articleTemplate = path.resolve(`./src/templates/recipe.jsx`);
      const edges = result.data.allRecipes.edges || [];
      _.each(edges, (edge, key) => {
        if (edge.node.fields.type === 'recipes') {
          createPage({
            path: edge.node.fields.path,
            component: slash(articleTemplate),
            context: {
              id: edge.node.id,
              prev: key > 0 ? edges[key - 1].node.fields.path : null,
              next:
                key < edges.length - 1 ? edges[key + 1].node.fields.path : null
            }
          });
        }
      });
      paginate({
        createPage,
        items: edges,
        itemsPerPage: 9,
        pathPrefix: '/recipes',
        component: path.resolve(`./src/templates/recipes.jsx`)
      });
      resolve();
    });
  });
};
