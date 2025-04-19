async function fetchProducts(req, res, next) {
  const headphones = await products.aggregate([
    {
      $match: { categories: { $elemMatch: { id: '172541' } } },
    },
    {
      $sample: { size: 8 },
    },
  ]);

  const laptops = await products.aggregate([
    {
      $match: { categories: { $elemMatch: { id: '13896617011' } } },
    },
    {
      $sample: { size: 8 },
    },
  ]);
  sendResponse(res, 200, 'products loaded', { headphones, laptops });
}
