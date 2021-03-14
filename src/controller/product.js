const Product = require("../models/product");
const shortid = require("shortid");
const slugify = require("slugify");
const Category = require("../models/category");

exports.createProduct = (req, res) => {
  let {
    name,
    basePrice,
    description,
    quantity,
    size,
    areSizes,
    createdBy,
  } = req.body;
  let productPictures = [];
  let sizes = [];

  areSizes = areSizes === "true" ? true : false;

  if (req.files.length > 0) {
    productPictures = req.files.map((file) => {
      const fileName = file.path.split("\\").pop().split("/").pop();

      return { img: fileName };
    });
  }

  let product;

  if (size) {
    sizes = JSON.parse(size);
  }

  Product.findOne({ slug: slugify(name) }).then((oldProduct) => {
    if (oldProduct) {
      return res.status(400).json({
        success: false,
        msg: "Product with same name already exists",
      });
    } else {
      if (areSizes) {
        let avial = false;

        for (let i = 0; i < sizes.sizeVariants.length; i++) {
          if (sizes.sizeVariants[i].quantity > 0) {
            // console.log(sizes.sizeVariants[i].quantity);
            avial = true;
            break;
          }
        }

        product = new Product({
          name: name,
          slug: slugify(name),
          description,
          productPictures,
          category: "",
          createdBy: req.user._id,
          availability: avial,
          areSizes: true,
          sizes: {
            sizeUnit: sizes.sizeUnit,
            sizeVariants: sizes.sizeVariants,
          },
          basePrice,
        });
      } else {
        product = new Product({
          name: name,
          slug: slugify(name),
          basePrice,
          quantity,
          description,
          productPictures,
          category: "",
          createdBy: req.user._id,
          areSizes: false,
          availability: quantity > 0 ? true : false,
        });
      }

      product.save((error, product) => {
        if (error) {
          console.log(error);
          return res.status(400).json({ error });
        }
        if (product) {
          return res.status(201).json({ product });
        }
      });
    }
  });
};

exports.getProductsBySlug = (req, res) => {
  const { slug } = req.params;
  Category.findOne({ slug: slug })
    .select("_id type")
    .exec((error, category) => {
      if (error) {
        return res.status(400).json({ error });
      }

      if (category) {
        Product.find({ category: category._id }).exec((error, products) => {
          if (error) {
            return res.status(400).json({ error });
          }

          if (category.type) {
            if (products.length > 0) {
              res.status(200).json({
                products,
                priceRange: {
                  under5k: 5000,
                  under10k: 10000,
                  under15k: 15000,
                  under20k: 20000,
                  under30k: 30000,
                },
                productsByPrice: {
                  under5k: products.filter(
                    (product) => product.basePrice <= 5000
                  ),
                  under10k: products.filter(
                    (product) =>
                      product.basePrice > 5000 && product.basePrice <= 10000
                  ),
                  under15k: products.filter(
                    (product) =>
                      product.basePrice > 10000 && product.basePrice <= 15000
                  ),
                  under20k: products.filter(
                    (product) =>
                      product.basePrice > 15000 && product.basePrice <= 20000
                  ),
                  under30k: products.filter(
                    (product) =>
                      product.basePrice > 20000 && product.basePrice <= 30000
                  ),
                },
              });
            }
          } else {
            res.status(200).json({ products });
          }
        });
      }
    });
};

exports.getProductDetailsById = (req, res) => {
  const { productId } = req.params;
  if (productId) {
    Product.findOne({ _id: productId }).exec((error, product) => {
      if (error) return res.status(400).json({ error });
      if (product) {
        res.status(200).json({ product });
      }
    });
  } else {
    return res.status(400).json({ error: "Params required" });
  }
};

// new update
exports.deleteProductById = (req, res) => {
  const { productId } = req.params;
  if (productId) {
    Product.deleteOne({ _id: productId }).exec((error, result) => {
      if (error) return res.status(400).json({ error });
      if (result) {
        res.status(202).json({ result, productId });
      }
    });
  } else {
    res.status(400).json({ error: "Params required" });
  }
};

exports.getProducts = async (req, res) => {
  const products = await Product.find({ createdBy: req.user._id })
    .select(
      "_id name basePrice quantity slug description productPictures availability areSizes"
    )
    .exec();

  res.status(200).json({ products });
};

exports.patchProduct = async (req, res) => {
  const { products } = req.body;
  let updateProducts = [];

  try {
    if (!products || products.length <= 0) {
      throw new Error("No products need updates");
    }

    for (let i = 0; i < products.length; i++) {
      let update = await Product.findByIdAndUpdate(products[i]._id, {
        ...products[i],
      });

      updateProducts.push(products[i]);
    }

    res.json({ success: true, updateProducts });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Bad Request" || error.message,
      error,
    });
  }
};

exports.patchProductById = async (req, res) => {
  let product = req.body;

  console.log(product);

  let newProductPictures = [];
  let size = [];

  product.areSizes = product.areSizes === "true" ? true : false;
  product.availability = product.availability === "true" ? true : false;

  if (product.quantity && !product.areSizes) {
    if (parseInt(product.quantity) === 0) {
      product.availability = false;
    }
  }

  if (product.areSizes) {
    size = JSON.parse(product.size);
  }

  if (req.files.length > 0) {
    newProductPictures = req.files.map((file) => {
      const fileName = file.path.split("\\").pop().split("/").pop();

      return { img: fileName };
    });
  }

  // console.log("new pics", newProductPictures);

  if (product.prevProductImages) {
    product.productPictures = [
      ...JSON.parse(product.prevProductImages),
      ...newProductPictures,
    ];
  } else {
    product.productPictures = [...newProductPictures];
  }

  product.sizes = size;

  delete product.prevProductImages;
  delete product.size;

  // console.log(product);

  try {
    if (!product) {
      throw new Error("No products need updates");
    }

    let update = await Product.findByIdAndUpdate(product._id, product, {
      new: true,
    });

    if (!update) {
      throw new Error("Error in updating");
    }

    res.json({ success: true, update });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      msg: "Bad Request" || error.message,
      error,
    });
  }
};
