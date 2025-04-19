const axios = require('axios');
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product must have a name'],
    unique: true,
  },
  details: {
    productSpecs: [
      {
        name: String,
        value: String,
      },
    ],
    aboutProduct: {
      type: Array,
    },
  },
  asin: String,
  link: String,
  images: [],
  categories: {},
  image: {
    type: String,
  },
  rating: {
    type: Number,
    required: true,
  },
  price: {
    type: Object,
    required: true,
  },
});

// set up the request parameters => computer & tablets => headphones =>monitors => camera & photo => computer components => cell phones and accessories => computer & accessories => Laptop accessories
// const params = {
//   api_key: "028C7B4D78684D5E8343B58F1C3042C3",
//   type: "category",
//   url: "https://www.amazon.com/s?i=specialty-aps&bbn=16225007011&rh=n%3A16225007011%2Cn%3A3011391011",
//   max_page: "3",
//   output: "json",
//   include_html: "false",
// };

productSchema.index({ title: 'text' });

const product = mongoose.model('product', productSchema);

// (async function () {
//   console.log("working...");
//   try {
//     const response = await axios.get("https://api.rainforestapi.com/request", {
//       params,
//     });
//     await product.create(response.data.category_results);
//     console.log("loaded...");
//   } catch (err) {
//     console.log(err);
//   }
// })();

module.exports = product;
