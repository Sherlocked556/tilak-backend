const Product = require("../models/product");
const shortid = require("shortid");
const slugify = require("slugify");
const Category = require("../models/category");

exports.createProduct = (req, res) => {
  //res.status(200).json( { file: req.files, body: req.body } );

  const {
    name,
    price,
    description,
    category,
    quantity,
    variant,
    createdBy,
  } = req.body;
  let productPictures = [];
  let variants = [];

  console.log(req.files);

  if (req.files.length > 0) {
    productPictures = req.files.map((file) => {
      const fileName = file.path.split("\\").pop().split("/").pop();

      return { img: fileName };
    });
  }

  // console.log(req.body.images);

  let product;

  if (variant) {
    variants = JSON.parse(variant);
  }

  if (variants.length > 0) {
    // console.log(variants);
    let low = Number.POSITIVE_INFINITY;
    let tmp;

    for (let i = 0; i < variants.length; i++) {
      tmp = variants[i].price;
      if (tmp < low) low = tmp;
    }

    product = new Product({
      name: name,
      slug: slugify(name),
      quantity,
      description,
      productPictures,
      category,
      createdBy: req.user._id,
      availability: quantity > 0 ? true : false,
      areVariants: true,
      variants,
      price: low,
    });
  } else {
    product = new Product({
      name: name,
      slug: slugify(name),
      price,
      quantity,
      description,
      productPictures,
      category,
      createdBy: req.user._id,
      areVariants: false,
      availability: quantity > 0 ? true : false,
    });
  }

  product.save((error, product) => {
    if (error) {
      console.log(error);
      return res.status(400).json({ error });
    }
    if (product) {
      res.status(201).json({ product });
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
                  under5k: products.filter((product) => product.price <= 5000),
                  under10k: products.filter(
                    (product) => product.price > 5000 && product.price <= 10000
                  ),
                  under15k: products.filter(
                    (product) => product.price > 10000 && product.price <= 15000
                  ),
                  under20k: products.filter(
                    (product) => product.price > 15000 && product.price <= 20000
                  ),
                  under30k: products.filter(
                    (product) => product.price > 20000 && product.price <= 30000
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
      "_id name price quantity slug description productPictures category availability"
    )
    .populate({ path: "category", select: "_id name" })
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
  let variant = [];

  product.areVariants = product.areVariants === "true" ? true : false;
  product.availability = product.availability === "true" ? true : false;

  if (parseInt(product.quantity) === 0) {
    product.availability = false;
  }

  if (product.areVariants) {
    variant = JSON.parse(product.variant);
  }

  if (req.files.length > 0) {
    newProductPictures = req.files.map((file) => {
      return { img: file.filename };
    });
  }

  console.log("new pics", newProductPictures);

  product.productPictures = [
    ...JSON.parse(product.prevProductImages),
    ...newProductPictures,
  ];

  product.variants = variant;

  delete product.prevProductImages;
  delete product.variant;

  console.log(product);

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
