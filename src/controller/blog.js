const Blog = require("../models/blog");

exports.createBlog = async (req, res) => {
  let { title, content, description } = req.body;
  let { _id } = req.user;
  let coverImg = req.file.path.split("\\").pop().split("/").pop();

  // if (req.files != null) {
  //   // productPictures = req.files.map((file) => {
  //   //   return { img: file.filename };
  //   // });

  console.log();
  // }

  try {
    let newBlog = await new Blog({
      title,
      content,
      description,
      createdBy: _id,
      coverImg,
    }).save();

    res.json(newBlog);
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.updateBlog = async (req, res) => {
  let id = req.params.id;
  let { title, content, description } = req.body;

  console.log(req.body);

  try {
    let updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        $set: { title: title, content: content, description: description },
      },
      { new: true }
    );

    res.json(updatedBlog);
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.deleteBlog = async (req, res) => {
  let id = req.params.id;

  try {
    let deletedBlog = await Blog.findByIdAndDelete(id);

    res.json(deletedBlog);
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    let allBlogs = await Blog.find({});

    res.json(allBlogs);
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getBlogById = async (req, res) => {
  let id = req.params.id;

  try {
    let oneBlog = await Blog.findById(id);

    res.json(oneBlog);
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.postUploadBlogImages = async (req, res) => {
  console.log(req.file);
  console.log(req.files);

  if (req.file) {
    res.json({
      url: `https://api.tilakshringar.com/public/${req.file.path
        .split("\\")
        .pop()
        .split("/")
        .pop()}`,
    });
  } else {
    res.status(400).json({
      error: "Invalid Request",
    });
  }
};
